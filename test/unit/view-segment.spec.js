'use strict';

describe('view-segment', function() {
    
    beforeEach(module('view-segment'));
    
    var scope, ctrl, elm;    
    var $rootScope, $compile, $routeSegment, $routeSegmentProvider, $controller, $location;
    
    beforeEach(module(function(_$routeSegmentProvider_, $provide) {
        
        $routeSegmentProvider = _$routeSegmentProvider_;        
            
        $provide.value('$routeParams', {});
    }))
    
    beforeEach(inject(function(_$compile_, _$rootScope_, _$routeSegment_, _$controller_, _$location_) {
        
        $rootScope = _$rootScope_;
        $compile = _$compile_;
        $routeSegment = _$routeSegment_;
        $controller = _$controller_;
        $location = _$location_;
        
        $routeSegmentProvider
        
            .when('/1', 'section1')
            .when('/2', 'section2')
            .when('/2/1', 'section2.subsection21')
            .when('/2/2', 'section2.subsection22')
        
            .segment('section1', {
                template: '<h4>Section 1</h4>'})
            
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
        elm = angular.element('<div class="container" app:view-segment="0"></div>');        
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

        elm.find('> div > div').contents().scope().test = 10;

        $rootScope.$digest();
        expect(elm.find('> div > span').text()).toBe('10');

        elm.find('> div > span').addClass('testClass');

        expect(elm.find('> div > span')).toHaveClass('testClass');

        $location.path('/2/1');

        $rootScope.$digest();
        expect(elm.find('> div > div > span').text()).toBe('CONTROLLER OVERRIDED');
        expect(elm.find('> div > span').text()).toBe('10');
        expect(elm.find('> div > span')).toHaveClass('testClass');

        $location.path('/2/2');

        $rootScope.$digest();
        expect(elm.find('> div > div > span').text()).toBe('10');
        expect(elm.find('> div > span').text()).toBe('10');
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
    
     
});  
    