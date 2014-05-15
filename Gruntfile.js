module.exports = function (grunt) {
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        distdir: 'dist',
        
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
                    sourceMap: true,
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
                    'src/**/*.js'
                ],
                dest: '<%= distdir %>/ng-scrolling-table.js'
            }
        },
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    
    
    grunt.registerTask('dev', ['concat:dev','less:dev']);
    grunt.registerTask('production', ['concat:dev', 'less:production']);
};