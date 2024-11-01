const path = require('node:path')
const gulp = require('gulp')
const cheerio = require('gulp-cheerio')
const rename = require('gulp-rename')
const svgmin = require('gulp-svgmin')
const svgstore = require('gulp-svgstore')
const composer = require('gulp-uglify/composer')
const uglify_es = require('uglify-es')

const uglify = composer(uglify_es, console)
const babel = require('gulp-babel')
const concat = require('gulp-concat')
const remove_code = require('gulp-remove-code')
const replace = require('gulp-replace')

gulp.task('prepare-svg', () => {
  return gulp
    .src('src/svg/*/*.svg')
  // Minify SVG files
    .pipe(svgmin((file) => {
      const prefix = path.basename(file.relative, path.extname(file.relative))
      return {
        plugins: [
          {
            removeAttrs: {
              attrs: ['viewBox'],
            },
          },
          {
            mergePaths: true,
          },
          {
            cleanupIDs: {
              prefix,
              minify: true,
            },
          },
        ],
      }
    }))
  // Combine SVG files as symbols
    .pipe(svgstore({ inlineSvg: true }))
  // Remove unused tags
    .pipe(cheerio({
      run($, file) {
        $('[fill="#0f0"]').attr('fill', 'currentColor')
      },
      parserOptions: {
        xmlMode: true,
      },
    }))
    .pipe(rename('identicons.min.svg'))
    .pipe(gulp.dest('dist'))
})

gulp.task('prepare-identicons-js', () => {
  return gulp
    .src([
      'src/js/identicons.js',
      'src/js/hash.js',
      'src/js/color-names.js',
      'src/js/colors.js',
    ])
    .pipe(remove_code({ production: true }))
    .pipe(uglify({
      warnings: true,
      compress: {},
      mangle: true,
      output: {
        comments: /@asset/,
      },
    }))
    .pipe(concat('identicons.min.js'))
    .pipe(gulp.dest('dist'))
})

gulp.task('prepare-name-js', () => {
  return gulp
    .src([
      'src/js/name.js',
      'src/js/hash.js',
      'src/js/color-names.js',
      'src/js/colors.js',
      'src/js/word-catalog.js',
      'src/js/word-dimensions.js',
    ])
    .pipe(remove_code({ production: true }))
    .pipe(uglify({
      warnings: true,
      compress: {},
      mangle: true,
      output: {
        comments: /@asset/,
      },
    }))
    .pipe(concat('identicons-name.min.js'))
    .pipe(gulp.dest('dist'))
})

gulp.task('prepare-bundle', () => {
  return gulp.src(['src/js/svg.prefix.js', 'dist/identicons.min.svg'])
    .pipe(replace(/<symbol/g, '<S'))
    .pipe(replace(/symbol>/g, 'S>'))
    .pipe(replace(/<path/g, '<p'))
    .pipe(replace(/<circle/g, '<c'))
    .pipe(replace(/<ellipse/g, '<e'))
    .pipe(replace(/fill="#fff"/g, 'fW'))
    .pipe(replace(/fill="currentColor"/g, 'fC'))
    .pipe(replace(/fill="#010101"/g, 'fB'))
    .pipe(replace(/fill=/g, 'f='))
    .pipe(replace(/currentColor/g, 'CC'))
    .pipe(replace(/opacity=/g, 'o='))
    .pipe(replace(/id="bottom_/g, 'i="b'))
    .pipe(replace(/id="face_/g, 'i="f'))
    .pipe(replace(/id="side_/g, 'i="s'))
    .pipe(replace(/id="top_/g, 'i="t'))
    .pipe(replace(/transform="rotate/g, 't="r'))
    .pipe(replace(/transform="translate/g, 't="t'))
    .pipe(replace(/transform="matrix/g, 't="m'))
    .pipe(gulp.src([
      'src/js/svg.suffix.js',
      'dist/identicons.min.js',
    ], { passthrough: true }))
    .pipe(concat('identicons.bundle.min.js'))
    .pipe(gulp.dest('dist'))
})

gulp.task('commonjs-bundle', () => {
  return gulp
    .src('dist/identicons.bundle.min.js')
    .pipe(babel({
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    }))
  // .pipe(uglify())
    .pipe(rename('identicons.bundle.cjs.js'))
    .pipe(gulp.dest('dist'))
})

gulp.task('commonjs-name', () => {
  return gulp
    .src('dist/identicons-name.min.js')
    .pipe(babel({
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    }))
  // .pipe(uglify())
    .pipe(rename('identicons-name.cjs.js'))
    .pipe(gulp.dest('dist'))
})

gulp.task('default', gulp.series('prepare-svg', 'prepare-identicons-js', 'prepare-name-js', 'prepare-bundle', 'commonjs-bundle', 'commonjs-name'))
