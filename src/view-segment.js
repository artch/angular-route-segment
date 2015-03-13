'use strict';

/**
 * appViewSegment directive
 * It is based on ngView directive code: 
 * https://github.com/angular/angular.js/blob/master/src/ngRoute/directive/ngView.js
 */

(function(angular) {

    angular.module( 'view-segment', [ 'route-segment' ] ).directive( 'appViewSegment',
    ['$route', '$compile', '$controller', '$routeParams', '$routeSegment', '$q', '$injector', '$timeout', '$animate',
        function($route, $compile, $controller, $routeParams, $routeSegment, $q, $injector, $timeout, $animate) {

            return {
                restrict : 'ECA',
                priority: 400,
                transclude: 'element',

                compile : function(tElement, tAttrs) {

                    return function($scope, element, attrs, ctrl, $transclude) {

                        var currentScope, currentElement, currentSegment = {}, onloadExp = tAttrs.onload || '',
                        viewSegmentIndex = parseInt(tAttrs.appViewSegment), updatePromise, previousLeaveAnimation;

                        if($routeSegment.chain[viewSegmentIndex]) {
                            updatePromise = $timeout(function () {
                                update($routeSegment.chain[viewSegmentIndex]);
                            }, 0);
                        }
                        else {
                            update();
                        }

                        // Watching for the specified route segment and updating contents
                        $scope.$on('routeSegmentChange', function(event, args) {

                            if(updatePromise)
                                $timeout.cancel(updatePromise);

                            if(args.index == viewSegmentIndex && currentSegment != args.segment) {
                                update(args.segment);
                            }
                        });

                        function clearContent() {
                            if (previousLeaveAnimation) {
                                $animate.cancel(previousLeaveAnimation);
                                previousLeaveAnimation = null;
                            }

                            if (currentScope) {
                                currentScope.$destroy();
                                currentScope = null;
                            }
                            if (currentElement) {
                                previousLeaveAnimation = $animate.leave(currentElement);
                                if(previousLeaveAnimation) {
                                    previousLeaveAnimation.then(function () {
                                        previousLeaveAnimation = null;
                                    });
                                }
                                currentElement = null;
                            }
                        }

                        function update(segment) {

                            currentSegment = segment;

                            var newScope = $scope.$new();

                            var clone = $transclude(newScope, function(clone) {
                                if(segment) {
                                    clone.data('viewSegment', segment);
                                }
                                $animate.enter(clone, null, currentElement || element);
                                clearContent();
                            });

                            currentElement = clone;
                            currentScope = newScope;
                            currentScope.$emit('$viewContentLoaded');
                            currentScope.$eval(onloadExp);
                        }
                    }
                }
            }
        }]);

    angular.module( 'view-segment').directive( 'appViewSegment',
        ['$route', '$compile', '$controller', function($route, $compile, $controller) {

                return {
                    restrict: 'ECA',
                    priority: -400,
                    link: function ($scope, element) {

                        var segment = element.data('viewSegment') || {};

                        var locals = angular.extend({}, segment.locals),
                                template = locals && locals.$template;

                            if(template) {
                                element.html(template);
                            }

                            var link = $compile(element.contents());

                            if (segment.params && segment.params.controller) {
                                locals.$scope = $scope;
                                var controller = $controller(segment.params.controller, locals);
                                if(segment.params.controllerAs)
                                    $scope[segment.params.controllerAs] = controller;
                                element.data('$ngControllerController', controller);
                                element.children().data('$ngControllerController', controller);
                            }

                            link($scope);
                    }
                }

            }]);

})(angular);
