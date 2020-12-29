/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 12:07:04
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:26:37
 * @FilePath: /webadb/adb/commands/sync/stat.js
 */
import { placeholder, Struct } from '../../struct/index';
import { AdbSyncRequestId, adbSyncWriteRequest } from './request';
import { adbSyncReadResponse, AdbSyncResponseId } from './response';
// https://github.com/python/cpython/blob/4e581d64b8aff3e2eda99b12f080c877bb78dfca/Lib/stat.py#L36
export var LinuxFileType;
(function (LinuxFileType) {
    LinuxFileType[LinuxFileType["Directory"] = 4] = "Directory";
    LinuxFileType[LinuxFileType["File"] = 8] = "File";
    LinuxFileType[LinuxFileType["Link"] = 10] = "Link";
})(LinuxFileType || (LinuxFileType = {}));
export const AdbSyncLstatResponse = new Struct({ littleEndian: true })
    .int32('mode')
    .int32('size')
    .int32('mtime')
    .extra({
    id: AdbSyncResponseId.Lstat,
    get type() { return this.mode >> 12; },
    get permission() { return this.mode & 4095; },
})
    .afterParsed((object) => {
    if (object.mode === 0 &&
        object.size === 0 &&
        object.mtime === 0) {
        throw new Error('lstat failed');
    }
});
export var AdbSyncStatErrorCode;
(function (AdbSyncStatErrorCode) {
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EACCES"] = 13] = "EACCES";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EEXIST"] = 17] = "EEXIST";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EFAULT"] = 14] = "EFAULT";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EFBIG"] = 27] = "EFBIG";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EINTR"] = 4] = "EINTR";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EINVAL"] = 22] = "EINVAL";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EIO"] = 5] = "EIO";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EISDIR"] = 21] = "EISDIR";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["ELOOP"] = 40] = "ELOOP";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EMFILE"] = 24] = "EMFILE";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["ENAMETOOLONG"] = 36] = "ENAMETOOLONG";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["ENFILE"] = 23] = "ENFILE";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["ENOENT"] = 2] = "ENOENT";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["ENOMEM"] = 12] = "ENOMEM";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["ENOSPC"] = 28] = "ENOSPC";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["ENOTDIR"] = 20] = "ENOTDIR";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EOVERFLOW"] = 75] = "EOVERFLOW";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EPERM"] = 1] = "EPERM";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["EROFS"] = 30] = "EROFS";
    AdbSyncStatErrorCode[AdbSyncStatErrorCode["ETXTBSY"] = 26] = "ETXTBSY";
})(AdbSyncStatErrorCode || (AdbSyncStatErrorCode = {}));
export const AdbSyncStatResponse = new Struct({ littleEndian: true })
    .uint32('error', undefined, placeholder())
    .uint64('dev')
    .uint64('ino')
    .uint32('mode')
    .uint32('nlink')
    .uint32('uid')
    .uint32('gid')
    .uint64('size')
    .uint64('atime')
    .uint64('mtime')
    .uint64('ctime')
    .extra({
    id: AdbSyncResponseId.Stat,
    get type() { return this.mode >> 12; },
    get permission() { return this.mode & 4095; },
})
    .afterParsed((object) => {
    if (object.error) {
        throw new Error(AdbSyncStatErrorCode[object.error]);
    }
});
const StatResponseType = {
    [AdbSyncResponseId.Stat]: AdbSyncStatResponse,
};
const LstatResponseType = {
    [AdbSyncResponseId.Lstat]: AdbSyncLstatResponse,
};
const Lstat2ResponseType = {
    [AdbSyncResponseId.Lstat2]: AdbSyncStatResponse,
};
export async function adbSyncLstat(stream, path, v2) {
    let requestId;
    let responseType;
    if (v2) {
        requestId = AdbSyncRequestId.Lstat2;
        responseType = Lstat2ResponseType;
    }
    else {
        requestId = AdbSyncRequestId.Lstat;
        responseType = LstatResponseType;
    }
    await adbSyncWriteRequest(stream, requestId, path);
    return adbSyncReadResponse(stream, responseType);
}
export async function adbSyncStat(stream, path) {
    await adbSyncWriteRequest(stream, AdbSyncRequestId.Stat, path);
    return adbSyncReadResponse(stream, StatResponseType);
}
//# sourceMappingURL=stat.js.map