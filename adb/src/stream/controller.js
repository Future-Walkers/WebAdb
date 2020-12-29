/*
 * @title: todo
 * @author: Rodney Cheung
 * @date: 2020-12-26 14:12:47
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:37:16
 */
import { AsyncEventEmitter, AutoDisposable, EventEmitter } from '../event/index';
import { AdbCommand } from '../packet';
import { AutoResetEvent } from '../utils/index';
import { chunkArrayLike } from './chunk';
export class AdbStreamController extends AutoDisposable {
    constructor(localId, remoteId, dispatcher) {
        super();
        this.writeChunkLock = this.addDisposable(new AutoResetEvent());
        this.writeLock = this.addDisposable(new AutoResetEvent());
        this.dataEvent = this.addDisposable(new AsyncEventEmitter());
        this._closed = false;
        this.closeEvent = this.addDisposable(new EventEmitter());
        this.localId = localId;
        this.remoteId = remoteId;
        this.dispatcher = dispatcher;
    }
    get backend() { return this.dispatcher.backend; }
    get closed() { return this._closed; }
    get onClose() { return this.closeEvent.event; }
    async writeChunk(data) {
        if (this._closed) {
            throw new Error('Can not write after closed');
        }
        // Wait for an ack packet
        await this.writeChunkLock.wait();
        await this.dispatcher.sendPacket(AdbCommand.Write, this.localId, this.remoteId, data);
    }
    async write(data) {
        // Keep write operations in order
        await this.writeLock.wait();
        for await (const chunk of chunkArrayLike(data, this.dispatcher.maxPayloadSize)) {
            await this.writeChunk(chunk);
        }
        this.writeLock.notify();
    }
    ack() {
        this.writeChunkLock.notify();
    }
    async close() {
        if (!this._closed) {
            await this.dispatcher.sendPacket(AdbCommand.Close, this.localId, this.remoteId);
            this._closed = true;
        }
    }
    dispose() {
        this._closed = true;
        this.closeEvent.fire();
        super.dispose();
    }
}
//# sourceMappingURL=controller.js.map