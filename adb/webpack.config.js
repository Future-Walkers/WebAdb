/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 14:18:41
 * @last_author: Sphantix Hang
 * @last_edit_time: 2020-12-29 09:50:52
 * @file_path: /webadb/adb/webpack.config.js
 */

const path = require('path');

module.exports = {
    mode: 'development',
    entry: [
        './src/index.js',
        './src/adb_backend.js',
    ],
    devtool: 'inline-source-map',
    output: {
        filename: 'adb.bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs',
    },
};