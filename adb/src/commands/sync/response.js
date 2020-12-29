/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 12:07:04
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:26:22
 * @FilePath: /webadb/adb/commands/sync/response.js
 */
import { Struct } from '../../struct/index';
export var AdbSyncResponseId;
(function (AdbSyncResponseId) {
    AdbSyncResponseId["Entry"] = "DENT";
    AdbSyncResponseId["Lstat"] = "STAT";
    AdbSyncResponseId["Stat"] = "STA2";
    AdbSyncResponseId["Lstat2"] = "LST2";
    AdbSyncResponseId["Done"] = "DONE";
    AdbSyncResponseId["Data"] = "DATA";
    AdbSyncResponseId["Ok"] = "OKAY";
    AdbSyncResponseId["Fail"] = "FAIL";
})(AdbSyncResponseId || (AdbSyncResponseId = {}));
// DONE responses' size are always same as the request's normal response.
// For example DONE responses for LIST requests are 16 bytes (same as DENT responses),
// but DONE responses for STAT requests are 12 bytes (same as STAT responses)
// So we need to know responses' size in advance.
export class AdbSyncDoneResponse {
    constructor(length) {
        this.id = AdbSyncResponseId.Done;
        this.length = length;
    }
    async deserialize(context) {
        await context.read(this.length);
        return this;
    }
}
export const AdbSyncFailResponse = new Struct({ littleEndian: true })
    .uint32('messageLength')
    .string('message', { lengthField: 'messageLength' })
    .afterParsed(object => {
    throw new Error(object.message);
});
export async function adbSyncReadResponse(stream, types) {
    const id = stream.backend.decodeUtf8(await stream.read(4));
    if (id === AdbSyncResponseId.Fail) {
        await AdbSyncFailResponse.deserialize(stream);
    }
    if (types[id]) {
        return types[id].deserialize(stream);
    }
    throw new Error('Unexpected response id');
}
//# sourceMappingURL=response.js.map