'use strict';

/**
 * appViewSegment directive
 * It is based on ngView directive code: 
 * https://github.com/angular/angular.js/blob/master/src/ngRoute/directive/ngView.js
 */

(function(angular) {

    angular.module( 'view-segment', [ 'route-segment' ] ).directive( 'appViewSegment',
    ['$route', '$compile', '$controller', '$routeParams', '$routeSegment', '$q', '$injector',
        function($route, $compile, $controller, $routeParams, $routeSegment, $q, $injector) {

            return {
                restrict : 'ECA',
                priority: 500,
                transclude: 'element',
                compile : function(tElement, tAttrs, transclusion) {

                    var defaultContent = tElement.html();

                    return function($scope, $element) {

                        var currentScope, currentElement, currentSegment, currentParam, onloadExp = tAttrs.onload || '', animate,
                        viewSegmentIndex, viewSegmentName;

                        // watch for the segment changes
                        $scope.$watch(tAttrs.appViewSegment, function (n) {
                            viewSegmentIndex = parseInt(n);
                            viewSegmentName  = ("" + n).split(".")[1];
                        });

                        try {
                            // angular 1.1.x
                            var $animator = $injector.get('$animator')
                            animate = $animator($scope, tAttrs);
                        }
                        catch(e) {
                            try {
                                // angular 1.2.x
                                animate = $injector.get('$animate');
                            }
                            catch(e) {}
                        }

                        if($routeSegment.chain[viewSegmentIndex] && (!viewSegmentName || $routeSegment.$routeParams[viewSegmentName]))
                            update($routeSegment.chain[viewSegmentIndex]);

                        // Watching for the specified route segment and updating contents
                        $scope.$on('routeSegmentChange', function(event, args) {

                            if(args.index == viewSegmentIndex && currentSegment != args.segment
                               && (!viewSegmentName || !currentParam || currentParam != $routeParams[viewSegmentName])) {
                                update(args.segment);
                            }
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
                            currentParam = null;
                        }

                        function update(segment) {
                            clearContent();

                            var newScope = $scope.$new();

                            transclusion(newScope, function (clone) {
                                currentElement = clone;
                                currentParam = $routeParams[viewSegmentName];
                                currentSegment = segment;


                                if(!segment) {
                                    currentElement.html(defaultContent);
                                    animate.enter( currentElement, null, $element );
                                    $compile(currentElement, false, 499)($scope);
                                } else {

                                    var locals = angular.extend({}, segment.locals),
                                    template = locals && locals.$template;

                                    if (viewSegmentName && angular.isObject(template)) {
                                        // named template, update template
                                        template = template[viewSegmentName];
                                    }

                                    currentScope = newScope;
                                    currentElement.html(template ? template : defaultContent);

                                    animate.enter( currentElement, null, $element );

                                    var link = $compile(currentElement, false, 499)
                                       ,controller = segment.params.controller;

                                    if (controller) {
                                        if (angular.isObject(controller)) {
                                            controller = controller[$routeSegment.$routeParams[viewSegmentName]];
                                        }
                                        if (controller) {
                                            locals.$scope = currentScope;
                                            controller = $controller(controller, locals);
                                            if(segment.params.controllerAs)
                                                currentScope[segment.params.controllerAs] = controller;
                                            currentElement.data('$ngControllerController', controller);
                                            currentElement.children().data('$ngControllerController', controller);
                                        }
                                    }

                                    link(currentScope);
                                    currentScope.$emit('$viewContentLoaded');
                                    currentScope.$eval(onloadExp);
                                }
                            });
                        }
                    }
                }
            }
        }]);

})(angular);
