
const ProgressPlugin = require('webpack/lib/ProgressPlugin');

const {NoEmitOnErrorsPlugin} = require('webpack');
const {AngularCompilerPlugin} = require('@ngtools/webpack');

module.exports = {
  mode: 'production',
  devtool: 'none',
  resolve: {
    extensions: [
      '.ts',
      '.js'
    ],
    modules: [
      './node_modules'
    ]
  },
  resolveLoader: {
    modules: [
      './node_modules'
    ]
  },
  entry: {
    './src/assets/workers/main': [
      './src/web-worker/main.worker.ts'
    ]
  },
  output: {
    path: process.cwd(),
    filename: '[name].js'
  },
  watch: false,
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
        exclude: [
          /\/node_modules\//
        ]
      },
      {
        test: /\.ts$/,
        loader: '@ngtools/webpack'
      }
    ]
  },
  plugins: [
    new NoEmitOnErrorsPlugin(),
    new ProgressPlugin(),
    new AngularCompilerPlugin({
      tsConfigPath: './src/tsconfig.worker.json',
      entryModule: './src/web-worker/main.worker.ts'
    })
  ]
}