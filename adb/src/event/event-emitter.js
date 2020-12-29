export class EventEmitter {
    constructor() {
        this.listeners = [];
        this.event = this.event.bind(this);
    }
    event(listener, thisArg, ...args) {
        const info = {
            listener,
            thisArg,
            args,
        };
        this.listeners.push(info);
        const remove = () => {
            const index = this.listeners.indexOf(info);
            if (index !== -1) {
                this.listeners.splice(index, 1);
            }
        };
        remove.dispose = remove;
        return remove;
    }
    fire(e) {
        for (const info of this.listeners.slice()) {
            info.listener.apply(info.thisArg, [e, ...info.args]);
        }
    }
    dispose() {
        this.listeners.length = 0;
    }
}
//# sourceMappingURL=event-emitter.js.map