const path = require('path');
const util = require('util');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebPackDeployAfterBuild = require('webpack-deploy-after-build');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const xConfig = require('x-config-deploy').getConfig();
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');
const webpackConfig = require('@x-scaffold/webpack-config');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const QiniuPlugin = require('qiniu-webpack-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const IP = require('ip').address();
const FileManagerPlugin = require('filemanager-webpack-plugin');
const pkg = require('./package.json');
const PORT = 8080;
const PROJECT_NANE = getProjectName();

function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

function getProjectName() {
  return pkg.name;
}

const qiniuPluginAssets = new QiniuPlugin({
  ACCESS_KEY: xConfig.qiniuConfig.accessKey,
  SECRET_KEY: xConfig.qiniuConfig.secretKey,
  bucket: 'deploy',
  path: '',
  // include 可选项。你可以选择上传的文件，比如['main.js']``或者[/main/]`
  // path: '[hash]'
});

module.exports = {
  entry: {
    app: './src/main.js',
  },
  output: {
    hashDigestLength: 8,
    path: path.resolve(__dirname, './dist/'),
    filename: `${PROJECT_NANE}/[name].[hash].js`,
    chunkFilename: `${PROJECT_NANE}/[name].[hash].js`,
    publicPath: process.env.NODE_ENV === 'production'
      ? '//p1.cosmeapp.com/'
      : `//${IP}:${PORT}/`,
  },
  module: {
    rules: webpackConfig.styleLoaders({
      sourceMap: false,
      extract: process.env.NODE_ENV === 'production' }).concat([
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [path.resolve('src')],
        exclude: /node_modules/,
        options: {
          formatter: require('eslint-friendly-formatter'),
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: webpackConfig.loaders,
          // other vue-loader options go here
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif|svg|jpeg)$/,
        loader: 'file-loader',
        options: {
          name: `${PROJECT_NANE}/[name][hash].[ext]`,
        },
      },
    ]),
  },
  resolve: {
    modules: [
      path.resolve('src'),
      path.resolve('node_modules'),
    ],
    extensions: ['.js', '.vue', '.json'],
    // root: path.resolve('src'),
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      src: resolve('src'),
      views: resolve('src/views'),
      components: resolve('src/components'),
      assets: resolve('src/assets'),
    },
  },
  devServer: {
    host: IP,
    hot: false,
    open: true,
    // https: true,
    historyApiFallback: true,
    noInfo: true,
  },
  performance: {
    hints: false,
  },
  // devtool: '#eval-source-map',
  plugins: [
    new StyleLintPlugin({
      failOnError: false,
      files: ['**/*.s?(a|c)ss', 'src/**/**/*.vue', 'src/***/*.css'],
      // files: '../static/.css'
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'template.html',
      chunks: ['app'],
      showErrors: true,
      hash: false,
      inject: true,
      chunksSortMode: 'dependency',
    }),
    // new WebPackDeployAfterBuild({
    //   from: path.resolve(__dirname, 'index.html'),
    //   to: path.join(xConfig.cndAssets, 'mapp/clock/'),
    // }),
  ],
};

if (process.env.NODE_ENV === 'development') {
  module.exports = Object.assign(module.exports, {
    devtool: '#eval-source-map',
  });
}

if (process.env.NODE_ENV === 'production') {
  // @todo 优化
  const cdnDeployShell = util.format('ls && cd ' + path.join(xConfig.cndAssets, './') + ' && git add -A && git commit -m \'%s 自动更细\' && git pull origin master && git push origin master && npm run sync', PROJECT_NANE);

  // module.exports.devtool = '#source-map';
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    qiniuPluginAssets,
    // http://mobilesite.github.io/2017/02/18/all-the-errors-encountered-in-webpack/
    // https://segmentfault.com/q/1010000008716379
    new ExtractTextPlugin({
      disable: false,
      filename: path.posix.join('dist', 'css/[name].[hash].css'),
    }),
    // @todo
    // https://github.com/webpack-contrib/copy-webpack-plugin/issues/15
    // new WebPackDeployAfterBuild({
    //   from: path.resolve(__dirname, './dist/'),
    //   to: path.join(xConfig.cndAssets, 'mapp/' + PROJECT_NANE),
    // }),
    new FileManagerPlugin({
      onEnd: {
        copy: [
          // { source: '/path/from', destination: '/path/to' },
          {
            source: path.resolve(__dirname, './dist/index.html'),
            destination: path.join(xConfig.cndAssets, 'mapp/' + PROJECT_NANE, 'index.html')
          },
        ],
        // move: [
        //   { source: '/path/from', destination: '/path/to' },
        //   { source: '/path/fromfile.txt', destination: '/path/tofile.txt' }
        // ],
        // delete: [
        //  '/path/to/file.txt',
        //  '/path/to/directory/'
        // ]
      },
    }),
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp('\\.(' + ['js', 'css'].join('|') + ')$'),
      threshold: 10240,
      minRatio: 0.8,
    }),
    new WebpackShellPlugin({
      onBuildStart: ['echo WebpackShellPlugin Start'],
      onBuildEnd: [],
      onBuildExit: [
        cdnDeployShell
      ],
      safe: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: false,
      compress: {
        warnings: false,
      },
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
  ]);
}
