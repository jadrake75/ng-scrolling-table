module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        distdir: 'dist',

        ngAnnotate: {
            dist: {
                src: ['<%= distdir %>/<%= pkg.name %>.js'],
            }
        },
        less: {
            dev: {
                options: {
                    paths: ['src/less'],
                    cleancss: false,
                    report: 'min',
                    sourceMap: false,
                    compress: false
                },
                files: {
                    '<%= distdir %>/ng-scrolling-table.css': 'src/less/scrolling-table.less'
                }
            },
            production: {
                options: {
                    paths: ['src/less'],
                    cleancss: true,
                    compress: true,
                    sourceMap: false,
                    report: 'gzip'
                },
                files: {
                    '<%= distdir %>/ng-scrolling-table.min.css': 'src/less/scrolling-table.less'
                }
            }
        },
        concat: {
            options: {
                separator: '\n//End of file\n'
            },
            dev: {
                src: [
                    'src/util/**/*.js',
                    'src/controller/**/*.js',
                    'src/directives/**/*.js'
                ],
                dest: '<%= distdir %>/ng-scrolling-table.js'
            }
        },
        uglify: {
            production: {
                files: {
                    '<%= distdir %>/ng-scrolling-table.min.js': ['<%= distdir %>/ng-scrolling-table.js']
                }
            }
        },
        copy: {
            lesselements: {
                files: [
                    {
                        src: ['node_modules/grunt-contrib-lesselements/elements.less'],
                        dest: 'src/less/elements.less'
                    }
                ]
            },
            resources: {
                files: [
                    {
                        cwd: 'src/resources',
                        src: ['**'],
                        dest: 'dist/resources',
                        expand: true
                    }
                ]
            }
        },
        watch: {
            scripts: {
                files: ['src/**/*.js', 'src/less/*.less'],
                tasks: ['dev'],
                options: {
                    nospawn: true
                }
            }
        },
        clean: ["<%= distdir %>"]
    });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.registerTask('dev', ['concat:dev', 'copy', 'less:dev']);
    grunt.registerTask('production', ['dev', 'ngAnnotate:dist', 'uglify:production', 'less:production']);
};
