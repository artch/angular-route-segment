'use strict';

/**
 * appViewSegment directive
 * It is based on ngView directive code: 
 * https://github.com/angular/angular.js/blob/master/src/ngRoute/directive/ngView.js
 */

(function(angular) {

    angular.module( 'view-segment', [ 'route-segment' ] ).directive( 'appViewSegment',
    ['$route', '$compile', '$controller', '$routeParams', '$routeSegment', '$q', '$injector', '$timeout',
        function($route, $compile, $controller, $routeParams, $routeSegment, $q, $injector, $timeout) {

            return {
                restrict : 'ECA',
                priority: 500,
                compile : function(tElement, tAttrs) {

                    var defaultContent = tElement.html(), isDefault = true,
                    anchor = angular.element(document.createComment(' view-segment '));

                    tElement.prepend(anchor);

                    return function($scope) {

                        var currentScope, currentElement, currentSegment, onloadExp = tAttrs.onload || '', animate,
                        viewSegmentIndex = parseInt(tAttrs.appViewSegment), updatePromise;

                        try {
                            // angular 1.1.x
                            var $animator = $injector.get('$animator')
                            animate = $animator($scope, tAttrs);
                        }
                        catch(e) {}
                        try {
                            // angular 1.2.x
                            animate = $injector.get('$animate');
                        }
                        catch(e) {}

                        if($routeSegment.chain[viewSegmentIndex])
                            updatePromise = $timeout(function() {
                                update($routeSegment.chain[viewSegmentIndex]);
                            }, 0);

                        // Watching for the specified route segment and updating contents
                        $scope.$on('routeSegmentChange', function(event, args) {

                            if(updatePromise)
                                $timeout.cancel(updatePromise);

                            if(args.index == viewSegmentIndex && currentSegment != args.segment)
                                update(args.segment);
                        });

                        function clearContent() {

                            if(currentElement) {
                                animate.leave(currentElement);
                                currentElement = null;
                            }

                            if (currentScope) {
                                currentScope.$destroy();
                                currentScope = null;
                            }
                        }


                        function update(segment) {

                            currentSegment = segment;

                            if(isDefault) {
                                isDefault = false;
                                tElement.replaceWith(anchor);
                            }

                            if(!segment) {
                                clearContent();
                                currentElement = tElement.clone();
                                currentElement.html(defaultContent);
                                animate.enter( currentElement, null, anchor );
                                $compile(currentElement, false, 499)($scope);
                                return;
                            }

                            var locals = angular.extend({}, segment.locals),
                            template = locals && locals.$template;

                            clearContent();

                            currentElement = tElement.clone();
                            currentElement.html(template ? template : defaultContent);
                            animate.enter( currentElement, null, anchor );

                            var link = $compile(currentElement, false, 499), controller;

                            currentScope = $scope.$new();
                            if (segment.params.controller) {
                                locals.$scope = currentScope;
                                controller = $controller(segment.params.controller, locals);
                                if(segment.params.controllerAs)
                                    currentScope[segment.params.controllerAs] = controller;
                                currentElement.data('$ngControllerController', controller);
                                currentElement.children().data('$ngControllerController', controller);
                            }

                            link(currentScope);
                            currentScope.$emit('$viewContentLoaded');
                            currentScope.$eval(onloadExp);
                        }
                    }
                }
            }
        }]);

})(angular);
