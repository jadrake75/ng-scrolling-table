module.exports = function(config) {
    config.set({
        basePath: '../',
        files: [
            'lib/bower_components/jquery/jquery.js',
            'lib/bower_components/angular/angular.js',
            'lib/bower_components/angular-route/angular-route.js',
            'lib/bower_components/angular-mocks/angular-mocks.js',
            'src/util/*.js', // need to guarantee loaded before other files
            'src/**/*.js',
            'test/unit/**/*.js'
        ],
        autoWatch: true,
        frameworks: ['jasmine'],
        reporters: ['progress', 'growl'],
        browsers: ['Chrome'],
        plugins: [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-growl-reporter'
        ],
        junitReporter: {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }

    });
};
