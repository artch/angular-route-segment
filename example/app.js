var app = angular.module('app', ['ngRoute', 'ngAnimate', 'route-segment', 'view-segment']);

app.config(function($routeSegmentProvider, $routeProvider) {
    
    // Configuring provider options
    
    $routeSegmentProvider.options.autoLoadTemplates = true;
    
    // Setting routes. This consists of two parts:
    // 1. `when` is similar to vanilla $route `when` but takes segment name instead of params hash
    // 2. traversing through segment tree to set it up
  
    $routeSegmentProvider
    
        .when('/section1',          's1')
        .when('/section1/prefs',    's1.prefs')
        .when('/section1/:id',      's1.itemInfo')
        .when('/section1/:id/X',    's1.itemInfo.tab1')
        .when('/section1/:id/Y',    's1.itemInfo.tab2')
        
        .when('/section2',          's2')
        .when('/section2/:id',      's2.itemInfo')
        
        .when('/section3',          's3')
        
        .segment('s1', {
            templateUrl: 'templates/section1.html',
            controller: 'MainCtrl'})
            
        .within()
            
            .segment('home', {
                'default': true,
                templateUrl: 'templates/section1/home.html'})
                
            .segment('itemInfo', {
                templateUrl: 'templates/section1/item.html',
                controller: 'Section1ItemCtrl',
                dependencies: ['id']})
                
            .within() 
                
                .segment('tab1', {
                    'default': true,
                    templateUrl: 'templates/section1/tabs/tab1.html'})
                    
                .segment('tab2', {
                    templateUrl: 'templates/section1/tabs/tab2.html'})
                
            .up()
                
            .segment('prefs', {
                templateUrl: 'templates/section1/prefs.html'})
                
        .up()
        
        .segment('s2', {
            templateUrl: 'templates/section2.html',
            controller: 'MainCtrl'})
            
        .within()
            
            .segment('itemInfo', {
                templateUrl: 'templates/section2/item.html',
                dependencies: ['id']})
                
        .up()
            
        .segment('s3', {
            templateUrl: 'templates/section3.html'})
            
            
    // Also, we can add new item in a deep separately. This is useful when working with
    // routes in every module individually
            
    $routeSegmentProvider
    
        .when('/section1/:id/Z',    's1.itemInfo.tab3')  
        
        .within('s1')
            .within('itemInfo')
                .segment('tab3', {
                    templateUrl: 'templates/section1/tabs/tab3.html'})
                    
                    
    // This is some usage of `resolve`, `untilResolved` and `resolveFailed` features
                    
    $routeSegmentProvider
    
        .when('/invalid-template', 's1.invalidTemplate')
        .when('/invalid-data', 's1.invalidData')
        .when('/slow-data', 's1.slowDataSimple')
        .when('/slow-data-loading', 's1.slowDataLoading')
        .when('/inline-view', 's1.inlineParent')
        .when('/section1/:id/slow',    's1.itemInfo.tabSlow')
        
        .within('s1')
            .segment('invalidTemplate', {
                templateUrl: 'this-does-not-exist.html',    // 404
                resolveFailed: {
                    templateUrl: 'templates/error.html',
                    controller: 'ErrorCtrl'
                }
            })
            .segment('invalidData', {
                templateUrl: 'templates/section1/home.html',     // Correct!
                resolve: {
                    data: function($q) {
                        return $q.reject('ERROR DESCRIPTION');     // Failed to load data
                    }
                },
                resolveFailed: {
                    templateUrl: 'templates/error.html',
                    controller: 'ErrorCtrl'
                }
            })
            .segment('slowDataSimple', {
                templateUrl: 'templates/section1/slow-data.html',
                controller: 'SlowDataCtrl',
                resolve: {
                    data: function($timeout, loader) {
                        loader.show = true;
                        return $timeout(function() { return 'SLOW DATA CONTENT'; }, 2000);
                    }
                }
            })
            .segment('slowDataLoading', {
                templateUrl: 'templates/section1/slow-data.html',
                controller: 'SlowDataCtrl',
                resolve: {
                    data: function($timeout) {
                        return $timeout(function() { return 'SLOW DATA CONTENT'; }, 2000);
                    }
                },
                untilResolved: {
                    templateUrl: 'templates/loading.html'
                }
            })
            .segment('inlineParent', {
                templateUrl: 'templates/section1/inline-view.html'
            })
            .within()
                .segment('inlineChildren', {
                    // no template here
                    controller: 'SlowDataCtrl',
                    'default': true,
                    resolve: {
                        data: function($timeout) {
                            return $timeout(function() { return 'SLOW DATA CONTENT'; }, 2000);
                        }
                    },
                    untilResolved: {
                        templateUrl: 'templates/loading.html'
                    }
                })
                .up()

            .within('itemInfo')
                .segment('tabSlow', {
                    templateUrl: 'templates/section1/slow-data.html',
                    controller: 'SlowDataCtrl',
                    resolve: {
                        data: function($timeout) {
                            return $timeout(function() { return 'SLOW DATA CONTENT'; }, 2000);
                        }
                    },
                    untilResolved: {
                        templateUrl: 'templates/loading.html'
                    }
                })

                
        
        
    $routeProvider.otherwise({redirectTo: '/section1'}); 
}) ;

app.value('loader', {show: false});

app.controller('MainCtrl', function($scope, $routeSegment, loader) {

    $scope.$routeSegment = $routeSegment;
    $scope.loader = loader;

    $scope.$on('routeSegmentChange', function() {
        loader.show = false;
    })
});

app.controller('Section1Ctrl', function($scope, $routeSegment) {
    
    $scope.$routeSegment = $routeSegment;
    $scope.test = { btnClicked: false };
    $scope.items = [ 1,2,3,4,5 ];
});

app.controller('Section1ItemCtrl', function($scope, $routeSegment) {

    $scope.$routeSegment = $routeSegment;
    $scope.item = { id: $routeSegment.$routeParams.id };
    $scope.test = { textValue: '' };
});

app.controller('Section2Ctrl', function($scope, $routeSegment) {

    $scope.$routeSegment = $routeSegment;
    $scope.test = { textValue: '' };
    $scope.items = [ 1,2,3,4,5,6,7,8,9 ];
});

app.controller('ErrorCtrl', function($scope, error) {
    $scope.error = error;
});

app.controller('SlowDataCtrl', function($scope, data, loader) {
    loader.show = false;
    $scope.data = data;
});

