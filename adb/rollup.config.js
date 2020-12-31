/*
 * @Author: Sphantix Hang
 * @date: 2020-12-28 13:53:46
 * @last_author: Sphantix Hang
 * @last_edit_time: 2020-12-31 11:04:50
 * @file_path: /WebAdb/adb/rollup.config.js
 */
export default [{
    input: 'src/adb.js',
    output: {
        // dir: 'dist',
        file: 'adb.bundle.js',
        format: 'es',
        name:"adb"
    }
}
];