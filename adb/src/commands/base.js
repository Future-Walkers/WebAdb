/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 12:07:04
 * @last_author: Sphantix Hang
 * @last_edit_time: 2020-12-28 14:16:04
 * @file_path: /webadb/adb/src/commands/base.js
 */
import { AutoDisposable } from '../event/index';
export class AdbCommandBase extends AutoDisposable {
    constructor(adb) {
        super();
        this.adb = adb;
    }
}
//# sourceMappingURL=base.js.map