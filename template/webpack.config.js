var path = require('path')
var webpack = require('webpack')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var WebPackDeployAfterBuild = require('webpack-deploy-after-build')
const ExtractTextPlugin = require('extract-text-webpack-plugin');
var xConfig = require('x-config-deploy').getConfig()
var HtmlWebpackPlugin = require('html-webpack-plugin')
var ip = require('ip').address()
const WebpackShellPlugin = require('webpack-shell-plugin')
const webpackConfig = require('@x-scaffold/webpack-config')
var pkg = require('./package.json');

function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

module.exports = {
  entry: {
    app: './src/main.js',
  },
  output: {
    path: path.resolve(__dirname, './dist/'),
    filename: 'assets/[name].js',
  },
  module: {
    rules: webpackConfig.styleLoaders({sourceMap: false, extract: false,}).concat([
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [path.resolve('src')],
        exclude: /node_modules/,
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: webpackConfig.loaders
          // other vue-loader options go here
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: 'assets/[name].[ext]?[hash]'
        }
      }
    ])
  },
  resolve: {
    modules: [
      path.resolve('src'),
      path.resolve('node_modules')
    ],
    extensions: ['.js', '.vue', '.json'],
    // root: path.resolve('src'),
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      src: resolve('src'),
      views: resolve('src/views'),
      components: resolve('src/components'),
      assets: resolve('src/assets'),
    }
  },
  devServer: {
    host: ip,
    // https: true,
    historyApiFallback: true,
    noInfo: true
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map',
  plugins: [
    // http://mobilesite.github.io/2017/02/18/all-the-errors-encountered-in-webpack/
    // https://segmentfault.com/q/1010000008716379
    new ExtractTextPlugin({
      disable: true,
      filename: path.posix.join('static', 'css/[name].[hash].css')
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'template.html',
      chunks: ['app'],
      showErrors: true,
      hash: true,
      inject: true,
      chunksSortMode: 'dependency'
    }),

    // new WebPackDeployAfterBuild({
    //     from: path.resolve(__dirname, 'index.html'),
    //     to: path.join(xConfig.cndAssets, 'mapp/clock/'),
    // }),
  ],
}

if (process.env.NODE_ENV === 'production') {
  // @todo 优化
  const cdnDeployShell = 'ls && cd ' + path.join(xConfig.cndAssets, './') + ' && git add -A && git commit -m \'自动更细\' && git pull origin master && git push origin master && npm run sync'

  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new WebPackDeployAfterBuild({
        from: path.resolve(__dirname, './dist'),
        to: path.join(xConfig.cndAssets, 'mapp/' + pkg.name),
    }),
    new WebpackShellPlugin({
        onBuildStart: ['echo "Webpack Start"'],
        onBuildEnd: [],
        onBuildExit:[
          cdnDeployShell
        ],
        safe: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
