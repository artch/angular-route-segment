'use strict';

describe('route segment', function() {
    
    beforeEach(module('route-segment'));
        
    var $routeSegment, $routeSegmentProvider, $rootScope, $httpBackend, $location;
    
    beforeEach(module(function(_$routeSegmentProvider_) {
        
        $routeSegmentProvider = _$routeSegmentProvider_;
        
        $routeSegmentProvider
        
            .when('/1',             'section-first')
            .when('/2',             'section2')
            .when('/2/X',           'section2.section21')
            .when('/X-foo',         'section2.section21.section211')
            .when('/Y',             'section2.section22')
            .when('/2/:id',         'section2.section23')
            .when('/2/:id/bar',     'section2.section23.section231')
            .when('/invalid',       'invalid')
            .when('/2/:id/invalid', 'section2.section23.invalid')    
            
        $routeSegmentProvider
        
            .segment('section-first', {test: 'A'})
                
            .segment('section2', {test: 'B'})
                
            .within()
                
                .segment('section21', {test: 'C'})
                    
                .within()
                    
                    .segment('section211', {test: 'E'})
                    
                .up()
                    
                .segment('section22', {test: 'D'})
        
                .segment('section23', {test: 'F'})
        
        // Starting from the root again                
        $routeSegmentProvider
        
            .within('section2')
            
                .within('section23')
                    
                    .segment('section231', {test: 'G'})
            
        // We don't want to perform any XHRs here                    
        $routeSegmentProvider.options.autoLoadTemplates = true;
        $routeSegmentProvider.options.strictMode = true;
    }))
    
    beforeEach(function() {
        inject(function(_$routeSegment_, _$rootScope_, _$httpBackend_, _$location_) {    
            $routeSegment = _$routeSegment_;
            $rootScope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            $location = _$location_;
        });
    });    

    it('creating segments hash', function() {
        
        var segments = $routeSegmentProvider.segments;
        expect(segments.sectionFirst.params.test).toBe('A');
        expect(segments.sectionFirst.children).toBeUndefined();
        expect(segments.section2.params.test).toBe('B');
        expect(segments.section2.children.section21.params.test).toBe('C');
        expect(segments.section2.children.section22.params.test).toBe('D');
        expect(segments.section2.children.section22.children).toBeUndefined();
        expect(segments.section2.children.section21.children.section211.params.test).toBe('E');        
    })
    
    describe('routing', function() {
        
        var namesHandled, paramsHandled, scope;
        
        beforeEach(function() {
            namesHandled = [];    
            paramsHandled = [];
            scope = $rootScope.$new();
            for(var i=0;i<3;i++)
                (function(i) {
                    scope.$on('routeSegmentChange', function() {
            
                        var next = $routeSegment.chain[i];
                        if(next) {
                            namesHandled[i] = next.name;
                            paramsHandled[i] = next.params;
                        }
                    })
                })(i); 
        });
        
        afterEach(function() {
            scope.$destroy();
        })
        
        it('first level', function() {
            $location.path('/1');
            $rootScope.$digest();
            
            expect(namesHandled).toEqual(['section-first']);
            expect(paramsHandled).toEqual([{test: 'A'}]);
        });
        
        it('second level', function() {
            $location.path('/2/X');
            $rootScope.$digest();  
            expect(namesHandled).toEqual(['section2', 'section21']);  
            expect(paramsHandled).toEqual([{test: 'B'}, {test: 'C'}]);
        });
        
        it('second level segment with first level url', function() {
            $location.path('/Y');
            $rootScope.$digest();  
            expect(namesHandled).toEqual(['section2', 'section22']);  
            expect(paramsHandled).toEqual([{test: 'B'}, {test: 'D'}]);
        });
        
        it('third level', function() {
            $location.path('/X-foo')
            $rootScope.$digest();
            expect(namesHandled).toEqual(['section2', 'section21', 'section211']);
        });    
        
        it('a route with no segment', function() {
            $rootScope.$broadcast('$routeChangeSuccess', {$$route: {}});
            $rootScope.$digest();
            expect(namesHandled).toEqual([]);
            expect(paramsHandled).toEqual([]);
        });
        
        it('should throw an error when invalid section', function() {        
            expect(function() {
                $location.path('/invalid');
                $rootScope.$digest();
            }).toThrow();
            
            expect(function() {
                $location.path('/2/999/invalid');
                $rootScope.$digest();
            }).toThrow();
            
        });
        
         
        it('should fetch templateUrl by $http', function() {    
            $routeSegmentProvider.segment('section3', {templateUrl: '/abc/def'});            
            $httpBackend.expectGET('/abc/def').respond(200, 'TEST');
            $rootScope.$broadcast('$routeChangeSuccess', {$route: {segment: 'section3'}});
            $rootScope.$digest();
            var templateCallback = jasmine.createSpy('template');
            $routeSegmentProvider.segments.section3.params.template.then(templateCallback);
            $httpBackend.flush();
            expect(templateCallback).toHaveBeenCalledWith('TEST');
        });
        
        it('`startsWith` should work', function () {
            $location.path('/X-foo');
            $rootScope.$digest();
            expect($routeSegment.startsWith('section2.section21')).toBe(true);
            expect($routeSegment.startsWith('section2.sec')).toBe(true);
            expect($routeSegment.startsWith('section21')).toBe(false);
            expect($routeSegment.startsWith('section3')).toBe(false);
        })
        
        it('`contains` should work', function () {
            $location.path('/X-foo');
            $rootScope.$digest();
            expect($routeSegment.contains('section2')).toBe(true);
            expect($routeSegment.contains('section21')).toBe(true);
            expect($routeSegment.contains('section211')).toBe(true);
            expect($routeSegment.contains('section2.section21')).toBe(false);
            expect($routeSegment.contains('section3')).toBe(false);
        })
        
        it('should throw an error when adding a segment into non-existing parent while in strictMode', function() {
            
            $routeSegmentProvider.options.strictMode = true;
            expect(function() {
                $routeSegmentProvider.within('invalid');
            }).toThrow();
        })
        
        it('should not throw an error while strictMode=false', function() {
            
            $routeSegmentProvider.options.strictMode = false;
            expect(function() {
                $routeSegmentProvider.within('invalid').segment('invalid-child', {});
            }).not.toThrow();
            expect($routeSegmentProvider.segments.invalid.params).toBeDefined();
            expect($routeSegmentProvider.segments.invalid.children.invalidChild).toBeDefined();
        })
        
        it('should update existing segment with new one', function() {
            
            $routeSegmentProvider.options.strictMode = false;
            $routeSegmentProvider.within('test');
            expect($routeSegmentProvider.segments.test).toBeDefined();
            $routeSegmentProvider.segment('test', {foo: 'bar'});
            expect($routeSegmentProvider.segments.test.params.foo).toBe('bar');
            $routeSegmentProvider.segment('test', {baz: 'qux'});
            expect($routeSegmentProvider.segments.test.params.foo).toBeUndefined();
            expect($routeSegmentProvider.segments.test.params.baz).toBe('qux');
        })
    })
    
    
})