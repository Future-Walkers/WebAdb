/*
 * @title: todo
 * @author: Rodney Cheung
 * @date: 2020-12-26 12:07:44
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:24:36
 */
import { AutoResetEvent, EventQueue } from '../utils/index.js';
export class AdbReadableStream {
    constructor(stream) {
        this.readLock = new AutoResetEvent();
        this.stream = stream;
        this.queue = new EventQueue({
            highWaterMark: 16 * 1024,
        });
        const resetEvent = new AutoResetEvent(true);
        this.stream.onData(buffer => {
            if (!this.queue.push(buffer, buffer.byteLength)) {
                return resetEvent.wait();
            }
            return;
        });
        this.stream.onClose(() => {
            this.queue.end();
        });
        this.queue.onLowWater(() => {
            resetEvent.notify();
        });
    }
    get backend() { return this.stream.backend; }
    get localId() { return this.stream.localId; }
    get remoteId() { return this.stream.remoteId; }
    async read() {
        await this.readLock.wait();
        try {
            return await this.queue.next();
        }
        finally {
            this.readLock.notify();
        }
    }
    write(data) {
        return this.stream.write(data);
    }
    close() {
        this.stream.close();
    }
}
//# sourceMappingURL=readable-stream.js.map