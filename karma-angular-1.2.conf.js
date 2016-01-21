module.exports = function(config) {
    config.set({

        basePath: './',

        frameworks: ["jasmine"],

        files: [
            'test/lib/jquery.min.js',
            'test/lib/helpers.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular-route.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular-animate.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular-mocks.js',
            'src/**/*.js',
            'test/unit/**/*.js'
        ],

        autoWatch: true,

        browsers: ['PhantomJS']

    });
};