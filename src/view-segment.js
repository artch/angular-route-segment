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
        compile : function(tElement) {
            
            var oldContent = tElement.clone();
            
            return function($scope, element, attrs) {
                
                var lastScope, onloadExp = attrs.onload || '',
                    lastSegmentName, lastParams = {}, animate,
                    viewSegmentIndex = parseInt(attrs.appViewSegment);
                
                try {
                    // Trying to inject $animator which may be absent in 1.0.x branch
                    var $animator = $injector.get('$animator')
                    animate = $animator($scope, attrs);
                }
                catch(e) {                
                }                

                update($routeSegment.chain[viewSegmentIndex]);
                
                // Watching for the specified route segment and updating contents
                $scope.$on('routeSegmentChange', function(event, args) {
                    if(args.index == viewSegmentIndex)
                        update(args.segment);
                });
    
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
                   
                   if(!segment) {
                       element.html(oldContent.html());
                       $compile(element.contents())($scope);
                       return;
                   }
                    
                    var locals = angular.extend({}, segment.locals),
                        template = locals && locals.$template;
                    
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
                                locals.$scope = lastScope;
                                controller = $controller(segment.params.controller, locals);
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
    }
}]);

})(angular);