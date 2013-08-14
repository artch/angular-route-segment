module.exports = function(grunt) {

    grunt.initConfig({
        
        pkg: grunt.file.readJSON('package.json'),
                
        uglify: {
            options: {
                banner: "/**\n * angular-route-segment <%=grunt.config('gitdescribe')[1]%>\n * https://github.com/artch/angular-route-segment\n * @author Artem Chivchalov\n * @license MIT License http://opensource.org/licenses/MIT\n */\n"
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
                banner: "/**\n * angular-route-segment <%=grunt.config('gitdescribe')[1]%>\n * https://github.com/artch/angular-route-segment\n * @author Artem Chivchalov\n * @license MIT License http://opensource.org/licenses/MIT\n */\n"
            },
            prod: {
                src: ['src/**/*.js'],
                dest: 'build/angular-route-segment.js'
            }
        },        
        
        karma: {
            once: {
                options: {
                    keepalive: true,
                    configFile: 'karma.conf.js',
                    autoWatch: false,
                    singleRun: true
                }                
            },
            keep: {
                options: {
                    keepalive: true,
                    configFile: 'karma.conf.js',
                    autoWatch: true,
                    singleRun: false
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
        
    grunt.registerTask('default', ['git-describe:run', 'concat:prod', 'uglify']);
};
