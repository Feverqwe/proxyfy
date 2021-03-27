const {DefinePlugin} = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const isProduction = process.argv[process.argv.indexOf('--mode') + 1] !== 'development';

const outputPath = path.resolve('./dist/');

const config = {
  entry: {
    pacScript: './src/pacScript',
    bg: './src/bg',
    // popup: './src/popup',
    // options: './src/options'
  },
  output: {
    path: outputPath,
    filename: 'js/[name].js'
  },
  devtool: 'source-map',
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: "commons",
          chunks: chunk => ['bg', 'popup', 'options'].indexOf(chunk.name) !== -1,
          minChunks: 3,
          priority: -10
        },
        commonsRender: {
          name: "commonsRender",
          chunks: chunk => ['popup', 'options'].indexOf(chunk.name) !== -1,
          minChunks: 2,
          priority: -20
        },
      }
    }
  },
  module: {
    rules: [
      {
        test: /.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ["@babel/plugin-proposal-decorators", { "legacy": true }],
            ],
            presets: [
              '@babel/preset-react',
              ['@babel/preset-env', env]
            ]
          }
        }
      },
      {
        test: /\.(css|less)$/,
        use: [{
          loader: "style-loader"
        }, {
          loader: "css-loader"
        }, {
          loader: "clean-css-loader"
        }, {
          loader: "less-loader",
          options: {
            strictMath: true,
          }
        }]
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
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      {from: './src/manifest.json',},
      {from: './src/icons', to: './icons'},
    ]),
    new HtmlWebpackPlugin({
      filename: 'popup.html',
      template: './src/popup.html',
      chunks: ['commonsRender', 'commons', 'popup']
    }),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      template: './src/options.html',
      chunks: ['commonsRender', 'commons', 'options']
    }),
    new DefinePlugin({
      'process.env': {
        'DEBUG': JSON.stringify('*')
      }
    }),
  ]
};

module.exports = config;
