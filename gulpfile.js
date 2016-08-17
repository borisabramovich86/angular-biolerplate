'use strict';

var os = require('os');
var gulp = require('gulp');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var minifyCss = require('gulp-minify-css');
var templateCache = require('gulp-angular-templatecache');
var ngAnnotate = require('gulp-ng-annotate');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
//var gls = require('gulp-live-server');
var connect = require('gulp-connect')
var open = require('gulp-open');
var Server = require('karma').Server;
var less = require('gulp-less');

var paths = {
    app_src_scripts: [
        'app/**/*.js',
        'build/tmp/*.js'
    ],
    app_src_styles: 'app/**/styles/*.less',
    app_src_images: 'app/**/img/*',
    app_src_html_templates: [
        'app/views/**/*.+(htm|html)',
        'app/modules/component/views/**/*.+(htm|html)',
    ],
    build_root_dir: 'build',
    build_scripts_dir: 'build/js'
};

var build_time = new Date().getTime();

// Not all tasks need to use streams
// A gulpfile is just another node program and you can use any package available on npm
gulp.task('clean', function () {
    return gulp.src(paths.build_root_dir)
        .pipe(clean({read: false, force: true}));
});

gulp.task('angular_cache_build', function () {
    return gulp.src(paths.app_src_html_templates)
        .pipe(templateCache({
            module: 'mainApp'
        }))
        .pipe(gulp.dest('build/tmp'));
});

// Concatenate JS Files
gulp.task('scripts_build', ['angular_cache_build'], function () {
    return gulp.src(paths.app_src_scripts)
        .pipe(sourcemaps.init())
        .pipe(concat('app.min.js'))
        //.pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.build_scripts_dir));
});

// Concatenate CSS Files
gulp.task('less', function () {
    return gulp.src(paths.app_src_styles)
        .pipe(less())
        .pipe(gulp.dest('build/tmp'));

});

gulp.task('css_build', ['less'], function () {

    gulp.src('app/modules/font-resources/sinkin-sans/fonts/*.*')
        .pipe(gulp.dest('build/css/fonts'));

    gulp.src('app/modules/cm-images-sprite/images/*.*')
        .pipe(gulp.dest('build/images'));


    return gulp.src([
            'app/modules/font-resources/sinkin-sans/sinkin-sans.css',
            'build/tmp/**/*.css'
        ])
        .pipe(sourcemaps.init())
        .pipe(concat('app.min.css'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/css'));

});

// Concatenate JS Files
gulp.task('html', function () {
    return gulp.src('app/*.htm')
        .pipe(gulp.dest('build'));
});


gulp.task('lib', function () {
    var lib = require('bower-files')({
        overrides: {
            bootstrap: {
                main: [
                    'dist/js/bootstrap.js',
                    'dist/css/bootstrap.css',
                    'dist/fonts/*.*'
                ]
            },
            'angularjs-dropdown-multiselect': {
                main: [
                    'src/angularjs-dropdown-multiselect.js'
                ]
            },
            'jquery-ui': {
                main: [
                    'jquery-ui.js',
                    'themes/smoothness/jquery-ui.css',
                    'themes/smoothness/images/*.*'
                ]
            }
        }
    });

    gulp.src(lib.ext('js').match('!**/index.js').files)
        .pipe(sourcemaps.init())
        .pipe(concat('lib.min.js'))
        //.pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/js'));

    gulp.src(lib.ext(['css']).files)
        .pipe(sourcemaps.init())
        .pipe(concat('lib.min.css'))
        .pipe(minifyCss())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/css'));

    gulp.src(lib.ext(['otf', 'eot', 'woff', 'woff2', 'ttf', 'svg']).files)
        .pipe(gulp.dest('build/fonts'));

    //gulp.src(lib.ext(['ico', 'png', 'psd']).files)
    //    .pipe(gulp.dest('build/images'));
    //
    gulp.src(lib.match('*/datatables/**').ext(['ico', 'png', 'psd']).files)
        .pipe(gulp.dest('build/images'));

    return gulp.src(lib.match('*/jquery-ui/**').ext(['gif', 'png']).files)
        .pipe(gulp.dest('build/css/images'));
});

gulp.task('serve', ['watch'], function () {

    //1. serve with default settings
    //var server = gls.static(); //equals to gls.static('public', 3000);
    //server.start();

    //2. serve at custom port
    //var server = gls.static(['build'], 3000);
    //var server = gls.new('./node_server/server.js');
    //server.start();

    connect.server({
        root: 'build/',
        port: 3000,
        livereload: true,
        fallback: 'build/index.htm'
    })


    //use gulp.watch to trigger server actions(notify, start or stop)
    // gulp.watch(['build/**/*.css', 'build/**/*.htm', 'build/**/*.js'], function (file) {
    //     server.notify.apply(server, [file]);
    // });
});

gulp.task("open", function () {
    var browser = os.platform() === 'linux' ? 'google-chrome' : (
        os.platform() === 'darwin' ? 'google chrome' : (
            os.platform() === 'win32' ? 'chrome' : 'firefox'));

    var options = {
        uri: 'http://localhost:9000/index.htm',
        app: browser
    };
    gulp.src('')
        .pipe(open(options));
});

gulp.task('watch', ['build'], function () {
    gulp.watch('app/**/*.js', ['scripts_build', 'index_htm_replace']);
    gulp.watch(paths.app_src_html_templates, ['scripts_build']);
    gulp.watch([paths.app_src_styles, 'app/modules/**/*.css'], ['css_build', 'index_htm_replace']);
    gulp.watch('app/**/*.htm', ['index_htm_replace']);
});

gulp.task('test', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']

    }, done).start();
});

gulp.task('index_htm_replace',['html'], function () {
    return gulp.src(['build/index.htm'])
        .pipe(replace(/XXXXXXXX/g, build_time))
        .pipe(gulp.dest('build'));
});

gulp.task('build', ['scripts_build', 'lib', 'css_build', 'index_htm_replace'], function () {
    return gulp.src('build/tmp')
        .pipe(clean({read: false, force: true}));
});

gulp.task('dev', ['serve', 'watch']);

// The default task (called when you run `gulp` from cli)
//gulp.task('default', ['build',]);