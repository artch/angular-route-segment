/** https://github.com/artch/angular-route-segment
 *  @author Artem Chivchalov
 *  @license MIT License http://opensource.org/licenses/MIT
 */
'use strict';

/**
 * The directive app:view is more powerful replacement of built-in ng:view. It allows views to be nested, where each 
 * following view in the chain corresponds to the next route segment (see $routeSegment service).
 * 
 * Sample:
 * <div>
 *     <h4>Section</h4>
 *     <div app:view>Nothing selected</div>
 * </div>
 * 
 * Initial contents of an element with app:view will display if corresponding route segment doesn't exist.
 * 
 * View resolving are depends on route segment params:
 * - `template/templateUrl` define contents of the view
 * - `controller` is attached to view contents when compiled and linked
 * - `dependencies` is an array of route param names which are forcing the view to recreate when changed 
 */

(function(angular) {

angular.module( 'view-segment', [ 'route-segment' ] ).directive( 'appViewSegment', 
        ['$route', '$compile', '$controller', '$routeParams', '$routeSegment', '$q', '$injector',
         function($route, $compile, $controller, $routeParams, $routeSegment, $q, $injector) {
    
    return {
        restrict : 'ECA',
        link : function($scope, element, attrs) {
            
            var lastScope, onloadExp = attrs.onload || '',
                lastSegmentName, lastParams = {}, animate;
            
            try {
                // Trying to inject $animator which may be absent in 1.0.x branch
                var $animator = $injector.get('$animator')
                animate = $animator($scope, attrs);
                if(attrs.appViewSegment == 2)
                    console.log(animate);
            }
            catch(e) {                
            }
            
            var oldContent = element.clone();
            
            // Watching to the specified route segment and updating contents
            $scope.$watch(                    
                    function() { 
                        return $routeSegment.chain[parseInt(attrs.appViewSegment)]; 
                    },                    
                    function(segment) {
                        
                        if(segment && (isDependenciesChanged(segment) || lastSegmentName != segment.name))
                            update(segment);
                        
                        lastSegmentName = segment && segment.name;  
                        
                         
                        if(!segment)
                            element.html(oldContent.html());
                    }
            )            
                        
            function isDependenciesChanged(segment) {
                var result = false;
                if(segment.params.dependencies)
                    angular.forEach(segment.params.dependencies, function(name) {
                        if(!angular.equals(lastParams[name], $routeParams[name]))
                            result = true;
                    })
                lastParams = angular.copy($routeParams);
                return result;
            }

            function destroyLastScope() {
                if (lastScope) {
                    lastScope.$destroy();
                    lastScope = null;
                }
            }

            function clearContent() {
                
                if(animate)
                    animate.leave(element.contents(), element);
                else
                    element.html('');
                destroyLastScope();
            }

            function update(segment) {
                
                var template = segment.params && segment.params.template;
                
                if (template) {
                    $q.when(template).then(function (templateHtml) {
                        
                        clearContent();
                        
                        if(animate)
                            animate.enter( angular.element('<div></div>').html(templateHtml).contents(), element );
                        else
                            element.html(templateHtml);
                        
                        destroyLastScope();
    
                        var link = $compile(element.contents()), controller; 
     
                        lastScope = $scope.$new();
                        if (segment.params.controller) {
                            controller = $controller(segment.params.controller, {$scope: lastScope});
                            element.children().data('$ngControllerController', controller);
                        }
    
                        link(lastScope);
                        lastScope.$emit('$viewContentLoaded');
                        lastScope.$eval(onloadExp);
                    });
                } else {
                    clearContent();
                }
            }
        }
    }
}]);

})(angular);