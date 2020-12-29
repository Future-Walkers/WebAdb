import { PromiseResolver } from './async-operation-manager/index';
import { DisposableList } from './event/index';
import { AdbAuthenticationHandler, AdbDefaultAuthenticators } from './auth';
import { AdbDemoMode, AdbReverseCommand, AdbSync, AdbTcpIpCommand, escapeArg, framebuffer, install } from './commands/index';
import { AdbFeatures } from './features';
import { AdbCommand } from './packet';
import { AdbPacketDispatcher } from './stream/index';
export var AdbPropKey;
(function (AdbPropKey) {
    AdbPropKey["Product"] = "ro.product.name";
    AdbPropKey["Model"] = "ro.product.model";
    AdbPropKey["Device"] = "ro.product.device";
    AdbPropKey["Features"] = "features";
})(AdbPropKey || (AdbPropKey = {}));
export class Adb {
    constructor(backend, logger) {
        this._connected = false;
        this.packetDispatcher = new AdbPacketDispatcher(backend, logger);
        this.tcpip = new AdbTcpIpCommand(this);
        this.reverse = new AdbReverseCommand(this.packetDispatcher);
        this.demoMode = new AdbDemoMode(this);
        backend.onDisconnected(this.dispose, this);
    }
    get backend() { return this.packetDispatcher.backend; }
    get onDisconnected() { return this.backend.onDisconnected; }
    get connected() { return this._connected; }
    get name() { return this.backend.name; }
    get protocolVersion() { return this._protocolVersion; }
    get product() { return this._product; }
    get model() { return this._model; }
    get device() { return this._device; }
    get features() { return this._features; }
    async connect(authenticators = AdbDefaultAuthenticators) {
        var _a, _b;
        await ((_b = (_a = this.backend).connect) === null || _b === void 0 ? void 0 : _b.call(_a));
        this.packetDispatcher.maxPayloadSize = 0x1000;
        this.packetDispatcher.calculateChecksum = true;
        this.packetDispatcher.appendNullToServiceString = true;
        this.packetDispatcher.start();
        const version = 0x01000001;
        const versionNoChecksum = 0x01000001;
        const maxPayloadSize = 0x100000;
        const features = [
            'shell_v2',
            'cmd',
            AdbFeatures.StatV2,
            'ls_v2',
            'fixed_push_mkdir',
            'apex',
            'abb',
            'fixed_push_symlink_timestamp',
            'abb_exec',
            'remount_shell',
            'track_app',
            'sendrecv_v2',
            'sendrecv_v2_brotli',
            'sendrecv_v2_lz4',
            'sendrecv_v2_zstd',
            'sendrecv_v2_dry_run_send',
        ].join(',');
        const resolver = new PromiseResolver();
        const authHandler = new AdbAuthenticationHandler(authenticators, this.backend);
        const disposableList = new DisposableList();
        disposableList.add(this.packetDispatcher.onPacket(async (e) => {
            e.handled = true;
            const { packet } = e;
            try {
                switch (packet.command) {
                    case AdbCommand.Connect:
                        this.packetDispatcher.maxPayloadSize = Math.min(maxPayloadSize, packet.arg1);
                        const finalVersion = Math.min(version, packet.arg0);
                        this._protocolVersion = finalVersion;
                        if (finalVersion >= versionNoChecksum) {
                            this.packetDispatcher.calculateChecksum = false;
                            // Android prior to 9.0.0 uses char* to parse service string
                            // thus requires an extra null character
                            this.packetDispatcher.appendNullToServiceString = false;
                        }
                        this.parseBanner(this.backend.decodeUtf8(packet.payload));
                        resolver.resolve();
                        break;
                    case AdbCommand.Auth:
                        const authPacket = await authHandler.handle(e.packet);
                        await this.packetDispatcher.sendPacket(authPacket);
                        break;
                    case AdbCommand.Close:
                        // Last connection was interrupted
                        // Ignore this packet, device will recover
                        break;
                    default:
                        throw new Error('Device not in correct state. Reconnect your device and try again');
                }
            }
            catch (e) {
                resolver.reject(e);
            }
        }));
        disposableList.add(this.packetDispatcher.onError(e => {
            resolver.reject(e);
        }));
        // Android prior 9.0.0 requires the null character
        // Newer versions can also handle the null character
        // The terminating `;` is required in formal definition
        // But ADB daemon can also work without it
        await this.packetDispatcher.sendPacket(AdbCommand.Connect, version, maxPayloadSize, `host::features=${features};\0`);
        try {
            await resolver.promise;
            this._connected = true;
        }
        finally {
            disposableList.dispose();
        }
    }
    parseBanner(banner) {
        this._features = [];
        const pieces = banner.split('::');
        if (pieces.length > 1) {
            const props = pieces[1];
            for (const prop of props.split(';')) {
                if (!prop) {
                    continue;
                }
                const keyValue = prop.split('=');
                if (keyValue.length !== 2) {
                    continue;
                }
                const [key, value] = keyValue;
                switch (key) {
                    case AdbPropKey.Product:
                        this._product = value;
                        break;
                    case AdbPropKey.Model:
                        this._model = value;
                        break;
                    case AdbPropKey.Device:
                        this._device = value;
                        break;
                    case AdbPropKey.Features:
                        this._features = value.split(',');
                        break;
                }
            }
        }
    }
    shell() {
        return this.createStream('shell:');
    }
    spawn(command, ...args) {
        // TODO: use shell protocol
        return this.createStream(`shell:${command} ${args.join(' ')}`);
    }
    exec(command, ...args) {
        // TODO: use shell protocol
        return this.createStreamAndReadAll(`shell:${command} ${args.join(' ')}`);
    }
    async getProp(key) {
        const output = await this.exec('getprop', key);
        return output.trim();
    }
    async rm(...filenames) {
        return await this.exec('rm', '-rf', ...filenames.map(arg => escapeArg(arg)));
    }
    async install(apk, onProgress) {
        return await install(this, apk, onProgress);
    }
    async sync() {
        const stream = await this.createStream('sync:');
        return new AdbSync(this, stream);
    }
    async framebuffer() {
        return framebuffer(this);
    }
    async createStream(service) {
        return this.packetDispatcher.createStream(service);
    }
    async createStreamAndReadAll(service) {
        const stream = await this.createStream(service);
        const resolver = new PromiseResolver();
        let result = '';
        stream.onData(buffer => {
            result += this.backend.decodeUtf8(buffer);
        });
        stream.onClose(() => resolver.resolve(result));
        return resolver.promise;
    }
    async dispose() {
        this.packetDispatcher.dispose();
        await this.backend.dispose();
    }
}
//# sourceMappingURL=adb.js.map