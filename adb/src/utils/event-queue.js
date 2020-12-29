/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 12:07:25
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:29:15
 * @FilePath: /webadb/adb/utils/event-queue.js
 */
import { PromiseResolver } from '../async-operation-manager/index';
import { EventEmitter } from '../event/index';
export const EventQueueDefaultOptions = {
    maxWaitCount: Infinity,
    highWaterMark: 10,
    lowWaterMark: 0,
};
export class EventQueue {
    constructor(options = EventQueueDefaultOptions) {
        this.pullQueue = [];
        this.pushQueue = [];
        this.ended = false;
        this.waterMark = 0;
        this.pendingLowWaterEvent = false;
        this.lowWaterEvent = new EventEmitter();
        this.options = { ...EventQueueDefaultOptions, ...options };
    }
    get onLowWater() { return this.lowWaterEvent.event; }
    push(value, size = 1) {
        if (this.ended) {
            return true;
        }
        if (this.pullQueue.length) {
            this.pullQueue.shift().resolve(value);
            return true;
        }
        this.pushQueue.push([value, size]);
        this.waterMark += size;
        if (this.waterMark < this.options.highWaterMark) {
            return true;
        }
        this.pendingLowWaterEvent = true;
        return false;
    }
    next() {
        if (this.pushQueue.length) {
            const [value, size] = this.pushQueue.shift();
            this.waterMark -= size;
            if (this.pendingLowWaterEvent &&
                this.waterMark <= this.options.lowWaterMark) {
                this.lowWaterEvent.fire();
            }
            return Promise.resolve(value);
        }
        if (this.ended) {
            return Promise.reject(new Error('The EventQueue has already ended'));
        }
        if (this.pullQueue.length === this.options.maxWaitCount - 1) {
            throw new Error('Max wait count exceeded');
        }
        const resolver = new PromiseResolver();
        this.pullQueue.push(resolver);
        return resolver.promise;
    }
    end() {
        this.ended = true;
        let item;
        while (item = this.pullQueue.shift()) {
            item.reject(new Error('The EventQueue has already ended'));
        }
    }
}
//# sourceMappingURL=event-queue.js.map