/* eslint-disable no-undef */
'use strict'

const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'development',
  stats: 'errors-only',
  context: __dirname,
  entry: {
    duckhunt: './main.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    hashFunction: 'xxhash64'
  },
  experiments: {
    futureDefaults: true
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.png$/,
        type: 'asset/resource'
      },
      {
        test: /\.(mp3|ogg)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    fallback: {
      path: false
    },
    modules: ['node_modules'],
    extensions: ['.js', '.min.js']
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    client:{
      overlay:{
        warnings: false,
        errors: true
      }
    },
    port: 8080,
    open: true
  },
  cache: {
    type: 'filesystem'
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'machine-learning/yolov5n_web_model'),
          to: 'yolov5n_web_model' // this will be accessible at runtime
        }
      ]
    })
  ]
}
