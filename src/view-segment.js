'use strict';

/**
 * @ngdoc module
 * @module view-segment
 * @name view-segment
 * @packageName angular-route-segment
 * @requires route-segment
 * @description
 * view-segment is a replacement for [ngView](https://docs.angularjs.org/api/ngRoute/directive/ngView) AngularJS directive.
 *
 * {@link appViewSegment appViewSegment} tags in the DOM will be populated with the corresponding route segment item.
 * You must provide a segment index as an argument to this directive to make it aware about which segment level in the tree
 * it should be linked to.
 *
 * *index.html*:
 * ```html
 * <ul>
 *     <li ng-class="{active: $routeSegment.startsWith('s1')}">
 *         <a href="/section1">Section 1</a>
 *     </li>
 *     <li ng-class="{active: $routeSegment.startsWith('s2')}">
 *         <a href="/section2">Section 2</a>
 *     </li>
 * </ul>
 * <div id="contents" app-view-segment="0"></div>
 * ```
 *
 * *section1.html*: (it will be loaded to div#contents in index.html)
 * ```html
 * <h4>Section 1</h4>
 * Section 1 contents.
 * <div app-view-segment="1"></div>
 * ```
 *
 * ...etc. You can reach any nesting level here. Every view will be handled independently, keeping the state of top-level views.
 *
 * You can also use filters to define link hrefs. It will resolve segment URLs automatically:
 *
 * ```html
 * <ul>
 *     <li ng-class="{active: ('s1' | routeSegmentStartsWith)}">
 *         <a href="{{ 's1' | routeSegmentUrl }}">Section 1</a>
 *     </li>
 *     <li ng-class="{active: ('s2' | routeSegmentStartsWith)}">
 *         <a href="{{ 's2' | routeSegmentUrl }}">Section 2</a>
 *     </li>
 * </ul>
 * ```
 */
/**
 * @ngdoc directive
 * @module view-segment
 * @name appViewSegment
 * @requires https://docs.angularjs.org/api/ngRoute/service/$route $route
 * @requires https://docs.angularjs.org/api/ng/service/$compile $compile
 * @requires https://docs.angularjs.org/api/ng/service/$controller $controller
 * @requires https://docs.angularjs.org/api/ngRoute/service/$routeParams $routeParams
 * @requires $routeSegment
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://docs.angularjs.org/api/auto/service/$injector $injector
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires https://docs.angularjs.org/api/ng/service/$animate $animate
 * @restrict ECA
 * @priority 400
 * @param {String} appViewSegment render depth level
 * @description Renders active segment as specified by parameter
 *
 * It is based on [ngView directive code](https://github.com/angular/angular.js/blob/master/src/ngRoute/directive/ngView.js)
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
                            /*
                             * @ngdoc event
                             * @name appViewSegment#$viewContentLoaded
                             * @description Indicates that segment content has been loaded and transcluded
                             */
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
