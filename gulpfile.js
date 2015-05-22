var gulp = require('gulp');
var run = require('gulp-run');

gulp.task('webpack', function () {
  run('node_modules/webpack/bin/webpack.js').exec();
})

gulp.task('watch', function() {
  gulp.watch('src/**/*.*', ['webpack']);
});
