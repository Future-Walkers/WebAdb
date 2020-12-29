import { decodeBase64, encodeBase64 } from './utils/index';
import { EventEmitter } from './event/index';
export * from './watcher';
export const WebUsbDeviceFilter = {
    classCode: 0xFF,
    subclassCode: 0x42,
    protocolCode: 1,
};
const PrivateKeyStorageKey = 'private-key';
const Utf8Encoder = new TextEncoder();
const Utf8Decoder = new TextDecoder();
export function encodeUtf8(input) {
    return Utf8Encoder.encode(input);
}
export function decodeUtf8(buffer) {
    return Utf8Decoder.decode(buffer);
}
export default class AdbWebBackend {
    constructor(device) {
        this.disconnectEvent = new EventEmitter();
        this.onDisconnected = this.disconnectEvent.event;
        this.handleDisconnect = (e) => {
            if (e.device === this._device) {
                this.disconnectEvent.fire();
            }
        };
        this._device = device;
        window.navigator.usb.addEventListener('disconnect', this.handleDisconnect);
    }
    static isSupported() {
        var _a;
        return !!((_a = window.navigator) === null || _a === void 0 ? void 0 : _a.usb);
    }
    static async getDevices() {
        const devices = await window.navigator.usb.getDevices();
        return devices.map(device => new AdbWebBackend(device));
    }
    static async requestDevice() {
        try {
            const device = await navigator.usb.requestDevice({ filters: [WebUsbDeviceFilter] });
            return new AdbWebBackend(device);
        }
        catch (e) {
            switch (e.name) {
                case 'NotFoundError':
                    return undefined;
                default:
                    throw e;
            }
        }
    }
    get serial() { return this._device.serialNumber; }
    get name() { return this._device.productName; }
    async connect() {
        var _a;
        if (!this._device.opened) {
            await this._device.open();
        }
        for (const configuration of this._device.configurations) {
            for (const interface_ of configuration.interfaces) {
                for (const alternate of interface_.alternates) {
                    if (alternate.interfaceSubclass === WebUsbDeviceFilter.subclassCode &&
                        alternate.interfaceClass === WebUsbDeviceFilter.classCode &&
                        alternate.interfaceSubclass === WebUsbDeviceFilter.subclassCode) {
                        if (((_a = this._device.configuration) === null || _a === void 0 ? void 0 : _a.configurationValue) !== configuration.configurationValue) {
                            await this._device.selectConfiguration(configuration.configurationValue);
                        }
                        if (!interface_.claimed) {
                            await this._device.claimInterface(interface_.interfaceNumber);
                        }
                        if (interface_.alternate.alternateSetting !== alternate.alternateSetting) {
                            await this._device.selectAlternateInterface(interface_.interfaceNumber, alternate.alternateSetting);
                        }
                        for (const endpoint of alternate.endpoints) {
                            switch (endpoint.direction) {
                                case 'in':
                                    this._inEndpointNumber = endpoint.endpointNumber;
                                    if (this._outEndpointNumber !== undefined) {
                                        return;
                                    }
                                    break;
                                case 'out':
                                    this._outEndpointNumber = endpoint.endpointNumber;
                                    if (this._inEndpointNumber !== undefined) {
                                        return;
                                    }
                                    break;
                            }
                        }
                    }
                }
            }
        }
        throw new Error('Unknown error');
    }
    *iterateKeys() {
        const privateKey = window.localStorage.getItem(PrivateKeyStorageKey);
        if (privateKey) {
            yield decodeBase64(privateKey);
        }
    }
    async generateKey() {
        const { privateKey: cryptoKey } = await crypto.subtle.generateKey({
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            // 65537
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-1',
        }, true, ['sign', 'verify']);
        const privateKey = await crypto.subtle.exportKey('pkcs8', cryptoKey);
        window.localStorage.setItem(PrivateKeyStorageKey, decodeUtf8(encodeBase64(privateKey)));
        return privateKey;
    }
    encodeUtf8(input) {
        return encodeUtf8(input);
    }
    decodeUtf8(buffer) {
        return decodeUtf8(buffer);
    }
    async write(buffer) {
        await this._device.transferOut(this._outEndpointNumber, buffer);
    }
    async read(length) {
        const result = await this._device.transferIn(this._inEndpointNumber, length);
        if (result.status === 'stall') {
            await this._device.clearHalt('in', this._inEndpointNumber);
        }
        const { buffer } = result.data;
        return buffer;
    }
    async dispose() {
        window.navigator.usb.removeEventListener('disconnect', this.handleDisconnect);
        this.disconnectEvent.dispose();
        await this._device.close();
    }
}
//# sourceMappingURL=index.js.map