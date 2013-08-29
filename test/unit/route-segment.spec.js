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

    describe('configuring', function() {

        it('should throw an error when adding a segment into non-existing parent while in strictMode', function () {

            $routeSegmentProvider.options.strictMode = true;
            expect(function () {
                $routeSegmentProvider.within('invalid');
            }).toThrow();
        })

        it('should not throw an error while strictMode=false', function () {

            $routeSegmentProvider.options.strictMode = false;
            expect(function () {
                $routeSegmentProvider.within('invalid').segment('invalid-child', {});
            }).not.toThrow();
            expect($routeSegmentProvider.segments.invalid.params).toBeDefined();
            expect($routeSegmentProvider.segments.invalid.children.invalidChild).toBeDefined();
        })

        it('should update existing segment with new one', function () {

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
    
    describe('routing', function () {

        it('first level', function () {
            $location.path('/1');

            $rootScope.$digest();
            expect(callback.calls.length).toBe(1);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {
                name: 'section-first', params: {test: 'A'}, locals: {}, reload: jasmine.any(Function)}});
        });

        it('second level', function () {
            $location.path('/2/X');

            $rootScope.$digest();
            expect(callback.calls.length).toBe(2);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {
                name: 'section2', params: {test: 'B'}, locals: {}, reload: jasmine.any(Function)}});
            expect(callback.calls[1].args[1]).toEqual({index: 1, segment: {
                name: 'section21', params: {test: 'C'}, locals: {}, reload: jasmine.any(Function)}});
        });

        it('second level segment with first level url', function () {
            $location.path('/Y');

            $rootScope.$digest();
            expect(callback.calls.length).toBe(2);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {
                name: 'section2', params: {test: 'B'}, locals: {}, reload: jasmine.any(Function)}});
            expect(callback.calls[1].args[1]).toEqual({index: 1, segment: {
                name: 'section22', params: {test: 'D'}, locals: {}, reload: jasmine.any(Function)}});
        });

        it('third level', function () {
            $location.path('/X-foo')

            $rootScope.$digest();
            expect(callback.calls.length).toBe(3);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {
                name: 'section2', params: {test: 'B'}, locals: {}, reload: jasmine.any(Function)}});
            expect(callback.calls[1].args[1]).toEqual({index: 1, segment: {
                name: 'section21', params: {test: 'C'}, locals: {}, reload: jasmine.any(Function)}});
            expect(callback.calls[2].args[1]).toEqual({index: 2, segment: {
                name: 'section211', params: {test: 'E'}, locals: {}, reload: jasmine.any(Function)}});
        });

        it('a route with no segment', function () {
            $rootScope.$broadcast('$routeChangeSuccess', {$$route: {}});
            $rootScope.$digest();
            expect(callback).not.toHaveBeenCalled();
        });

        it('should throw an error when invalid section', function () {
            expect(function () {
                $location.path('/invalid');
                $rootScope.$digest();
            }).toThrow();

            expect(function () {
                $location.path('/2/999/invalid');
                $rootScope.$digest();
            }).toThrow();

        });


        it('should auto-fetch templateUrl by $http', function () {

            $routeSegmentProvider.options.autoLoadTemplates = true;
            $routeSegmentProvider.segment('section3', {templateUrl: '/abc/def'});

            $httpBackend.expectGET('/abc/def').respond(200, 'TEST');
            $rootScope.$broadcast('$routeChangeSuccess', {$route: {segment: 'section3'}});

            $rootScope.$digest();
            $httpBackend.flush();
            expect(callback.calls[0].args[1].segment.locals.$template).toEqual('TEST');
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

        it('should go down to a child after going to a parent', function () {

            $location.path('/2');
            $rootScope.$digest();

            callback = jasmine.createSpy('event');
            $rootScope.$on('routeSegmentChange', callback);

            $location.path('/2/X');

            $rootScope.$digest();
            expect(callback.calls.length).toBe(1);
            expect(callback.calls[0].args[1]).toEqual({index: 1, segment: {
                name: 'section21', params: {test: 'C'}, locals: {}, reload: jasmine.any(Function)}});
        })

        it('should go up to parent after going to a child, sending null for previously loaded child segment', function () {

            $location.path('/2/X');

            $rootScope.$digest();
            callback = jasmine.createSpy('event');
            $rootScope.$on('routeSegmentChange', callback);

            $location.path('/2');

            $rootScope.$digest();
            expect(callback.calls.length).toBe(1);
            expect(callback.calls[0].args[1]).toEqual({index: 1, segment: null});
            expect($routeSegment.chain.length).toBe(1);
            expect($routeSegment.chain[0].name).toBe('section2');
        })


        it('should go to from a route with a child to a sibling with no children', function () {
            $location.path('/2/X');
            $rootScope.$digest();

            callback = jasmine.createSpy('callback');
            $rootScope.$on('routeSegmentChange', callback);

            $location.path('/1');

            $rootScope.$digest();
            expect($routeSegment.name).toBe('section-first');
            expect(callback.calls.length).toBe(2);
            expect(callback.calls[0].args[1].segment.name).toBe('section-first');
            expect(callback.calls[1].args[1].segment).toBe(null);
        })

        it('should update when dependencies are changed', function () {

            $routeSegmentProvider.when('/2/details/:id/:tab', 'section2.details');
            $routeSegmentProvider.within('section2').segment('details', {dependencies: ['id']});

            $location.path('/2/details/1/info');

            $rootScope.$digest();
            expect(callback.calls.length).toBe(2);
            expect(callback.calls[0].args[1]).toEqual({index: 0, segment: {
                name: 'section2', params: {test: 'B'}, locals: {}, reload: jasmine.any(Function)}});
            expect(callback.calls[1].args[1]).toEqual({index: 1, segment: {
                name: 'details', params: {dependencies: ['id']}, locals: {}, reload: jasmine.any(Function)}});
            expect($routeSegment.$routeParams.id).toBe('1');
            expect($routeSegment.$routeParams.tab).toBe('info');

            callback = jasmine.createSpy('event');
            $rootScope.$on('routeSegmentChange', callback);

            $location.path('/2/details/1/edit');

            $rootScope.$digest();
            expect(callback).not.toHaveBeenCalled();
            expect($routeSegment.$routeParams.id).toBe('1');

            callback = jasmine.createSpy('event');
            $rootScope.$on('routeSegmentChange', callback);

            $location.path('/2/details/2/edit');

            $rootScope.$digest();
            expect(callback.calls.length).toBe(1);
            expect(callback.calls[0].args[1]).toEqual({index: 1, segment: {
                name: 'details', params: {dependencies: ['id']}, locals: {}, reload: jasmine.any(Function)}});
            expect($routeSegment.$routeParams.id).toBe('2');
            expect($routeSegment.$routeParams.tab).toBe('edit');
        })

        it('should update a segment by reload()', function() {

            $location.path('/2');

            $rootScope.$digest();
            expect(callback.calls.length).toBe(1);

            $routeSegment.chain[0].reload();

            $rootScope.$digest();
            expect(callback.calls.length).toBe(2);
            expect(callback.calls[1].args[1].index).toBe(0);
            expect(callback.calls[1].args[1].segment.name).toBe('section2');
        })

        it('should shorten $routeSegment.chain.length from 3 to 1', function() {

            $location.path('/2/1/bar');
            $rootScope.$digest();

            $location.path('/2');

            $rootScope.$digest();
            expect($routeSegment.chain.length).toBe(1);
        })

        describe('watcher', function() {

            var watchedObj;
            beforeEach(function() {
                watchedObj = {value: 0};
                $provide.value('injectable', watchedObj);
            })

            it('should update when watcher function returns new value', function () {

                $routeSegmentProvider.when('/3', 'section3').segment('section3', {
                    watcher: function(injectable) {
                        return injectable.value;
                    }
                })

                $location.path('/3');

                $rootScope.$digest();
                expect(callback.calls.length).toBe(1);

                watchedObj.value = 1;

                $rootScope.$digest();
                expect(callback.calls.length).toBe(2);

            })

            it('should inject segment info into watcher function', function() {

                var segmentName;
                $routeSegmentProvider.when('/3', 'section3').segment('section3', {
                    watcher: function(segment) {
                        segmentName = segment.name;
                    }
                })

                $location.path('/3');

                $rootScope.$digest();
                expect(segmentName).toBe('section3');
            })

            it('should clear the watcher when a segment is replaced by new one', function() {

                $routeSegmentProvider.when('/3', 'section3').segment('section3', {
                    watcher: function(injectable) {
                        return injectable.value;
                    }
                })

                $location.path('/3');

                $rootScope.$digest();
                expect(callback.calls.length).toBe(1);

                $location.path('/2');

                $rootScope.$digest();
                expect(callback.calls.length).toBe(2);

                watchedObj.value = 1;

                $rootScope.$digest();
                expect(callback.calls.length).toBe(2);
            })

        })
    });
    
    describe('resolving', function() {       
        
        var resolve;
        
        beforeEach(function() {
            resolve = {};
            $routeSegmentProvider.when('/3', 'section3');            
        })        
        
        describe('without `untilResolved`', function() {
            
            beforeEach(function() {
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
            
            it('should throw an error if a promise is rejected but no `resolveFailed` provided', inject(function($q) {
                
                resolve.param1 = function() { return $q.reject(); }
                
                expect(function() {
                    $location.path('/3');                
                    $rootScope.$digest();
                }).toThrow();
            }))

            it('should not set new segment until resolve is completed', inject(function($q) {

                var defer = $q.defer();
                resolve.param1 = function() { return defer.promise; };

                $location.path('/3');

                $rootScope.$digest();
                expect($routeSegment.name).not.toEqual('section3');
            }))

            it('should not restore previous yet unresolved segment after new one is selected', inject(function($q) {

                var defer = $q.defer();
                resolve.param1 = function() { return defer.promise; };
                $location.path('/3');
                $rootScope.$digest();

                $location.path('/1');

                $rootScope.$digest();
                expect($routeSegment.name).toEqual('section-first');

                defer.resolve();

                $rootScope.$digest();
                expect(callback.calls.length).toBe(1);
                expect($routeSegment.chain[0].name).toEqual('section-first');
                expect($routeSegment.name).toEqual('section-first');
            }))

            it('should not restore previous yet unresolved segment after new one is selected in 2nd level',
                inject(function($q) {

                $location.path('/2/X');
                $rootScope.$digest();

                callback = jasmine.createSpy('event');
                $rootScope.$on('routeSegmentChange', callback);
                var defer = $q.defer();
                resolve.param1 = function() { return defer.promise; };
                $location.path('/3');
                $rootScope.$digest();

                $location.path('/2/X');

                $rootScope.$digest();
                expect($routeSegment.name).toEqual('section2.section21');

                defer.resolve();

                $rootScope.$digest();
                expect(callback).not.toHaveBeenCalled();
                expect($routeSegment.chain[0].name).toEqual('section2');
                expect($routeSegment.chain[1].name).toEqual('section21');
                expect($routeSegment.name).toEqual('section2.section21');
            }))
        })
        
        describe('with `untilResolved`', function() {
        
            beforeEach(function() {
                $routeSegmentProvider.segment('section3', {
                    stage: 'AFTER',
                    resolve: resolve,
                    untilResolved: {stage: 'BEFORE'}
                });
            })
            
            it('should call the callback twice, before and after it is resolved', inject(function($q) {
                
                var defer = $q.defer();    
                resolve.param1 = function() { return defer.promise; };
                
                $location.path('/3');
                
                $rootScope.$digest();            
                expect(callback.calls.length).toBe(1);
                expect(callback.calls[0].args[1].segment.params.stage).toBe('BEFORE');
                
                defer.resolve();
                
                $rootScope.$digest();
                expect(callback.calls.length).toBe(2);
                expect(callback.calls[1].args[1].segment.params.stage).toBe('AFTER');     
            }))
            
        })
        
        describe('with `resolveFailed`', function() {
            
            beforeEach(function() {
                $routeSegmentProvider.segment('section3', {
                    stage: 'OK',
                    resolve: resolve,
                    resolveFailed: {stage: 'ERROR'}
                });
            })
            
            it('should use resolveFailed set of params if a promise is rejected', inject(function($q) {
              
                resolve.param1 = function() { return $q.reject('foo'); }
                
                $location.path('/3');
                
                $rootScope.$digest();
                expect(callback.calls[0].args[1].segment.params.stage).toBe('ERROR');
                expect(callback.calls[0].args[1].segment.locals.error).toEqual('foo');
            }))
            
            it('should auto-fetch failing templateUrl if resolving is failed', inject(function($q) {
                resolve.param1 = function() { return $q.reject('foo'); }
                $routeSegmentProvider.options.autoLoadTemplates = true;                
                $routeSegmentProvider.segment('section3', {
                    resolveFailed: {
                        templateUrl: '/abc/def'
                    },
                    resolve: resolve
                });            
                $httpBackend.expectGET('/abc/def').respond(200, 'TEST');
                $rootScope.$broadcast('$routeChangeSuccess', {$route: {segment: 'section3'}});
                
                $rootScope.$digest();
                $httpBackend.flush();
                expect(callback.calls[0].args[1].segment.locals.error).toEqual('foo');                
                expect(callback.calls[0].args[1].segment.locals.$template).toEqual('TEST');
            }))

            it('should use `resolveFailed` set of params if templateUrl does not exist', function() {
                $routeSegmentProvider.options.autoLoadTemplates = true;
                $routeSegmentProvider.segment('section3', {
                    templateUrl: 'does-not-exist.html',
                    stage: 'OK',
                    resolveFailed: { stage: 'ERROR'}
                });

                $httpBackend.expectGET('does-not-exist.html').respond(404, 'ERROR');
                $rootScope.$broadcast('$routeChangeSuccess', {$route: {segment: 'section3'}});

                $rootScope.$digest();
                $httpBackend.flush();
                expect(callback.calls[0].args[1].segment.params.stage).toBe('ERROR');
            })
        })

        describe('resolving nested segment in series when all levels have some resolving', function() {

            var defers;
            beforeEach(inject(function($q) {
                defers = [];
                defers.push($q.defer());
                defers.push($q.defer());
                defers.push($q.defer());
                $routeSegmentProvider.segment('section3', {
                    stage: 'AFTER',
                    resolve: {
                        data: function() {
                            return defers[0].promise;
                        }
                    },
                    untilResolved: {
                        stage: 'BEFORE'
                    }
                })
                $routeSegmentProvider.within('section3').segment('section31', {
                    stage: 'AFTER',
                    resolve: {
                        data: function() {
                            return defers[1].promise;
                        }
                    },
                    untilResolved: {
                        stage: 'BEFORE'
                    }
                })
                $routeSegmentProvider.within('section3').within('section31').segment('section311', {
                    stage: 'AFTER',
                    resolve: {
                        data: function() {
                            return defers[2].promise;
                        }
                    },
                    untilResolved: {
                        stage: 'BEFORE'
                    }
                })
                $routeSegmentProvider.when('/3/1', 'section3.section31');
                $routeSegmentProvider.when('/3/1/1', 'section3.section31.section311');
            }))

            function expectSegmentChangeCall(callIndex, segmentName, segmentStage) {
                expect(callback.calls[callIndex].args[1].segment.name).toBe(segmentName);
                expect(callback.calls[callIndex].args[1].segment.params.stage).toBe(segmentStage);
            }

            it('should work in order 0-1-2', function() {
                $location.path('/3/1/1');

                $rootScope.$digest();
                expect(callback.calls.length).toBe(1);
                expectSegmentChangeCall(0, 'section3', 'BEFORE');
                expect($routeSegment.name).toBe('section3');
                expect($routeSegment.chain.length).toBe(1);

                defers[0].resolve();

                $rootScope.$digest();
                expect(callback.calls.length).toBe(3);
                expectSegmentChangeCall(1, 'section3', 'AFTER');
                expectSegmentChangeCall(2, 'section31', 'BEFORE');
                expect($routeSegment.name).toBe('section3.section31');
                expect($routeSegment.chain.length).toBe(2);

                defers[1].resolve();

                $rootScope.$digest();
                expect(callback.calls.length).toBe(5);
                expectSegmentChangeCall(3, 'section31', 'AFTER');
                expectSegmentChangeCall(4, 'section311', 'BEFORE');
                expect($routeSegment.name).toBe('section3.section31.section311');
                expect($routeSegment.chain.length).toBe(3);

                defers[2].resolve();

                $rootScope.$digest();
                expect(callback.calls.length).toBe(6);
                expectSegmentChangeCall(5, 'section311', 'AFTER');
                expect($routeSegment.name).toBe('section3.section31.section311');
            })

            it('should work in order 0-2-1', function() {
                $location.path('/3/1/1');
                defers[0].resolve();
                $rootScope.$digest();

                defers[2].resolve();

                $rootScope.$digest();
                expect(callback.calls.length).toBe(3);
                expectSegmentChangeCall(0, 'section3', 'BEFORE');
                expectSegmentChangeCall(1, 'section3', 'AFTER');
                expectSegmentChangeCall(2, 'section31', 'BEFORE');
                expect($routeSegment.name).toBe('section3.section31');
                expect($routeSegment.chain.length).toBe(2);

                defers[1].resolve();

                $rootScope.$digest();
                expect(callback.calls.length).toBe(6);
                expectSegmentChangeCall(3, 'section31', 'AFTER');
                expectSegmentChangeCall(4, 'section311', 'BEFORE');
                expectSegmentChangeCall(5, 'section311', 'AFTER');
                expect($routeSegment.name).toBe('section3.section31.section311');
                expect($routeSegment.chain.length).toBe(3);
            })

            it('should work in order 2-1-0', function() {
                $location.path('/3/1/1');
                $rootScope.$digest();

                defers[2].resolve();

                $rootScope.$digest();
                expect(callback.calls.length).toBe(1);
                expectSegmentChangeCall(0, 'section3', 'BEFORE');

                defers[1].resolve();

                $rootScope.$digest();
                expect(callback.calls.length).toBe(1);

                defers[0].resolve();

                $rootScope.$digest();
                expect(callback.calls.length).toBe(6);
                expectSegmentChangeCall(1, 'section3', 'AFTER');
                expectSegmentChangeCall(2, 'section31', 'BEFORE');
                expectSegmentChangeCall(3, 'section31', 'AFTER');
                expectSegmentChangeCall(4, 'section311', 'BEFORE');
                expectSegmentChangeCall(5, 'section311', 'AFTER');
                expect($routeSegment.name).toBe('section3.section31.section311');
                expect($routeSegment.chain.length).toBe(3);
            })

        })

    })
    
    
})