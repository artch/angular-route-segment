module.exports = function(grunt) {

    grunt.initConfig({
        
        pkg: grunt.file.readJSON('package.json'),
                
        uglify: {
            options: {
                banner: "/**\n * angular-route-segment <%=pkg.version%>\n * https://angular-route-segment.com\n * @author Artem Chivchalov\n * @license MIT License http://opensource.org/licenses/MIT\n */\n"
            },
            prod: {
                files: {
                    'build/angular-route-segment.min.js': ['build/angular-route-segment.js']
                }
            }
        },
        
        concat: {
            options: {
                separator: ';',
                banner: "/**\n * angular-route-segment <%=pkg.version%>\n * https://angular-route-segment.com\n * @author Artem Chivchalov\n * @license MIT License http://opensource.org/licenses/MIT\n */\n"
            },
            prod: {
                src: ['src/**/*.js'],
                dest: 'build/angular-route-segment.js'
            }
        },        
        
        karma: {
            angular12: {
                options: {
                    keepalive: true,
                    configFile: 'karma-angular-1.2.conf.js',
                    autoWatch: false,
                    singleRun: true
                }
            },
            angular13: {
                options: {
                    keepalive: true,
                    configFile: 'karma-angular-1.3.conf.js',
                    autoWatch: false,
                    singleRun: true
                }
            },
            angular14: {
                options: {
                    keepalive: true,
                    configFile: 'karma-angular-1.4.conf.js',
                    autoWatch: false,
                    singleRun: true
                }
            },
            angular15: {
                options: {
                    keepalive: true,
                    configFile: 'karma-angular-1.5.conf.js',
                    autoWatch: false,
                    singleRun: true
                }
            }
        },

        "git-describe": {
            run: {
                options: {
                    prop: 'gitdescribe'
                }
            }
        },

        "dgeni-alive": {
            options: {
                  serve: {
                      port: '10000',
                      openBrowser: false
                  },
            },
            api: {
                  title: '<%= pkg.title %>',
                  version: '<%= pkg.version %>',
                  expand: false,
                  src: [
                      'src/**/*.js',
                      'docs/**/*.ngdoc'
                  ],
                  dest: 'build/docs'
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-git-describe');
    grunt.loadNpmTasks('dgeni-alive');

    grunt.registerTask('default', ['concat:prod']);
    grunt.registerTask('prod', ['git-describe:run', 'concat:prod', 'uglify']);
};
