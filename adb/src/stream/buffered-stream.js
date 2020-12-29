import { AdbReadableStream } from './readable-stream';
export class BufferedStream {
    constructor(stream) {
        this.stream = stream;
    }
    async read(length) {
        let array;
        let index;
        if (this.buffer) {
            const buffer = this.buffer;
            if (buffer.byteLength > length) {
                this.buffer = buffer.subarray(length);
                return buffer.slice(0, length).buffer;
            }
            array = new Uint8Array(length);
            array.set(buffer);
            index = buffer.byteLength;
            this.buffer = undefined;
        }
        else {
            const buffer = await this.stream.read(length);
            if (buffer.byteLength === length) {
                return buffer;
            }
            if (buffer.byteLength > length) {
                this.buffer = new Uint8Array(buffer, length);
                return buffer.slice(0, length);
            }
            array = new Uint8Array(length);
            array.set(new Uint8Array(buffer), 0);
            index = buffer.byteLength;
        }
        while (index < length) {
            const left = length - index;
            const buffer = await this.stream.read(left);
            if (buffer.byteLength > left) {
                array.set(new Uint8Array(buffer, 0, left), index);
                this.buffer = new Uint8Array(buffer, left);
                return array.buffer;
            }
            array.set(new Uint8Array(buffer), index);
            index += buffer.byteLength;
        }
        return array.buffer;
    }
    close() {
        var _a, _b;
        (_b = (_a = this.stream).close) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
}
export class AdbBufferedStream extends BufferedStream {
    get backend() { return this.stream.backend; }
    get localId() { return this.stream.localId; }
    get remoteId() { return this.stream.remoteId; }
    constructor(stream) {
        super(new AdbReadableStream(stream));
    }
    write(data) {
        return this.stream.write(data);
    }
    decodeUtf8(buffer) {
        return this.backend.decodeUtf8(buffer);
    }
    encodeUtf8(input) {
        return this.backend.encodeUtf8(input);
    }
}
//# sourceMappingURL=buffered-stream.js.map