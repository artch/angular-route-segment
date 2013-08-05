/** https://github.com/artch/angular-route-segment
 *  @author Artem Chivchalov
 *  @license MIT License http://opensource.org/licenses/MIT
 */
'use strict';

/**
 * $routeSegment service listens to $route service and handles 'route segments' - independent parts
 * of a route which can be changed without affecting each other. 
 * 
 * The provider exports the `segment` method to set segments up on configuration stage.
 * 
 * The service exports an object containing the following properties:
 *  - `name` - the current full route segment name, e.g. 'foo.bar.baz';
 *  - `chain` - an array of all segments, each element is an object with its own `name` and `params` properties;
 *  - `startsWith` - a helper method for convenient checking whether the current route is in particular route path,
 *         e.g. if( $routeSegment.current.startsWith('foo.bar') ) {...}
 *  - `contains` - a helper method to check whether the current route contains the given segment       
 * 
 * Usage:
 * 
 * .config(function($routeProvider, $routeSegmentProvider) {
 *      $routeProvider
 *             .when('/foo', 
 *                {segment: 'foo'})
 *             .when('/foo/:id', 
 *                {segment: 'foo.details'})
 *             .when('/foo/:id/bar', 
 *                {segment: 'foo.details.bar'});
 * 
 *      $routeSegmentProvider
 *             .segment('foo', 
 *                {templateUrl: 'tmpl1.html', controller: 'ctrl1'});
 *             .segment('foo.details', 
 *                {templateUrl: 'tmpl2.html', controller: 'ctrl2', dependencies: ['id']});
 *             .segment('foo.details.bar', 
 *                {templateUrl: 'tmpl3.html', controller: 'ctrl3', dependencies: ['id']});
 * })
 * 
 * .controller('ctrl', function($routeSegment) { 
 *      $scope.routeSegment = $routeSegment.current;
 * })
 * 
 * // HTML  
 * <li ng:class="{active: routeSegment.name == 'foo'}">
 * <li ng:class="{active: routeSegment.startsWith('foo.details')}">
 * 
 */

