'use strict';

(function(angular) {

angular.module( 'route-segment', [] ).provider( '$routeSegment',
        ['$routeProvider', function($routeProvider) {
    
    var $routeSegmentProvider = this;
    
    var options = $routeSegmentProvider.options = {
            
        /**
         * When true, it will resolve `templateUrl` automatically via $http service and put its
         * contents into `template`.
         * @type {boolean}
         */
        autoLoadTemplates: false,
        
        /**
         * When true, all attempts to call `within` method on non-existing segments will throw an error (you would
         * usually want this behavior in production). When false, it will transparently create new empty segment
         * (can be useful in isolated tests).
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
             * @param string} name Name of a segment.
             * @param {Object} params Segment's parameters hash. The following params are supported:
             *                        - `template` provides HTML for the given segment view;
             *                        - `templateUrl` is a template should be fetched from network via this URL;
             *                        - `controller` is attached to the given segment view when compiled and linked,
             *                              this can be any controller definition AngularJS supports;
             *                        - `dependencies` is an array of route param names which are forcing the view 
             *                              to recreate when changed;
             *                        - `watcher` is a $watch-function for recreating the view when its returning value
             *                              is changed;
             *                        - `resolve` is a hash of functions or injectable names which should be resolved
             *                              prior to instantiating the template and the controller;
             *                        - `untilResolved` is the alternate set of params (e.g. `template` and `controller`)
             *                              which should be used before resolving is completed; 
             *                        - `resolveFailed` is the alternate set of params which should be used 
             *                              if resolving failed;
             *                              
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
             * @param {string} childName An existing segment's name. If undefined, then the last added segment is selected.
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
             * Traverses to the root.
             * @returns The root pointer.
             */
            root: function() {
                return rootPointer;
            }
        }
    }
    
    /**
     * The shorthand for $routeProvider.when() method with specified route name.
     * @param {string} route Route URL, e.g. '/foo/bar'
     * @param {string} name Fully qualified route name, e.g. 'foo.bar'
     */
    $routeSegmentProvider.when = function(route, name) {
        $routeProvider.when(route, {segment: name});
        return this;
    };
    
    // Extending the provider with the methods of rootPointer
    // to start configuration.
    angular.extend($routeSegmentProvider, rootPointer);
    
        
    // the service factory
    this.$get = ['$rootScope', '$q', '$http', '$templateCache', '$route', '$routeParams', '$injector',
                 function($rootScope, $q, $http, $templateCache, $route, $routeParams, $injector) {
                
        var $routeSegment = {    
                
                /**
                 * Fully qualified name of current active route
                 * @type {string}
                 */
                name: '',

                /**
                 * A copy of `$routeParams` in its state of the latest successful segment update. It may be not equal
                 * to `$routeParams` while some resolving is not completed yet. Should be used instead of original
                 * `$routeParams` in most cases.
                 * @type {Object}
                 */
                $routeParams: angular.copy($routeParams),
                
                /**
                 * Array of segments splitted by each level separately. Each item contains the following properties:
                 * - `name` is the name of a segment;
                 * - `params` is the config params hash of a segment;
                 * - `locals` is a hash which contains resolve results if any;
                 * - `reload` is a function to reload a segment (restart resolving, reinstantiate a controller, etc)
                 *
                 * @type {Array.<Object>}
                 */
                chain: [],
                
                /**
                 * Helper method for checking whether current route starts with the given string
                 * @param {string} val
                 * @returns {boolean}
                 */
                startsWith: function (val) {
                    var regexp = new RegExp('^'+val);
                    return regexp.test($routeSegment.name);
                },
                
                /**
                 * Helper method for checking whether current route contains the given string
                 * @param {string} val
                 * @returns {Boolean}
                 */
                contains: function (val) {
                    for(var i=0; i<this.chain.length; i++)
                        if(this.chain[i].name == val)
                            return true;
                    return false;
                }
        };    

        var resolvingSemaphoreChain = {};
        
        // When a route changes, all interested parties should be notified about new segment chain
        $rootScope.$on('$routeChangeSuccess', function(event, args) {

            var route = args.$route || args.$$route; 
            if(route && route.segment) {

                var segmentName = route.segment;
                var segmentNameChain = segmentName.split(".");
                var updates = [];
                
                for(var i=0; i < segmentNameChain.length; i++) {
                    
                    var newSegment = getSegmentInChain( i, segmentNameChain );

                    if(resolvingSemaphoreChain[i] != newSegment.name || isDependenciesChanged(newSegment)) {

                        if($routeSegment.chain[i] && $routeSegment.chain[i].name == newSegment.name &&
                            !isDependenciesChanged(newSegment))
                            // if we went back to the same state as we were before resolving new segment
                            resolvingSemaphoreChain[i] = newSegment.name;
                        else
                            updates.push({index: i, newSegment: newSegment});
                    }    
                }

                var curSegmentPromise = $q.when();

                if(updates.length > 0) {
                    for(var i=0; i<updates.length; i++) {
                        (function(i) {
                            curSegmentPromise = curSegmentPromise.then(function() {

                                return updateSegment(updates[i].index, updates[i].newSegment);

                            }).then(function(result) {

                                if(result.success != undefined) {
                                    broadcast(result.success);
                                }
                            })
                        })(i);
                    }
                }

                curSegmentPromise.then(function() {

                    // Removing redundant segment in case if new segment chain is shorter than old one
                    if($routeSegment.chain.length > segmentNameChain.length) {
                        var oldLength = $routeSegment.chain.length;
                        var shortenBy = $routeSegment.chain.length - segmentNameChain.length;
                        $routeSegment.chain.splice(-shortenBy, shortenBy);
                        for(var i=segmentNameChain.length; i < oldLength; i++)
                            updateSegment(i, null);
                    }
                })

                

            }
        });
        
        function isDependenciesChanged(segment) {

            var result = false;
            if(segment.params.dependencies)
                angular.forEach(segment.params.dependencies, function(name) {
                    if(!angular.equals($routeSegment.$routeParams[name], $routeParams[name]))
                        result = true;
                });
            return result;
        }
        
        function updateSegment(index, segment) {

            if($routeSegment.chain[index] && $routeSegment.chain[index].clearWatcher) {
                $routeSegment.chain[index].clearWatcher();
            }

            if(!segment) {
                resolvingSemaphoreChain[index] = null;
                broadcast(index);
                return;
            }

            resolvingSemaphoreChain[index] = segment.name;

            if(segment.params.untilResolved) {
                return resolve(index, segment.name, segment.params.untilResolved)
                    .then(function(result) {
                        if(result.success != undefined)
                            broadcast(index);
                        return resolve(index, segment.name, segment.params);
                    })
            }
            else
                return resolve(index, segment.name, segment.params);
        }
        
        function resolve(index, name, params) {
            
            var locals = angular.extend({}, params.resolve);
            
            angular.forEach(locals, function(value, key) {
                locals[key] = angular.isString(value) ? $injector.get(value) : $injector.invoke(value);
            });
                        
            if(params.template)
                locals.$template = params.template;
            
            if(options.autoLoadTemplates && params.templateUrl)
                locals.$template = 
                    $http.get(params.templateUrl, {cache: $templateCache})
                        .then(function(response) {                            
                            return response.data;
                        });
                                     
            return $q.all(locals).then(
                    
                    function(resolvedLocals) {

                        if(resolvingSemaphoreChain[index] != name)
                            return $q.reject();

                        $routeSegment.chain[index] = {
                                name: name,
                                params: params,
                                locals: resolvedLocals,
                                reload: function() {
                                    updateSegment(index, this).then(function(result) {
                                        if(result.success != undefined)
                                            broadcast(index);
                                    })
                                }
                            };

                        if(params.watcher) {

                            var getWatcherValue = function() {
                                if(!angular.isFunction(params.watcher))
                                    throw new Error('Watcher is not a function in segment `'+name+'`');

                                return $injector.invoke(
                                    params.watcher,
                                    {},
                                    {segment: $routeSegment.chain[index]});
                            }

                            var lastWatcherValue = getWatcherValue();

                            $routeSegment.chain[index].clearWatcher = $rootScope.$watch(
                                getWatcherValue,
                                function(value) {
                                    if(value == lastWatcherValue) // should not being run when $digest-ing at first time
                                        return;
                                    lastWatcherValue = value;
                                    $routeSegment.chain[index].reload();
                                })
                        }

                        return {success: index};
                    },
                    
                    function(error) {
                        
                        if(params.resolveFailed) {
                            var newResolve = {error: function() { return $q.when(error); }};
                            return resolve(index, name, angular.extend({resolve: newResolve}, params.resolveFailed));
                        }
                        else
                            throw new Error('Resolving failed with a reason `'+error+'`, but no `resolveFailed` ' +
                                            'provided for segment `'+name+'`');
                    })
        }

        function broadcast(index) {

            $routeSegment.$routeParams = angular.copy($routeParams);

            $routeSegment.name = '';
            for(var i=0; i<$routeSegment.chain.length; i++)
                $routeSegment.name += $routeSegment.chain[i].name+".";
            $routeSegment.name = $routeSegment.name.substr(0, $routeSegment.name.length-1);

            $rootScope.$broadcast( 'routeSegmentChange', {
                index: index,
                segment: $routeSegment.chain[index] || null } );
        }
        
        function getSegmentInChain(segmentIdx, segmentNameChain) {
                        
            if(!segmentNameChain) 
                return null;    
            
            if(segmentIdx >= segmentNameChain.length) 
                return null;    
                        
            var curSegment = segments, nextName;
            for(var i=0;i<=segmentIdx;i++) {        

                nextName = segmentNameChain[i];

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