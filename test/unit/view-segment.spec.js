'use strict';

describe('view-segment', function() {

    if(angular.version.major > 1 || angular.version.minor >= 2)
        beforeEach(module('ngRoute'));
    
    beforeEach(module('view-segment'));
    
    var scope, ctrl, elm;    
    var $rootScope, $compile, $routeSegment, $routeSegmentProvider, $controller, $location, $timeout;
    
    beforeEach(module(function(_$routeSegmentProvider_, $provide) {
        
        $routeSegmentProvider = _$routeSegmentProvider_;        
            
        $provide.value('$routeParams', {});
    }))
    
    beforeEach(inject(function(_$compile_, _$rootScope_, _$routeSegment_, _$controller_, _$location_, _$timeout_) {
        
        $rootScope = _$rootScope_;
        $compile = _$compile_;
        $routeSegment = _$routeSegment_;
        $controller = _$controller_;
        $location = _$location_;
        $timeout = _$timeout_;
        
        $routeSegmentProvider
        
            .when('/1', 'section1')
            .when('/2', 'section2')
            .when('/2/1', 'section2.subsection21')
            .when('/2/2', 'section2.subsection22')
        
            .segment('section1', {
                template: '<h4>Section 1</h4><div app:view-segment="1">Nothing</div>'})
            
            .segment('section2', {
                template: '<h4>Section 2</h4><span>{{test}}</span><div app:view-segment="1">Nothing</div>'})
            
            .within()
                
                .segment('subsection21', {
                    template: '<h4>Subsection 2-1</h4><span>{{test}}</span>',
                    controller: function($scope) {
                        $scope.test = 'CONTROLLER OVERRIDED';
                    }})
                
                .segment('subsection22', {
                    template: '<h4>Subsection 2-2</h4><span>{{test}}</span>'})
                          
        scope = $rootScope.$new();
        scope.test = 1;
        elm = angular.element('<div class="container"><div class="segment" app:view-segment="0"></div></div>');
        $compile(elm)(scope);        
        scope.$apply();
    }));
    
    afterEach(function() {
        scope.$destroy();
    })
    
    it('should show a section without children', function() {
        $location.path('/1');

        $rootScope.$digest();
        expect(elm).toHaveClass('container');
        expect(elm.find('> div')).toHaveClass('segment');
        expect(elm.find('> div > h4').text()).toMatch(/Section 1/);
    })

    it('should show an empty section with children', function() {
        $location.path('/2');

        $rootScope.$digest();

        expect(elm.find('> div > h4').text()).toMatch(/Section 2/);
        expect(elm.find('> div > div').text()).toMatch(/Nothing/);
        expect(elm.find('> div > div').contents().scope().test).toBe(1);
    })

    it('should show an empty section with children after coming from another segment', function() {
        $routeSegmentProvider.when('/3', 'section3.subsection31')
            .segment('section3', {template: '<div app:view-segment="1"></div>'})
            .within().segment('subsection31', {template: 'TEST'})

        $location.path('/3');

        $rootScope.$digest();
        expect(elm.find('> div > div').text()).toMatch(/TEST/);

        $location.path('/2');

        $rootScope.$digest();
        expect(elm.find('> div > div').text()).toMatch(/Nothing/);
    })

    it('should show a section with an active child', function() {
        $location.path('/2/1');

        $rootScope.$digest();
        expect(elm.find('> div > h4').text()).toMatch(/Section 2/);
        expect(elm.find('> div > div > h4').text()).toMatch(/Subsection 2-1/);
        expect(elm.find('> div > div').contents().scope().test).toBe('CONTROLLER OVERRIDED');
    })

    it('should keep parent controller untouched', function() {

        $location.path('/2');

        $rootScope.$digest();
        expect(elm.find('> div > span').text()).toBe('1');

        elm.find('> div').contents().scope().test = 2;

        $rootScope.$digest();
        expect(elm.find('> div > span').text()).toBe('2');

        elm.find('> div > span').addClass('testClass');

        expect(elm.find('> div > span')).toHaveClass('testClass');

        $location.path('/2/1');

        $rootScope.$digest();
        expect(elm.find('> div > div > span').text()).toBe('CONTROLLER OVERRIDED');
        expect(elm.find('> div > span').text()).toBe('2');
        expect(elm.find('> div > span')).toHaveClass('testClass');

        $location.path('/2/2');

        $rootScope.$digest();

        elm.find('> div > div').contents().scope().test = 10;
        $rootScope.$digest();

        expect(elm.find('> div > div > span').text()).toBe('10');
        expect(elm.find('> div > span').text()).toBe('2');
        expect(elm.find('> div > span')).toHaveClass('testClass');
    })

    it('should recreate when dependency is changed and should not recreate when others are changed', inject(function() {

        $routeSegmentProvider.when('/2/details/:id/:tab', 'section2.details');
        $routeSegmentProvider.within('section2').segment('details', {
            template: '<h4>Details {{name}}</h4>',
            dependencies: ['id'],
            controller: function($scope, $routeParams) {
                $scope.name = 'item '+$routeParams.id;
            }
        })

        $location.path('/2/details/1/info');

        $rootScope.$digest();
        expect(elm.find('> div > div > h4').text()).toBe('Details item 1');

        elm.find('> div > div').contents().scope().name = 'TEST';

        $rootScope.$digest();
        expect(elm.find('> div > div > h4').text()).toBe('Details TEST');

        $location.path('/2/details/1/edit');

        $rootScope.$digest();
        expect(elm.find('> div > div > h4').text()).toBe('Details TEST');

        $location.path('/2/details/2/edit');

        $rootScope.$digest();
        expect(elm.find('> div > div > h4').text()).toBe('Details item 2');
    }))

    it('should recreate when parent segment is changed and sub-segment name is the same', inject(function() {

        $routeSegmentProvider.when('/1/details', 'section1.details');
        $routeSegmentProvider.when('/2/details', 'section2.details');
        $routeSegmentProvider.segment('section1', {
            template: '<div app:view-segment="1"></div>'})
        $routeSegmentProvider.segment('section2', {
            template: '<div app:view-segment="1"></div>'})
        $routeSegmentProvider.within('section1').segment('details', {
            template: '<h4>Detail 1</h4>'})
        $routeSegmentProvider.within('section2').segment('details', {
            template: '<h4>Detail 2</h4>'})

        $location.path('/1/details');
        $rootScope.$digest();

        expect(elm.find('> div >div > h4').text()).toBe('Detail 1');

        $location.path('/2/details');
        $rootScope.$digest();

        expect(elm.find('> div > div > h4').text()).toBe('Detail 2');
    }))

    it('should populate a view initially, when location is already set before compiling', inject(function($timeout) {
        $location.path('/1');
        $rootScope.$digest();

        scope = $rootScope.$new();
        elm = angular.element('<div class="container"><div app:view-segment="0"></div></div>');
        $compile(elm)(scope);
        scope.$digest();
        $timeout.flush();

        expect(elm).toHaveClass('container');
        expect(elm.find('> div > h4').text()).toMatch(/Section 1/);
    }))

    it('should work with controllerAs syntax', function() {
        $routeSegmentProvider.when('/3', 'section3');
        $routeSegmentProvider.segment('section3', {
            template: '<div></div>',
            controller: function($scope) {},
            controllerAs: 'ctrl'
        })

        scope = $rootScope.$new();
        elm = angular.element('<div class="container"><div app:view-segment="0"></div></div>');
        $compile(elm)(scope);
        scope.$digest();

        $location.path('/3');
        $rootScope.$digest();

        expect(elm.find('> div').scope().ctrl).toBeDefined();
        expect(elm.find('> div').scope().ctrl).toBe(elm.find('> div').controller());
    })

    it('should call the controller of a sub-segment only once', inject(function() {

        var spy = jasmine.createSpy('controller');

        $routeSegmentProvider.when('/3', 'section3.section31');
        $routeSegmentProvider.segment('section3', {
            template: '<div app:view-segment="1"></div>'
        }).within().segment('section31', {
            template: '<div></div>',
            controller: spy
        })

        $location.path('/3');

        $rootScope.$digest();
        expect(spy.calls.length).toBe(1);
    }))

    it('should call the controller twice after reload', inject(function() {

        var spy = jasmine.createSpy('controller');

        $routeSegmentProvider.when('/3', 'section3');
        $routeSegmentProvider.segment('section3', {
            template: '<div></div>',
            controller: spy
        });
        $location.path('/3');
        $rootScope.$digest();

        $routeSegment.chain[0].reload();

        $rootScope.$digest();
        expect(spy.calls.length).toBe(2);
    }))

    it('should not call the controller of a sub-segment called previously if new segment doesnt have a sub-segment', function() {

        var spy = jasmine.createSpy('controller');

        $routeSegmentProvider.when('/3/1', 'section3.section31');
        $routeSegmentProvider.segment('section3', {
            template: '<div app:view-segment="1"></div>'
        }).within().segment('section31', {
            template: '<div></div>',
            controller: spy
        })

        $location.path('/3/1');

        $rootScope.$digest();
        expect(spy.calls.length).toBe(1);

        $location.path('/1');

        $rootScope.$digest();
        expect(spy.calls.length).toBe(1);

    })

    it('should not call the controller of a sub-segment called previously if new segment has a sub-segment', inject(function($timeout) {

        var spy = jasmine.createSpy('controller');

        $routeSegmentProvider.when('/3/1', 'section3.section31');
        $routeSegmentProvider.segment('section3', {
            template: '<div app:view-segment="1"></div>'
        }).within().segment('section31', {
            template: '<div></div>',
            controller: spy
        })

        $location.path('/2/1');
        $rootScope.$digest();
        $location.path('/3/1');

        $rootScope.$digest();
        try {
            $timeout.flush();
        }
        catch(e) {}
        expect(spy.calls.length).toBe(1);

    }))

    it('should work with ngIf', inject(function($timeout) {
        $location.path('/1');
        $rootScope.$digest();

        scope = $rootScope.$new();
        scope.show = true;
        elm = angular.element('<div class="container"><div ng-if="show"><div app:view-segment="0"></div></div></div>');
        $compile(elm)(scope);
        scope.$digest();
        $timeout.flush();

        expect(elm).toHaveClass('container');
        expect(elm.find('> div > div > h4').text()).toMatch(/Section 1/);

        scope.show = false;
        scope.$digest();

        expect(elm.find('> div > div > h4').text()).toMatch('');

        scope.show = true;
        scope.$digest();
        $timeout.flush();

        expect(elm.find('> div > div > h4').text()).toMatch('Section 1');

    }))

    describe('a view with empty template', function() {

        beforeEach(function() {

            $rootScope.foo = 'INIT';

            $routeSegmentProvider.when('/3', 'section3');
            $routeSegmentProvider.when('/3/1/:id', 'section3.section31');
            $routeSegmentProvider.segment('section3', {
                template: '<div app:view-segment="1"><div>{{foo}}</div></div>'
            })
            $routeSegmentProvider.within('section3').segment('section31', {
                // no template
                controller: function($scope) {
                    $scope.foo = 'CONTROLLER OVERRIDDEN '+$routeSegment.$routeParams.id;
                },
                dependencies: ['id']
            });
        })

        it('should work with tag\'s content', function() {

            $location.path('/3');

            $rootScope.$digest();
            expect(elm.find('> div').text()).toBe('INIT');

            $location.path('/3/1/1');

            $rootScope.$digest();
            expect(elm.find('> div').text()).toBe('CONTROLLER OVERRIDDEN 1');

            $location.path('/3/1/2');

            $rootScope.$digest();
            expect(elm.find('> div').text()).toBe('CONTROLLER OVERRIDDEN 2');
        })

        it('should reload', function() {

            $location.path('/3/1/1');

            $rootScope.$digest();
            expect(elm.find('> div').text()).toBe('CONTROLLER OVERRIDDEN 1');

            elm.find('> div > div').scope().foo = 'DIRTY';

            $rootScope.$digest();
            expect(elm.find('> div').text()).toBe('DIRTY');

            $routeSegment.chain[1].reload();

            $rootScope.$digest();
            expect(elm.find('> div').text()).toBe('CONTROLLER OVERRIDDEN 1');
        })

    })

    describe('with resolving', function() {

        var defer;

        beforeEach(inject(function($q) {

            defer = $q.defer();

            $routeSegmentProvider.when('/3', 'section3');
            $routeSegmentProvider.when('/3/1', 'section3.section31');
            $routeSegmentProvider.when('/3/2', 'section3.section32');
            $routeSegmentProvider.segment('section3', {
                template: '<div class="container"><div app:view-segment="1">EMPTY: {{data}}</div>'
            })
            $routeSegmentProvider.within('section3').segment('section31', {
                template: '<div>{{data}}</div>',
                controller: function($scope, data) {
                    $scope.data = data;
                },
                resolve: {
                    data: function() {
                        return defer.promise;
                    }
                }
            });
            $routeSegmentProvider.within('section3').segment('section32', {
                controller: function($scope, data) {
                    $scope.data = data;
                },
                resolve: {
                    data: function() {
                        return defer.promise;
                    }
                },
                untilResolved: {
                    template: '<div>LOADING</div>'
                }
            });
        }))

        it('should work with resolving', function() {
            $location.path('/2/2');

            $rootScope.$digest();
            expect(elm.find('> div > div > span').text()).toBe('1');

            $location.path('/3/1')

            $rootScope.$digest();
            expect(elm.find('> div > div').text()).toBe('EMPTY: ');

            defer.resolve('RESOLVED');

            $rootScope.$digest();
            expect(elm.find('> div > div').text()).toBe('RESOLVED');

        })

        it('should work with resolving, empty template, and untilResolved', function() {
            $location.path('/2/2');

            $rootScope.$digest();
            expect(elm.find('> div > div > span').text()).toBe('1');

            $location.path('/3/2');

            $rootScope.$digest();
            expect(elm.find('> div > div').text()).toBe('LOADING');

            defer.resolve('RESOLVED');

            $rootScope.$digest();
            expect(elm.find('> div > div').text()).toBe('EMPTY: RESOLVED');

        })

    })


    
     
});  
    
