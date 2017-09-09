const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    bg: './src/js/bg.js',
    popup: './src/js/popup.js',
    options: './src/js/options.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js'
  },
  plugins: [
    new UglifyJSPlugin({
      uglifyOptions: {
        ie8: false,
        ecma: 5,
        mangle: false,
        output: {
          comments: false,
          beautify: true
        }
      }
    }),
    new CopyWebpackPlugin([
      {
        from: 'src/css',
        to: 'css'
      },
      {
        from: 'src/img',
        to: 'img'
      },
      {
        from: 'src/manifest.json'
      },
      {
        from: 'src/options.html'
      },
      {
        from: 'src/popup.html'
      }
    ])
  ]
};