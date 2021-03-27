const {DefinePlugin} = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const isProduction = process.argv[process.argv.indexOf('--mode') + 1] !== 'development';

const outputPath = path.resolve('./dist/chrome/');

const config = {
  entry: {
    pacScript: './src/pacScript',
    background: './src/background',
    popup: './src/popup',
    options: './src/options'
  },
  output: {
    path: outputPath,
    filename: '[name].js'
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(woff|woff2)$/,
        use: ['file-loader']
      },
      {
        test: /\.[jt]sx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 8192
          }
        }]
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {from: './src/assets/manifest.json',},
        {from: './src/assets/icons', to: './icons'},
      ],
    }),
    new HtmlWebpackPlugin({
      filename: 'popup.html',
      template: './src/assets/popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      template: './src/assets/options.html',
      chunks: ['options']
    }),
    new DefinePlugin({
      'process.env': {
        'DEBUG': JSON.stringify('*')
      }
    }),
  ]
};

module.exports = config;
