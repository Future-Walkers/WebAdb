/*
 * @Author: Sphantix Hang
 * @date: 2020-12-28 13:53:46
 * @last_author: Sphantix Hang
 * @last_edit_time: 2020-12-29 09:42:05
 * @file_path: /webadb/adb/rollup.config.js
 */
export default [{
    input: 'src/adb.js',
    output: {
        // dir: 'dist',
        file: 'adb.bundle.js',
        format: 'es',
        name:"adb"
    }
},
{
    input: 'src/adb_backend.js',
    output: {
        // dir: 'dist',
        file: 'adb_backend.bundle.js',
        format: 'es',
        name:"adb_backend"
    }
}
];