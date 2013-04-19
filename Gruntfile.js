module.exports = function(grunt) {

    grunt.initConfig({
        
        pkg: grunt.file.readJSON('package.json'),
                
        uglify: {
            options: {
                banner: "/**\n * https://github.com/artch/angular-route-segment\n * @author Artem Chivchalov\n * @license MIT License http://opensource.org/licenses/MIT\n */\n"
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
        }
        
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');  
        
    grunt.registerTask('default', ['concat:prod', 'uglify']);
};
