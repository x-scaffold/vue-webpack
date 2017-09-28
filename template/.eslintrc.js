module.exports = {
  root: true,
  // parser: 'babel-eslint',
  // parserOptions: {
  //   sourceType: 'module'
  // },
  extends: 'style-guide',
  // extends: 'airbnb-base',
  // required to lint *.vue files
  plugins: [

  ],
  env: {
    browser: true,
    node: true,
  },
  globals: {

  },
  settings: {
    'import/resolver': {
      webpack: {
        config: 'webpack.config.js',
      },
    },
  },
  rules: {

  },
};
