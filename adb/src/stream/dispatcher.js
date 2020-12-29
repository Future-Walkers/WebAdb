import { AsyncOperationManager } from '../async-operation-manager/index';
import { AutoDisposable, EventEmitter } from '../event/index';
import { AdbCommand, AdbPacket } from '../packet';
import { AutoResetEvent } from '../utils/index';
import { AdbStreamController } from './controller';
import { AdbStream } from './stream';
export class AdbPacketDispatcher extends AutoDisposable {
    constructor(backend, logger) {
        super();
        // ADB stream id starts from 1
        // (0 means open failed)
        this.initializers = new AsyncOperationManager(1);
        this.streams = new Map();
        this.sendLock = new AutoResetEvent();
        this.maxPayloadSize = 0;
        this.calculateChecksum = true;
        this.appendNullToServiceString = true;
        this.packetEvent = this.addDisposable(new EventEmitter());
        this.streamEvent = this.addDisposable(new EventEmitter());
        this.errorEvent = this.addDisposable(new EventEmitter());
        this._running = false;
        this.backend = backend;
        this.logger = logger;
    }
    get onPacket() { return this.packetEvent.event; }
    get onStream() { return this.streamEvent.event; }
    get onError() { return this.errorEvent.event; }
    get running() { return this._running; }
    async receiveLoop() {
        var _a;
        try {
            while (this._running) {
                const packet = await AdbPacket.read(this.backend);
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.onIncomingPacket(packet);
                switch (packet.command) {
                    case AdbCommand.OK:
                        this.handleOk(packet);
                        continue;
                    case AdbCommand.Close:
                        // CLSE also has two meanings
                        if (packet.arg0 === 0) {
                            // 1. The device don't want to create the Stream
                            this.initializers.reject(packet.arg1, new Error('Stream open failed'));
                            continue;
                        }
                        if (this.streams.has(packet.arg1)) {
                            // 2. The device has closed the Stream
                            this.streams.get(packet.arg1).dispose();
                            this.streams.delete(packet.arg1);
                            continue;
                        }
                        // Maybe the device is responding to a packet of last connection
                        // Just ignore it
                        continue;
                    case AdbCommand.Write:
                        if (this.streams.has(packet.arg1)) {
                            await this.streams.get(packet.arg1).dataEvent.fire(packet.payload);
                            await this.sendPacket(AdbCommand.OK, packet.arg1, packet.arg0);
                        }
                        // Maybe the device is responding to a packet of last connection
                        // Just ignore it
                        continue;
                    case AdbCommand.Open:
                        await this.handleOpen(packet);
                        continue;
                }
                const args = {
                    handled: false,
                    packet,
                };
                this.packetEvent.fire(args);
                if (!args.handled) {
                    this.dispose();
                    throw new Error(`Unhandled packet with command '${packet.command}'`);
                }
            }
        }
        catch (e) {
            if (!this._running) {
                // ignore error
                return;
            }
            this.errorEvent.fire(e);
        }
    }
    handleOk(packet) {
        if (this.initializers.resolve(packet.arg1, packet.arg0)) {
            // Device has created the `Stream`
            return;
        }
        if (this.streams.has(packet.arg1)) {
            // Device has received last `WRTE` to the `Stream`
            this.streams.get(packet.arg1).ack();
            return;
        }
        // Maybe the device is responding to a packet of last connection
        // Tell the device to close the stream
        this.sendPacket(AdbCommand.Close, packet.arg1, packet.arg0);
    }
    async handleOpen(packet) {
        // AsyncOperationManager doesn't support get and skip an ID
        // Use `add` + `resolve` to simulate this behavior
        const [localId] = this.initializers.add();
        this.initializers.resolve(localId, undefined);
        const remoteId = packet.arg0;
        const controller = new AdbStreamController(localId, remoteId, this);
        const stream = new AdbStream(controller);
        const args = {
            handled: false,
            packet,
            stream,
        };
        this.streamEvent.fire(args);
        if (args.handled) {
            this.streams.set(localId, controller);
            await this.sendPacket(AdbCommand.OK, localId, remoteId);
        }
        else {
            await this.sendPacket(AdbCommand.Close, 0, remoteId);
        }
    }
    start() {
        this._running = true;
        this.receiveLoop();
    }
    async createStream(service) {
        if (this.appendNullToServiceString) {
            service += '\0';
        }
        const [localId, initializer] = this.initializers.add();
        await this.sendPacket(AdbCommand.Open, localId, 0, service);
        const remoteId = await initializer;
        const controller = new AdbStreamController(localId, remoteId, this);
        this.streams.set(controller.localId, controller);
        return new AdbStream(controller);
    }
    async sendPacket(packetOrCommand, arg0, arg1, payload) {
        var _a;
        let init;
        if (arguments.length === 1) {
            init = packetOrCommand;
        }
        else {
            init = {
                command: packetOrCommand,
                arg0: arg0,
                arg1: arg1,
                payload: typeof payload === 'string' ? this.backend.encodeUtf8(payload) : payload,
            };
        }
        if (init.payload &&
            init.payload.byteLength > this.maxPayloadSize) {
            throw new Error('payload too large');
        }
        try {
            // `AdbPacket.write` writes each packet in two parts
            // Use a lock to prevent packets been interlaced
            await this.sendLock.wait();
            const packet = AdbPacket.create(init, this.calculateChecksum, this.backend);
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.onOutgoingPacket(packet);
            await AdbPacket.write(packet, this.backend);
        }
        finally {
            this.sendLock.notify();
        }
    }
    dispose() {
        this._running = false;
        for (const stream of this.streams.values()) {
            stream.dispose();
        }
        this.streams.clear();
        super.dispose();
    }
}
//# sourceMappingURL=dispatcher.js.map