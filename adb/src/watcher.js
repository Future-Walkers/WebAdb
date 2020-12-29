export class AdbWebBackendWatcher {
    constructor(callback) {
        this.callback = callback;
        window.navigator.usb.addEventListener('connect', callback);
        window.navigator.usb.addEventListener('disconnect', callback);
    }
    dispose() {
        window.navigator.usb.removeEventListener('connect', this.callback);
        window.navigator.usb.removeEventListener('disconnect', this.callback);
    }
}
//# sourceMappingURL=watcher.js.map