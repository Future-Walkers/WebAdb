import { EventEmitter } from './event-emitter';
export class AsyncEventEmitter extends EventEmitter {
    async fire(e) {
        for (const info of this.listeners) {
            await info.listener.apply(info.thisArg, [e, ...info.args]);
        }
    }
}
//# sourceMappingURL=async-event-emitter.js.map