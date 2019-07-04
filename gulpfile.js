const { series, parallel, src, dest, watch } = require('gulp'),
      server = require('browser-sync').create();

// Команда для работы с живым сервером
exports.go = series(startServer, goWatch);
exports.default = series(startServer, goWatch);


// Обновлять сервер по изменениям скриптов и html
function goWatch() {
  // ... подписаться на файлы
  const watcherHTML = watch(['**/*.html']),
        watcherCSS = watch(['css/**/*.css']),
        watcherJS = watch(['js/**/*.js']);
  // ... и запустить обработку по событиям файловой системы
  watcherHTML.on('all', serverReload);
  watcherCSS.on('all', serverReload);
  watcherJS.on('all', serverReload);
};

// Запуск сервера BrowserSync
function startServer(cb) {
  server.init({
    server: {
      baseDir: './'
    },
    notify: false
  });
  cb();
};

// Обновление сервера BrowserSync
function serverReload() {
  return server.reload();
};