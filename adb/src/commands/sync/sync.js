/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 12:07:04
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:31:00
 * @FilePath: /webadb/adb/commands/sync/sync.js
 */
import { AutoDisposable } from '../../event/index';
import { AdbFeatures } from '../../features';
import { AdbBufferedStream } from '../../stream/index';
import { AutoResetEvent } from '../../utils/index';
import { adbSyncOpenDir } from './list';
import { adbSyncPull } from './pull';
import { adbSyncPush } from './push';
import { adbSyncLstat, adbSyncStat } from './stat';
export class AdbSync extends AutoDisposable {
    constructor(adb, stream) {
        super();
        this.sendLock = this.addDisposable(new AutoResetEvent());
        this.adb = adb;
        this.stream = new AdbBufferedStream(stream);
    }
    get supportStat() {
        return this.adb.features.includes(AdbFeatures.StatV2);
    }
    async lstat(path) {
        await this.sendLock.wait();
        try {
            return adbSyncLstat(this.stream, path, this.supportStat);
        }
        finally {
            this.sendLock.notify();
        }
    }
    async stat(path) {
        if (!this.supportStat) {
            throw new Error('Not supported');
        }
        await this.sendLock.wait();
        try {
            return adbSyncStat(this.stream, path);
        }
        finally {
            this.sendLock.notify();
        }
    }
    async isDirectory(path) {
        try {
            await this.lstat(path + '/');
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async *opendir(path) {
        await this.sendLock.wait();
        try {
            yield* adbSyncOpenDir(this.stream, path);
        }
        finally {
            this.sendLock.notify();
        }
    }
    async readdir(path) {
        const results = [];
        for await (const entry of this.opendir(path)) {
            results.push(entry);
        }
        return results;
    }
    async *read(filename) {
        await this.sendLock.wait();
        try {
            yield* adbSyncPull(this.stream, filename);
        }
        finally {
            this.sendLock.notify();
        }
    }
    async write(filename, content, mode, mtime, onProgress) {
        await this.sendLock.wait();
        try {
            await adbSyncPush(this.stream, filename, content, mode, mtime, undefined, onProgress);
        }
        finally {
            this.sendLock.notify();
        }
    }
    dispose() {
        super.dispose();
        this.stream.close();
    }
}
//# sourceMappingURL=sync.js.map