/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 12:07:04
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:24:14
 * @FilePath: /webadb/adb/commands/reverse.js
 */
import { AutoDisposable } from '../event/index.js';
import { Struct } from '..//struct/index.js';
import { AdbBufferedStream } from '../stream/index.js';
const AdbReverseStringResponse = new Struct({ littleEndian: true })
    .string('length', { length: 4 })
    .string('content', { lengthField: 'length' });
const AdbReverseErrorResponse = AdbReverseStringResponse
    .afterParsed((value) => {
    throw new Error(value.content);
});
export class AdbReverseCommand extends AutoDisposable {
    constructor(dispatcher) {
        super();
        this.localPortToHandler = new Map();
        this.deviceAddressToLocalPort = new Map();
        this.listening = false;
        this.dispatcher = dispatcher;
        this.addDisposable(this.dispatcher.onStream(this.handleStream, this));
    }
    async createBufferedStream(service) {
        const stream = await this.dispatcher.createStream(service);
        return new AdbBufferedStream(stream);
    }
    async sendRequest(service) {
        const stream = await this.createBufferedStream(service);
        const success = this.dispatcher.backend.decodeUtf8(await stream.read(4)) === 'OKAY';
        if (!success) {
            await AdbReverseErrorResponse.deserialize(stream);
        }
        return stream;
    }
    handleStream(e) {
        if (e.handled) {
            return;
        }
        const address = this.dispatcher.backend.decodeUtf8(e.packet.payload);
        // tcp:1234\0
        const port = Number.parseInt(address.substring(4));
        if (this.localPortToHandler.has(port)) {
            this.localPortToHandler.get(port).onStream(e.packet, e.stream);
            e.handled = true;
        }
    }
    async list() {
        const stream = await this.createBufferedStream('reverse:list-forward');
        const response = await AdbReverseStringResponse.deserialize(stream);
        return response.content.split('\n').map(line => {
            const [deviceSerial, localName, remoteName] = line.split(' ');
            return { deviceSerial, localName, remoteName };
        });
        // No need to close the stream, device will close it
    }
    async add(deviceAddress, localPort, handler) {
        const stream = await this.sendRequest(`reverse:forward:${deviceAddress};tcp:${localPort}`);
        // `tcp:0` tells the device to pick an available port.
        // However, device will response with the selected port for all `tcp:` requests.
        if (deviceAddress.startsWith('tcp:')) {
            const response = await AdbReverseStringResponse.deserialize(stream);
            deviceAddress = `tcp:${Number.parseInt(response.content, 10)}`;
        }
        this.localPortToHandler.set(localPort, handler);
        this.deviceAddressToLocalPort.set(deviceAddress, localPort);
        return deviceAddress;
        // No need to close the stream, device will close it
    }
    async remove(deviceAddress) {
        await this.sendRequest(`reverse:killforward:${deviceAddress}`);
        if (this.deviceAddressToLocalPort.has(deviceAddress)) {
            this.localPortToHandler.delete(this.deviceAddressToLocalPort.get(deviceAddress));
            this.deviceAddressToLocalPort.delete(deviceAddress);
        }
        // No need to close the stream, device will close it
    }
    async removeAll() {
        await this.sendRequest(`reverse:killforward-all`);
        this.deviceAddressToLocalPort.clear();
        this.localPortToHandler.clear();
        // No need to close the stream, device will close it
    }
}
//# sourceMappingURL=reverse.js.map