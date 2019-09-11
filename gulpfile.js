const { series, parallel, src, dest, watch } = require('gulp'),
      plumber = require('gulp-plumber'),           // gulp: ловец ошибок в watch
      rename = require('gulp-rename'),             // gulp: переименование в Gulp
      rm = require('gulp-rm'),                     // gulp: удаление в Gulp
      htmlmin = require('gulp-htmlmin'),           // html: минификатор html
      minify = require('gulp-csso'),               // css: минимизатор CSS
      imagemin = require('gulp-imagemin'),         // img: оптимизатор изображений
      terser = require('gulp-terser'),             // js: JS-минификатор
      server = require('browser-sync').create();   // сервер разработки

// Запуск самопегегружающегося сервера
exports.default = series(startServer, goWatch);

// Локальная сборка
exports.html = buildHTML;
exports.css = buildCSS;
exports.js = buildJS;
exports.img = buildIMG;

// Полная пересборка
exports.rebuild = series(
                    clearDocs,
                    parallel( buildHTML, buildCSS, buildJS, buildIMG ),
                    startServer, goWatch
                  );


// Обновлять сервер по изменениям файлов
function goWatch() {
  // ... подписаться на файлы
  const watcherHTML = watch(['source/**/*.html']),
        watcherCSS = watch(['source/css/**/*.css']),
        watcherJS = watch(['source/js/**/*.js']),
        watcherIMG = watch(['source/img/**/*.{png,jpg,jpeg,svg}']);
  // ... обработать при изменениях
  watcherHTML.on('all', series(buildHTML, serverReload));
  watcherCSS.on('all', series(buildCSS, serverReload));
  watcherJS.on('all', series(buildJS, serverReload));
  watcherIMG.on('all', parallel(buildIMG, serverReload));
};


// HTML в docs
function buildHTML() {
  return src('source/*.html')
    .pipe(plumber())
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(dest('docs'));
};

// CSS в docs
function buildCSS() {
  return src('source/css/**/*.css')
    .pipe(plumber())
    .pipe(minify())
    .pipe(dest('docs/css'));
};

// JS в docs
function buildJS() {
  return src('source/js/**/*.js')
    .pipe(plumber())
    .pipe(terser({
      keep_fnames: true,
      mangle: false
    }))
    .pipe(dest('docs/js'));
};

// Изображения в docs
function buildIMG() {
  return src(['source/img/**/*.{png,jpg,jpeg,svg}'])
    .pipe(imagemin([
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.svgo()
    ]))
    .pipe(dest('docs/img'));
};

// Очистка docs
function clearDocs() {
  return src('docs/**/*', {read: false})
    .pipe(rm());
};

// Запуск сервера BrowserSync
function startServer(cb) {
  server.init({
    server: {
      baseDir: './docs/'
    },
    notify: false
  });
  cb();
};

// Обновление сервера BrowserSync
function serverReload() {
  return server.reload();
};