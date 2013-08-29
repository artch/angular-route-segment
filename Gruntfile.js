module.exports = function(grunt) {

    grunt.initConfig({
        
        pkg: grunt.file.readJSON('package.json'),
                
        uglify: {
            options: {
                banner: "/**\n * angular-route-segment <%=grunt.config('gitdescribe')[1]%>\n * https://angular-route-segment.com\n * @author Artem Chivchalov\n * @license MIT License http://opensource.org/licenses/MIT\n */\n"
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
                banner: "/**\n * angular-route-segment <%=(grunt.config('gitdescribe') && grunt.config('gitdescribe')[1])%>\n * https://angular-route-segment.com\n * @author Artem Chivchalov\n * @license MIT License http://opensource.org/licenses/MIT\n */\n"
            },
            prod: {
                src: ['src/**/*.js'],
                dest: 'build/angular-route-segment.js'
            }
        },        
        
        karma: {
            angular115: {
                options: {
                    keepalive: true,
                    configFile: 'karma-angular-1.1.5.conf.js',
                    autoWatch: false,
                    singleRun: true
                }                
            },
            angular120: {
                options: {
                    keepalive: true,
                    configFile: 'karma-angular-1.2.0rc1.conf.js',
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
        }
        
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-git-describe');
        
    grunt.registerTask('default', ['concat:prod']);
    grunt.registerTask('prod', ['git-describe:run', 'concat:prod', 'uglify']);
};
