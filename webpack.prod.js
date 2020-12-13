const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

module.exports = merge(common, {
    mode: 'production',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'static/frontend'),
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    }
});