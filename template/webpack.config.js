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
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const QiniuPlugin = require('qiniu-webpack-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const IP = require('ip').address();
const FileManagerPlugin = require('filemanager-webpack-plugin');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const pkg = require('./package.json');
const PORT = 8080;
const PROJECT_NANE = getProjectName();
const portFinderSync = require('portfinder-sync');
const port = portFinderSync.getPort(PORT);

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
  include: [new RegExp(pkg.name + '/')],
  // include 可选项。你可以选择上传的文件，比如['main.js']``或者[/main/]`
});

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * Released under the ${pkg.license} License.
 */`;

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
      : `//${IP}:${port}/`,
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
    },
  },
  devServer: {
    host: IP,
    hot: false,
    open: true,
    port,
    progress: true,
    inline: true,
    // https: true,
    historyApiFallback: true,
    noInfo: true,
  },
  performance: {
    hints: false,
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.NamedChunksPlugin(),
    new webpack.BannerPlugin({
      banner: banner,
      raw: true,
    }),
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
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    qiniuPluginAssets,
    new OptimizeCSSPlugin(),
    // http://mobilesite.github.io/2017/02/18/all-the-errors-encountered-in-webpack/
    // https://segmentfault.com/q/1010000008716379
    new ExtractTextPlugin({
      disable: false,
      filename: `${PROJECT_NANE}/[name].[hash].css`,
      // path.posix.join('dist', '[name]/css.[hash].css'),
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"' + process.env.NODE_ENV + '"',
      },
    }),
    // @todo
    // https://github.com/webpack-contrib/copy-webpack-plugin/issues/15
    // new WebPackDeployAfterBuild({
    //   from: path.resolve(__dirname, './dist/'),
    //   to: path.join(xConfig.cndAssets, 'mapp/' + PROJECT_NANE),
    // }),
    // new FileManagerPlugin({
    //   onEnd: {
    //     copy: [
    //       {
    //         source: path.resolve(__dirname, './dist/index.html'),
    //         destination: path.join(xConfig.cndAssets, 'mapp/' + PROJECT_NANE, 'index.html')
    //       },
    //     ],
    //   },
    // }),
    // new WebpackShellPlugin({
    //   onBuildStart: ['echo WebpackShellPlugin Start'],
    //   onBuildEnd: [],
    //   onBuildExit: [
    //     cdnDeployShell
    //   ],
    //   safe: true,
    // }),
    new WebpackAssetsManifest({
      output: path.join(__dirname, 'dist/manifest.json'),
      publicPath: 'https://p1.cosmeapp.com/',
    }),
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp('\\.(' + ['js', 'css'].join('|') + ')$'),
      threshold: 10240,
      minRatio: 0.8,
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
