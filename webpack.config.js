const {DefinePlugin} = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');


const isWatch = process.argv.some(function (arg) {
  return arg === '--watch';
});

const outputPath = path.resolve('./dist/');

const env = {
  targets: {
    browsers: ['Chrome >= 36']
  }
};

if (isWatch) {
  env.targets.browsers = ['Chrome >= 65'];
}

const config = {
  entry: {
    pacScript: './src/js/pacScript',
    bg: './src/js/bg',
    popup: './src/js/popup',
    options: './src/js/options'
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
          loader: "less-loader"
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
    new CleanWebpackPlugin(outputPath),
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

if (!isWatch) {
  config.devtool = 'none';
  Object.keys(config.entry).forEach(entryName => {
    let value = config.entry[entryName];
    if (!Array.isArray(value)) {
      value = [value];
    }
    if (entryName === 'pacScript') {
      // value.unshift();
    } else
    if (entryName === 'bg') {
      value.unshift(
        'whatwg-fetch',
        'core-js/fn/map',
        'core-js/fn/object/assign',
      );
    } else {
      value.unshift(
        'babel-polyfill',
      );
    }

    config.entry[entryName] = value;
  });
}

module.exports = config;