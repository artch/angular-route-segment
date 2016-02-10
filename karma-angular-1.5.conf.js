module.exports = function(config) {
    config.set({

        basePath: './',

        frameworks: [
             'jasmine',
             'jasmine-jquery-matchers'
        ],

        files: [
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular-route.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular-animate.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular-mocks.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular-scenario.js',
            'src/**/*.js',
            'test/unit/**/*.js'
        ],

        autoWatch: true,

        browsers: ['PhantomJS']

    });
};