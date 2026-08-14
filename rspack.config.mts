import * as path from 'path';

import {DefinePlugin, rspack} from '@rspack/core';

const outputPath = path.resolve('./dist/chrome/');

interface RspackCliArguments {
  mode?: string;
}

const getOptions = (_env: unknown, argv: RspackCliArguments) => ({
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
        use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
      },
      {
        test: /\.[jt]sx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
  },
  plugins: [
    new rspack.CssExtractRspackPlugin({
      filename: '[name].css',
    }),
    new rspack.CopyRspackPlugin({
      patterns: [{from: './src/assets/manifest.json'}, {from: './src/assets/icons', to: './icons'}],
    }),
    new rspack.HtmlRspackPlugin({
      filename: 'popup.html',
      template: './src/assets/popup.html',
      chunks: ['popup'],
    }),
    new rspack.HtmlRspackPlugin({
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
