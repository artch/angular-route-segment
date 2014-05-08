module.exports = function(config) {
    config.set({

        basePath: './',

        frameworks: ["jasmine"],

        files: [
            'test/lib/jquery.min.js',
            'test/lib/helpers.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.1.5/angular.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.1.5/angular-mocks.js',
            'src/**/*.js',
            'test/unit/**/*.js'
        ],

        autoWatch: true,

        browsers: ['PhantomJS']

    });
};