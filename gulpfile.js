var gulp = require('gulp');

gulp.task('build', function () {
	gulp.src('./node_modules/phaser-shim/dist/**/*')
		.pipe(gulp.dest('./dist'));
	gulp.src('./node_modules/phaser-arcade-slopes/dist/**/*')
		.pipe(gulp.dest('./dist'));
});