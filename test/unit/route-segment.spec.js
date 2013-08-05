'use strict';

describe('route segment', function() {
    
    beforeEach(module('route-segment'));
        
    var $routeSegment, $routeSegmentProvider, $rootScope, $httpBackend, $location, $provide;
    var callback;
    
    beforeEach(module(function(_$routeSegmentProvider_, _$provide_) {
        
        $provide = _$provide_;
        
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
           
        $routeSegmentProvider.options.autoLoadTemplates = false;    // We don't want to perform any XHRs here
        $routeSegmentProvider.options.strictMode = true;
    }))
    
    beforeEach(function() {
        inject(function(_$routeSegment_, _$rootScope_, _$httpBackend_, _$location_) {    
            $routeSegment = _$routeSegment_;
            $rootScope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            $location = _$location_;
        });
        
        callback = jasmine.createSpy('callback');
        $rootScope.$on('routeSegmentChange', callback); 
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
        
        var scope;
                
        it('first level', function() {            
            $location.path('/1');
            $rootScope.$digest();
            
            expect(callback.calls.length).toBe(1);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {name: 'section-first', params: {test: 'A'}, locals: {}}});
        });
        
        it('second level', function() {
            $location.path('/2/X');
            $rootScope.$digest();  
            
            expect(callback.calls.length).toBe(2);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {name: 'section2', params: {test: 'B'}, locals: {}}});
            expect(callback.calls[1].args[1]).toEqual({index: 1, segment: {name: 'section21', params: {test: 'C'}, locals: {}}});
        });
        
        it('second level segment with first level url', function() {
            $location.path('/Y');
            $rootScope.$digest();  
            
            expect(callback.calls.length).toBe(2);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {name: 'section2', params: {test: 'B'}, locals: {}}});
            expect(callback.calls[1].args[1]).toEqual({index: 1, segment: {name: 'section22', params: {test: 'D'}, locals: {}}});
        });
        
        it('third level', function() {
            $location.path('/X-foo')
            $rootScope.$digest();
            
            expect(callback.calls.length).toBe(3);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {name: 'section2', params: {test: 'B'}, locals: {}}});
            expect(callback.calls[1].args[1]).toEqual({index: 1, segment: {name: 'section21', params: {test: 'C'}, locals: {}}});
            expect(callback.calls[2].args[1]).toEqual({index: 2, segment: {name: 'section211', params: {test: 'E'}, locals: {}}});
        });    
        
        it('a route with no segment', function() {
            $rootScope.$broadcast('$routeChangeSuccess', {$$route: {}});
            $rootScope.$digest();
            expect(callback).not.toHaveBeenCalled();
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
        
         
        it('should auto-fetch templateUrl by $http', function() {
            
            $routeSegmentProvider.options.autoLoadTemplates = true;
            
            $routeSegmentProvider.segment('section3', {templateUrl: '/abc/def'});            
            $httpBackend.expectGET('/abc/def').respond(200, 'TEST');
            $rootScope.$broadcast('$routeChangeSuccess', {$route: {segment: 'section3'}});
            $rootScope.$digest();
            /*var templateCallback = jasmine.createSpy('template');
            $routeSegmentProvider.segments.section3.locals.$template.then(templateCallback);
            $httpBackend.flush();
            expect(templateCallback).toHaveBeenCalledWith('TEST');*/
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
        
        it('should go down to a child after going to a parent', function() {
            
            $location.path('/2');
            $rootScope.$digest();
            
            callback = jasmine.createSpy('event');
            $rootScope.$on('routeSegmentChange', callback);
            $location.path('/2/X');
            $rootScope.$digest();
            expect(callback.calls.length).toBe(1);
            expect(callback.calls[0].args[1]).toEqual({index: 1, segment: {name: 'section21', params: {test: 'C'}, locals: {}}});
        })  
        
        it('should go up to parent after going to a child, sending null for previously loaded child segment', function() {
            
            $location.path('/2/X');
            $rootScope.$digest();
            
            callback = jasmine.createSpy('event');
            $rootScope.$on('routeSegmentChange', callback);
            $location.path('/2');
            $rootScope.$digest();
            expect(callback.calls.length).toBe(1);
            expect(callback.calls[0].args[1]).toEqual({index: 1, segment: null});
        })  
        
        it('should update when dependencies are changed', function() {
            
            $routeSegmentProvider.when('/2/details/:id/:tab', 'section2.details');
            $routeSegmentProvider.within('section2').segment('details', {dependencies: ['id']});
            
            $location.path('/2/details/1/info');
            $rootScope.$digest();            
            
            expect(callback.calls.length).toBe(2);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {name: 'section2', params: {test: 'B'}, locals: {}}});
            expect(callback.calls[1].args[1]).toEqual({index: 1, segment: {name: 'details', params: {dependencies: ['id']}, locals: {}}});
            
            callback = jasmine.createSpy('event');
            $rootScope.$on('routeSegmentChange', callback);
            $location.path('/2/details/1/edit');
            $rootScope.$digest();
            
            expect(callback).not.toHaveBeenCalled();
            
            callback = jasmine.createSpy('event');
            $rootScope.$on('routeSegmentChange', callback);
            $location.path('/2/details/2/edit');
            $rootScope.$digest();
            
            expect(callback.calls.length).toBe(1);
            expect(callback.calls[0].args[1]).toEqual({index: 1, segment: {name: 'details', params: {dependencies: ['id']}, locals: {}}});
        })
    })
    
    describe('resolving', function() {       
        
        var resolve;
        
        beforeEach(function() {
            resolve = {};
            $routeSegmentProvider.when('/3', 'section3');
            $routeSegmentProvider.segment('section3', {resolve: resolve});
        })
        
        
        it('should resolve a param as function', inject(function($q) {
            
            var defer = $q.defer();    
            resolve.param1 = function() { return defer.promise; };
            
            $location.path('/3');
            
            $rootScope.$digest();            
            expect(callback).not.toHaveBeenCalled();
            
            defer.resolve();
            
            $rootScope.$digest();
            expect(callback).toHaveBeenCalled();
            expect(callback.calls[0].args[1].segment.name).toBe('section3');     
        }))
        
        it('should resolve a param as an injectable by its string name', inject(function($q) {
            
            var defer = $q.defer();
            $provide.factory('injectable', function() {
                return defer.promise;
            });            
            resolve.param1 = 'injectable';
            
            $location.path('/3');
            
            $rootScope.$digest();            
            expect(callback).not.toHaveBeenCalled();
            
            defer.resolve();
            
            $rootScope.$digest();            
            expect(callback).toHaveBeenCalled();
            expect(callback.calls[0].args[1].segment.name).toBe('section3');   
        }))
        
        it('should receive two resolved values in locals', inject(function($q) {
            
            var defer1 = $q.defer(), defer2 = $q.defer();
            resolve.param1 = function() { return defer1.promise; };
            resolve.param2 = function() { return defer2.promise; };
            
            $location.path('/3');
            defer1.resolve('TEST1');
            
            $rootScope.$digest();
            expect(callback).not.toHaveBeenCalled();
            
            defer2.resolve('TEST2');
            
            $rootScope.$digest();            
            expect(callback.calls[0].args[1].segment.locals.param1).toBe('TEST1');
            expect(callback.calls[0].args[1].segment.locals.param2).toBe('TEST2');
        }))
    })
    
    
})