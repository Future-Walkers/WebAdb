export class AdbStream {
    constructor(controller) {
        this.controller = controller;
    }
    get backend() { return this.controller.backend; }
    get localId() { return this.controller.localId; }
    get remoteId() { return this.controller.remoteId; }
    get closed() { return this.controller.closed; }
    get onData() { return this.controller.dataEvent.event; }
    get onClose() { return this.controller.onClose; }
    write(data) {
        return this.controller.write(data);
    }
    close() {
        return this.controller.close();
    }
}
//# sourceMappingURL=stream.js.map