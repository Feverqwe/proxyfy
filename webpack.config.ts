/* eslint-disable import/no-extraneous-dependencies */
import {DefinePlugin} from 'webpack';
import * as path from 'path';
// @ts-ignore
import CopyPlugin from 'copy-webpack-plugin';
// @ts-ignore
import HtmlPlugin from 'html-webpack-plugin';
import {CallableOption} from 'webpack-cli/lib/types';

const outputPath = path.resolve('./dist/chrome/');

const getOptions: CallableOption = (env, argv) => ({
  entry: {
    pacScript: './src/pacScript',
    background: './src/background',
    popup: './src/Popup',
    options: './src/Options',
  },
  output: {
    path: outputPath,
    filename: '[name].js',
  },
  devtool: argv.mode === 'production' ? false : 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.[jt]sx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{from: './src/assets/manifest.json'}, {from: './src/assets/icons', to: './icons'}],
    }),
    new HtmlPlugin({
      filename: 'popup.html',
      template: './src/assets/popup.html',
      chunks: ['popup'],
    }),
    new HtmlPlugin({
      filename: 'options.html',
      template: './src/assets/options.html',
      chunks: ['options'],
    }),
    new DefinePlugin({
      'process.env': {
        DEBUG: JSON.stringify('*'),
      },
    }),
  ],
});

export default getOptions;