(function(angular) {

angular.module( 'route-segment', [] ).provider( '$routeSegment', 
        ['$routeProvider', function($routeProvider) {
    
    var $routeSegmentProvider = this;
    
    var options = $routeSegmentProvider.options = {
            
        /**
         * When true, it will resolve `templateUrl` automatically 
         * via $http service and put its contents into `template`. 
         * @type {boolean}
         */
        autoLoadTemplates: false,
        
        /**
         * When true, all attempts to call `within` method on non-existing segments
         * will throw an error (you would usually want this behavior in production). 
         * When false, it will transparently create new empty segment (can be useful 
         * in isolated tests).
         * @type {boolean}
         */
        strictMode: false
    };
    
    var segments = this.segments = {},
        rootPointer = pointer(segments, null);
    
    function camelCase(name) {
        return name.replace(/([\:\-\_]+(.))/g, function(_, separator, letter, offset) {
            return offset ? letter.toUpperCase() : letter;
        });
    }
    
    function pointer(segment, parent) {
        
        if(!segment)
            throw new Error('Invalid pointer segment');
        
        var lastAddedName;
        
        return {
            
            /**
             * Adds new segment at current pointer level.
             * 
             * @param name {string} Name of a segment. 
             * @param params {Object} Corresponding params hash. It will being propagated to 'routeSegmentChange' event. 
             * @returns {Object} The same level pointer.
             */
            segment: function(name, params) {
                segment[camelCase(name)] = {params: params};
                lastAddedName = name;
                return this;
            },
            
            /**
             * Traverses into an existing segment, so that subsequent `segment` calls
             * will add new segments as its descendants.
             * 
             * @param segmentName {string} An existing segment's name. If undefined, then the last added segment is selected.             * 
             * @returns {Object} The pointer to the child segment.
             */  
            within: function(childName) {                
                var child;
                childName = childName || lastAddedName;
                
                if(child = segment[camelCase(childName)]) {
                    if(child.children == undefined)
                        child.children = {};
                }
                else {
                    if(options.strictMode)
                        throw new Error('Cannot get into unknown `'+childName+'` segment');
                    else {
                        child = segment[camelCase(childName)] = {params: {}, children: {}};
                    }                
                }        
                return pointer(child.children, this);
            },
            
            /**
             * Traverses up in the tree.
             * @returns {Object} The pointer which are parent to the current one;
             */
            up: function() {
                return parent;
            },
            
            /**
             * Traverses to the root.             * 
             * @returns The root pointer.
             */
            root: function() {
                return rootPointer;
            }
        }
    }
    
    /**
     * The shorthand for $routeProvider.when() method with specified segment.
     */
    $routeSegmentProvider.when = function(route, segment) {
        $routeProvider.when(route, {segment: segment});
        return this;
    }
    
    // Extending the provider with the methods of rootPointer
    // to start configuration.
    angular.extend($routeSegmentProvider, rootPointer);
    
        
    // the service factory
    this.$get = ['$rootScope', '$q', '$http', '$templateCache', '$route', '$routeParams', '$injector',
                 function($rootScope, $q, $http, $templateCache, $route, $routeParams, $injector) {
                
        var $routeSegment = {    
                
                /**
                 * @type {string}
                 */
                name: '',    
                
                /**
                 * @type {Array.<string>}
                 */
                chain: [],
                
                /**
                 * 
                 * @param val {string}
                 * @returns {boolean}
                 */
                startsWith: function (val) {
                    var regexp = new RegExp('^'+val);
                    return regexp.test($routeSegment.name);
                },
                
                /**
                 * 
                 * @param val {string}
                 * @returns {Boolean}
                 */
                contains: function (val) {
                    for(var i=0; i<this.chain.length; i++)
                        if(this.chain[i].name == val)
                            return true;
                    return false;
                }    
        };    
        
        var lastParams = angular.copy($routeParams);        
        
        // When a route changes, all interested parties should be notified about new segment chain
        $rootScope.$on('$routeChangeSuccess', function(event, args) {
            var route = args.$route || args.$$route; 
            if(route && route.segment) {
                                
                $routeSegment.name = route.segment;
                var segmentNameChain = route.segment.split(".");
                
                for(var i=0; i < segmentNameChain.length; i++) {
                    
                    var newSegment = getSegmentInChain( i, segmentNameChain );
                    
                    if(!$routeSegment.chain[i] || $routeSegment.chain[i].name != newSegment.name ||
                            isDependenciesChanged(newSegment)) {
                       
                        updateSegment(i, newSegment);
                    }    
                }                
                // Removing redundant segment in case of new segment chain is shorter than old one
                for(var i=segmentNameChain.length; i < $routeSegment.chain.length; i++) {
                    updateSegment(i, null);
                    $routeSegment.chain.splice(-1, $routeSegment.chain.length - segmentNameChain.length);
                }
                
                lastParams = angular.copy($routeParams);
            }
        })
        
        function isDependenciesChanged(segment) {
            var result = false;
            if(segment.params.dependencies)
                angular.forEach(segment.params.dependencies, function(name) {
                    if(!angular.equals(lastParams[name], $routeParams[name]))
                        result = true;
                })            
            return result;
        }
        
        function updateSegment(index, segment) {
            
            if(!segment) {
                $rootScope.$broadcast( 'routeSegmentChange', { index: index, segment: null } );
                return;
            }
            
            var locals = angular.extend({}, segment.params.resolve);
            //console.log(segment);
            
            angular.forEach(locals, function(value, key) {
                locals[key] = angular.isString(value) ? $injector.get(value) : $injector.invoke(value);
            })
                        
            if(segment.params.template)
                locals.$template = segment.params.template;
            
            if(options.autoLoadTemplates && segment.params.templateUrl)
                locals.$template = 
                    $http.get(segment.params.templateUrl, {cache: $templateCache})
                        .then(function(response) {                            
                            return response.data;
                        })
                        
            $q.all(locals).then(function(locals) {
                
                $routeSegment.chain[index] = {
                        name: segment.name,
                        params: segment.params,
                        locals: locals
                    };
                $rootScope.$broadcast( 'routeSegmentChange', { index: index, segment: $routeSegment.chain[index] } );
            })            
        }
        
        function getSegmentInChain(segmentIdx, segmentNameChain) {
                        
            if(!segmentNameChain) 
                return null;    
            
            if(segmentIdx >= segmentNameChain.length) 
                return null;    
                        
            var curSegment = segments, nextName;
            for(var i=0;i<=segmentIdx;i++) {        
                
                nextName = segmentNameChain[i];
                
                var lastSegment = curSegment;
                
                if(curSegment[ camelCase(nextName) ] != undefined) 
                    curSegment = curSegment[ camelCase(nextName) ];
                
                if(i < segmentIdx)
                    curSegment = curSegment.children;
            }
            
            return {
                name: nextName,
                params: curSegment.params
            };
        }
        
        return $routeSegment;
    }];
}])


})(angular);