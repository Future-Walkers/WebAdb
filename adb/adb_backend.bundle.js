/*
 * @title: todo
 * @author: Rodney Cheung
 * @date: 2020-12-26 11:58:43
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:48:54
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseResolver = void 0;
var PromiseResolver = /** @class */ (function () {
    function PromiseResolver() {
        var _this = this;
        this._state = 'running';
        this._promise = new Promise(function (resolve, reject) {
            _this._resolve = resolve;
            _this._reject = reject;
        });
    }
    Object.defineProperty(PromiseResolver.prototype, "promise", {
        get: function () { return this._promise; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PromiseResolver.prototype, "state", {
        get: function () { return this._state; },
        enumerable: false,
        configurable: true
    });
    PromiseResolver.prototype.resolve = function (value) {
        this._resolve(value);
        this._state = 'resolved';
    };
    PromiseResolver.prototype.reject = function (reason) {
        this._reject(reason);
        this._state = 'rejected';
    };
    return PromiseResolver;
}());
exports.PromiseResolver = PromiseResolver;
// exports.default = AsyncOperationManager;

// Prepare maps for O(1) searching
const charToIndex = {};
const indexToChar = [];
const paddingChar = '='.charCodeAt(0);
function addRange(start, end) {
    const charCodeStart = start.charCodeAt(0);
    const charCodeEnd = end.charCodeAt(0);
    for (let charCode = charCodeStart; charCode <= charCodeEnd; charCode += 1) {
        charToIndex[String.fromCharCode(charCode)] = indexToChar.length;
        indexToChar.push(charCode);
    }
}
addRange('A', 'Z');
addRange('a', 'z');
addRange('0', '9');
addRange('+', '+');
addRange('/', '/');
function calculateBase64EncodedLength(inputLength) {
    const remainder = inputLength % 3;
    const paddingLength = remainder !== 0 ? 3 - remainder : 0;
    return [(inputLength + paddingLength) / 3 * 4, paddingLength];
}
function encodeBase64(input, arg1, arg2, _arg3, _arg4) {
    var _a;
    if (input instanceof ArrayBuffer) {
        input = new Uint8Array(input);
    }
    // Because `Uint8Array` is type compatible with `ArrayBuffer`,
    // TypeScript doesn't correctly narrow `input` to `Uint8Array` when assigning.
    // Manually eliminate `ArrayBuffer` from `input` with a type guard.
    if (input instanceof ArrayBuffer) {
        return input;
    }
    let inputOffset;
    let inputLength;
    let output;
    let outputOffset;
    let outputArgumentIndex;
    if (typeof arg1 === 'number') {
        // overload 1, 3, 4
        inputOffset = arg1;
        if (typeof arg2 === 'number') {
            // overload 1, 4
            inputLength = arg2;
            outputArgumentIndex = 3;
        }
        else {
            // overload 3
            inputLength = input.byteLength - inputOffset;
            outputArgumentIndex = 2;
        }
    }
    else {
        // overload 2
        inputOffset = 0;
        inputLength = input.byteLength;
        outputArgumentIndex = 1;
    }
    const [outputLength, paddingLength] = calculateBase64EncodedLength(inputLength);
    let maybeOutput = arguments[outputArgumentIndex];
    let outputType;
    if (maybeOutput) {
        outputOffset = (_a = arguments[outputArgumentIndex + 1]) !== null && _a !== void 0 ? _a : 0;
        if (maybeOutput.byteLength - outputOffset < outputLength) {
            throw new Error('output buffer is too small');
        }
        if (maybeOutput instanceof ArrayBuffer) {
            output = new Uint8Array(maybeOutput);
        }
        else {
            output = maybeOutput;
        }
        outputType = 'number';
    }
    else {
        const buffer = new ArrayBuffer(outputLength);
        output = new Uint8Array(buffer);
        outputOffset = 0;
        outputType = 'ArrayBuffer';
    }
    // Because `Uint8Array` is type compatible with `ArrayBuffer`,
    // TypeScript doesn't correctly narrow `output` to `Uint8Array` when assigning.
    // Manually eliminate `ArrayBuffer` from `output` with a type guard.
    if (output instanceof ArrayBuffer) {
        return output;
    }
    if (input.buffer === output.buffer) {
        const bufferInputStart = input.byteOffset + inputOffset;
        const bufferOutputStart = output.byteOffset + outputOffset;
        if (bufferOutputStart < bufferInputStart - 1) {
            const bufferOutputEnd = bufferOutputStart + outputLength;
            if (bufferOutputEnd >= bufferInputStart) {
                throw new Error('input and output buffer can not be overlapping');
            }
        }
    }
    // Run backward to do in-place overwrite
    let inputIndex = inputOffset + inputLength - 1;
    let outputIndex = outputOffset + outputLength - 1;
    if (paddingLength === 2) {
        // aaaaaabb
        const x = input[inputIndex];
        inputIndex -= 1;
        output[outputIndex] = paddingChar;
        outputIndex -= 1;
        output[outputIndex] = paddingChar;
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((x & 0b11) << 4)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[x >> 2];
        outputIndex -= 1;
    }
    else if (paddingLength === 1) {
        // bbbbcccc
        const y = input[inputIndex];
        inputIndex -= 1;
        // aaaaaabb
        const x = input[inputIndex];
        inputIndex -= 1;
        output[outputIndex] = paddingChar;
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((y & 0b1111) << 2)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((x & 0b11) << 4) | (y >> 4)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[x >> 2];
        outputIndex -= 1;
    }
    while (inputIndex >= inputOffset) {
        // ccdddddd
        const z = input[inputIndex];
        inputIndex -= 1;
        // bbbbcccc
        const y = input[inputIndex];
        inputIndex -= 1;
        // aaaaaabb
        const x = input[inputIndex];
        inputIndex -= 1;
        output[outputIndex] = indexToChar[z & 0b111111];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((y & 0b1111) << 2) | (z >> 6)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((x & 0b11) << 4) | (y >> 4)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[x >> 2];
        outputIndex -= 1;
    }
    if (outputType === 'ArrayBuffer') {
        return output.buffer;
    }
    else {
        return outputLength;
    }
}
function decodeBase64(input) {
    let padding;
    if (input[input.length - 2] === '=') {
        padding = 2;
    }
    else if (input[input.length - 1] === '=') {
        padding = 1;
    }
    else {
        padding = 0;
    }
    const result = new Uint8Array(input.length / 4 * 3 - padding);
    let sIndex = 0;
    let dIndex = 0;
    while (sIndex < input.length - (padding !== 0 ? 4 : 0)) {
        const a = charToIndex[input[sIndex]];
        sIndex += 1;
        const b = charToIndex[input[sIndex]];
        sIndex += 1;
        const c = charToIndex[input[sIndex]];
        sIndex += 1;
        const d = charToIndex[input[sIndex]];
        sIndex += 1;
        result[dIndex] = (a << 2) | ((b & 48) >> 4);
        dIndex += 1;
        result[dIndex] = ((b & 0b1111) << 4) | ((c & 60) >> 2);
        dIndex += 1;
        result[dIndex] = ((c & 0b11) << 6) | d;
        dIndex += 1;
    }
    if (padding === 1) {
        const a = charToIndex[input[sIndex]];
        sIndex += 1;
        const b = charToIndex[input[sIndex]];
        sIndex += 1;
        const c = charToIndex[input[sIndex]];
        result[dIndex] = (a << 2) | ((b & 48) >> 4);
        dIndex += 1;
        result[dIndex] = ((b & 0b1111) << 4) | ((c & 60) >> 2);
    }
    else if (padding === 2) {
        const a = charToIndex[input[sIndex]];
        sIndex += 1;
        const b = charToIndex[input[sIndex]];
        result[dIndex] = (a << 2) | ((b & 48) >> 4);
    }
    return result.buffer;
}

class EventEmitter {
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

class AdbWebBackendWatcher {
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

const WebUsbDeviceFilter = {
    classCode: 0xFF,
    subclassCode: 0x42,
    protocolCode: 1,
};
const PrivateKeyStorageKey = 'private-key';
const Utf8Encoder = new TextEncoder();
const Utf8Decoder = new TextDecoder();
function encodeUtf8(input) {
    return Utf8Encoder.encode(input);
}
function decodeUtf8(buffer) {
    return Utf8Decoder.decode(buffer);
}
class AdbWebBackend {
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

export default AdbWebBackend;
export { AdbWebBackendWatcher, WebUsbDeviceFilter, decodeUtf8, encodeUtf8 };
