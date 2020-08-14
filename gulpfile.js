const {src, dest, series, parallel, watch, lastRun} = require('gulp'),
 plugins = require("gulp-load-plugins")(),
 del = require('del'),
 pngquant = require('imagemin-pngquant'),
 browserSync = require('browser-sync'),
 paths = {
   css: {
     src: 'src/skin/css/**',
     dev: 'dev/skin/css/',
     build: 'build/skin/css/'
   },
   js: {
     src: 'src/skin/js/**',
     dev: 'dev/skin/js/',
     build: 'build/skin/js/'
   },
   img: {
     src: 'src/skin/images/**',
     dev: 'dev/skin/images/',
     build: 'build/skin/images/'
   },
   page: {
     src: 'src/*.html',
     src2: 'src/**/*.html',
     dev: 'dev/',
     build: 'build/'
   },
   copy: {
     src: 'src/skin/**',
     dev: 'dev/skin/',
     build: 'build/skin/'
   }
 };

// 删除生成 build dev
function clean(cb) {
  del(['dev/**', 'build/**']);
  cb()
}
function cleanPic(cb) {
  del(paths.img.build);
  cb()
}

//复制其它资源
function copy(cb) {
  src([paths.copy.src, '!src/skin/css/**', '!src/skin/js/**'])
   .pipe(dest(paths.copy.dev))
   .pipe(dest(paths.copy.build))
  cb()
}

// 编译 less 处理 css
function style(cb) {
  src(paths.css.src, {since: lastRun(style)})
   .pipe(plugins.less())
   .pipe(plugins.autoprefixer())
   .pipe(dest(paths.css.dev))
   .pipe(dest(paths.css.build));
  cb()
}

// 压缩代码
function mincss(cb) {
  src(paths.css.src)
   .pipe(plugins.less())
   .pipe(plugins.autoprefixer())
   .pipe(plugins.order([
     'base-style.css',
     'common.css',
     'css.css',
     '*.css'
   ])) // 指定次序合并
   .pipe(plugins.concat('main.css'))
   .pipe(plugins.cleanCss({
     keepSpecialComments: '*', //保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
     compatibility: 'ie8',    //保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
     keepBreaks: true,       //类型：Boolean 默认：false [是否保留换行]
     advanced: false       //类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
   }))
   .pipe(plugins.rename({
     prefix: "index-",       // 文件头部名称
     basename: "all-style",  // 文件中部名称
     suffix: ".min",         // 文件尾部名称
     extname: ".css"         // 文件扩展名
   }))
   .pipe(dest(paths.css.build));
  cb();
}

//编译 ES6
function script(cb) {
  src(paths.js.src, {sourcemaps: true}, {allowEmpty: true},{since: lastRun(script)})
   .pipe(plugins.babel({
     presets: ['@babel/preset-env']
   }))
   .pipe(dest(paths.js.dev))
  cb();
}

//压缩 js
function minjs(cb) {
  const min = plugins.filter([paths.js.src, '!src/skin/js/*.min.js', '!src/skin/js/layer/**/*.*'], {restore: true});
  src(paths.js.src, {sourcemaps: true}, {allowEmpty: true})
   .pipe(min)
   .pipe(dest(paths.js.dev))
   .pipe(plugins.babel({
     presets: ['@babel/preset-env']
   }))
   .pipe(plugins.order([
     'base.js',
     'app.js',
     '*.js',
     'a.js'
   ]))
   .pipe(plugins.concat('all.js'))
   .pipe(plugins.uglify())
   .pipe(plugins.rename({extname: '.min.js'}))
   .pipe(min.restore)
   .pipe(dest(paths.js.build, {sourcemaps: '.'}));
  cb();
}

// 压缩 image
function pic(cb) {
  src(paths.img.src, {allowEmpty: true}, {since: lastRun(pic)})
   .pipe(plugins.cache(plugins.imagemin({
     interlaced: true,
     progressive: true,
     svgoPlugins: [{removeViewBox: false}],
     use: [pngquant()]
   })))
   .pipe(dest(paths.img.build));
  cb()
}

// html
function file(cb) {
  src(paths.page.src, {since: lastRun(file)})
   .pipe(plugins.fileInclude({
     prefix: '@@',
     basepath: '@file'
   }))
   .pipe(dest(paths.page.dev))
   .pipe(dest(paths.page.build));
  cb();
}
//watch
function change() {
  watch(paths.css.src, {delay: 500}, style);
  watch(paths.js.src, {delay: 500}, script);
  watch(paths.page.src2, {delay: 500}, file);
  watch(paths.copy.src,copy);
}
//server
function dev(cb) {
  browserSync({
    files: "./",
    server: {
      baseDir: paths.page.dev
    },
    logLevel: "info", //info 只是显示基本信息  debug 显示了我对过程的其他信息
    logPrefix: "My Project", //改变控制台日志前缀
    logConnections: true, //记录连接
    notify: false, //不显示在浏览器中的任何通知
    online: true,// //不会尝试确定你的网络状况，假设你在线。
  });
  cb()
}

//生产
function online(cb) {
  browserSync({
    files: "./",
    server: {
      baseDir: paths.page.build
    },
    logLevel: "info", //info 只是显示基本信息  debug 显示了我对过程的其他信息
    logPrefix: "My Project", //改变控制台日志前缀
    logConnections: true, //记录连接
    notify: false, //不显示在浏览器中的任何通知
    online: true,// //不会尝试确定你的网络状况，假设你在线。
  });
  cb()
}

exports.clean = clean;
exports.copy = copy;
exports.style = style;
exports.mincss = mincss;
exports.script = script;
exports.minjs = minjs;
exports.pic = pic;
exports.file = file;
exports.dev = dev;
exports.online = online;
exports.change = change;
exports.default = series(parallel(copy, style, script, file), series(dev, change));
exports.build = parallel(series(cleanPic,pic),copy, style, script, file,series(online, change));
