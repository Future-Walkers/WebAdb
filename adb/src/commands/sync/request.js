/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 12:07:04
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:25:43
 * @FilePath: /webadb/adb/commands/sync/request.js
 */
import { Struct } from '../../struct/index.js';
export var AdbSyncRequestId;
(function (AdbSyncRequestId) {
    AdbSyncRequestId["List"] = "LIST";
    AdbSyncRequestId["Send"] = "SEND";
    AdbSyncRequestId["Lstat"] = "STAT";
    AdbSyncRequestId["Stat"] = "STA2";
    AdbSyncRequestId["Lstat2"] = "LST2";
    AdbSyncRequestId["Data"] = "DATA";
    AdbSyncRequestId["Done"] = "DONE";
    AdbSyncRequestId["Receive"] = "RECV";
})(AdbSyncRequestId || (AdbSyncRequestId = {}));
export const AdbSyncNumberRequest = new Struct({ littleEndian: true })
    .string('id', { length: 4 })
    .uint32('arg');
export const AdbSyncDataRequest = AdbSyncNumberRequest
    .arrayBuffer('data', { lengthField: 'arg' });
export async function adbSyncWriteRequest(stream, id, value) {
    let buffer;
    if (typeof value === 'number') {
        buffer = AdbSyncNumberRequest.serialize({
            id,
            arg: value,
        }, stream);
    }
    else if (typeof value === 'string') {
        buffer = AdbSyncDataRequest.serialize({
            id,
            data: stream.encodeUtf8(value),
        }, stream);
    }
    else {
        buffer = AdbSyncDataRequest.serialize({
            id,
            data: value,
        }, stream);
    }
    await stream.write(buffer);
}
//# sourceMappingURL=request.js.map