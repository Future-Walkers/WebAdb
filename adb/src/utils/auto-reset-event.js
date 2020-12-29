/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 12:07:25
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:32:05
 * @FilePath: /webadb/adb/utils/auto-reset-event.js
 */
import { PromiseResolver } from '../async-operation-manager/index';
export class AutoResetEvent {
    constructor(initialSet = false) {
        this.list = [];
        this.blocking = initialSet;
    }
    wait() {
        if (!this.blocking) {
            this.blocking = true;
            if (this.list.length === 0) {
                return Promise.resolve();
            }
        }
        const resolver = new PromiseResolver();
        this.list.push(resolver);
        return resolver.promise;
    }
    notify() {
        if (this.list.length !== 0) {
            this.list.pop().resolve();
        }
        else {
            this.blocking = false;
        }
    }
    dispose() {
        for (const item of this.list) {
            item.reject(new Error('The AutoResetEvent has been disposed'));
        }
        this.list.length = 0;
    }
}
//# sourceMappingURL=auto-reset-event.js.map