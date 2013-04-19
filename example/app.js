angular.module('app', ['route-segment', 'view-segment'])

.config(function($routeSegmentProvider, $routeProvider) {
    
    $routeSegmentProvider.options.autoLoadTemplates = true;
  
    $routeSegmentProvider
    
        .when('/section1',          's1.home')
        .when('/section1/prefs',    's1.prefs')
        .when('/section1/:id',      's1.itemInfo.tab1')
        .when('/section1/:id/X',    's1.itemInfo.tab1')
        .when('/section1/:id/Y',    's1.itemInfo.tab2')
        .when('/section1/:id/Z',    's1.itemInfo.tab3')
        
        .when('/section2',          's2')
        .when('/section2/:id',      's2.itemInfo')
        
        .when('/section3',          's3')
        
        .segment('s1', {
            templateUrl: 'templates/section1.html',
            controller: MainCtrl})
            
        .within()
            
            .segment('home', {
                templateUrl: 'templates/section1/home.html'})
                
            .segment('itemInfo', {
                templateUrl: 'templates/section1/item.html',
                controller: Section1ItemCtrl,
                dependencies: ['id']})
                
            .within() 
                
                .segment('tab1', {
                    templateUrl: 'templates/section1/tabs/tab1.html'})
                    
                .segment('tab2', {
                    templateUrl: 'templates/section1/tabs/tab2.html'})
                
            .up()
                
            .segment('prefs', {
                templateUrl: 'templates/section1/prefs.html'})
                
        .up()
        
        .segment('s2', {
            templateUrl: 'templates/section2.html',
            controller: MainCtrl})
            
        .within()
            
            .segment('itemInfo', {
                templateUrl: 'templates/section2/item.html',
                dependencies: ['id']})
                
        .up()
            
        .segment('s3', {
            templateUrl: 'templates/section3.html'})
            
            
    // Also, we can add new item in a deep separately           
    $routeSegmentProvider
        .within('s1')
            .within('itemInfo')
                .segment('tab3', {
                    templateUrl: 'templates/section1/tabs/tab3.html'})
        
        
    $routeProvider.otherwise({redirectTo: '/section1'}); 
})

function MainCtrl($scope, $routeSegment) {
    
    $scope.$routeSegment = $routeSegment;
}

function Section1Ctrl($scope, $routeSegment, $routeParams) {
    
    $scope.$routeSegment = $routeSegment;
    $scope.$routeParams = $routeParams;
    $scope.test = { btnClicked: false };
    $scope.items = [ 1,2,3,4,5 ];
}

function Section1ItemCtrl($scope, $routeSegment, $routeParams) {
    
    $scope.$routeParams = $routeParams;
    $scope.$routeSegment = $routeSegment;
    $scope.item = { id: $routeParams.id };
    $scope.test = { textValue: '' };
}

function Section2Ctrl($scope, $routeSegment, $routeParams) {
    
    $scope.$routeParams = $routeParams;
    $scope.$routeSegment = $routeSegment;
    $scope.test = { textValue: '' };
    $scope.items = [ 1,2,3,4,5,6,7,8,9 ];
}