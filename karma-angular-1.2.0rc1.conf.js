module.exports = function(config) {
    config.set({

        basePath: './',

        frameworks: ["jasmine"],

        files: [
            'test/lib/jquery.min.js',
            'test/lib/helpers.js',
            'test/lib/angular-1.2.0rc1/angular.js',
            'test/lib/angular-1.2.0rc1/angular-*.js',
            'test/lib/angular-1.2.0rc1/init.js',
            'src/**/*.js',
            'test/unit/**/*.js'
        ],

        autoWatch: true,

        browsers: ['PhantomJS']

    });
};