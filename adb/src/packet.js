/*
 * @Author: Sphantix Hang
 * @Date: 2020-12-26 11:03:04
 * @last_author: Sphantix Hang
 * @last_edit_time: 2020-12-28 14:16:27
 * @file_path: /webadb/adb/src/packet.js
 */
import { BackingField, Struct } from './struct/index';
import { BufferedStream } from './stream/index';
export var AdbCommand;
(function (AdbCommand) {
    AdbCommand[AdbCommand["Auth"] = 1213486401] = "Auth";
    AdbCommand[AdbCommand["Close"] = 1163086915] = "Close";
    AdbCommand[AdbCommand["Connect"] = 1314410051] = "Connect";
    AdbCommand[AdbCommand["OK"] = 1497451343] = "OK";
    AdbCommand[AdbCommand["Open"] = 1313165391] = "Open";
    AdbCommand[AdbCommand["Write"] = 1163154007] = "Write";
})(AdbCommand || (AdbCommand = {}));
const AdbPacketWithoutPayload = new Struct({ littleEndian: true })
    .uint32('command', undefined)
    .uint32('arg0')
    .uint32('arg1')
    .uint32('payloadLength')
    .uint32('checksum')
    .int32('magic');
const AdbPacketStruct = AdbPacketWithoutPayload
    .arrayBuffer('payload', { lengthField: 'payloadLength' })
    .afterParsed((value) => {
    if (value[BackingField].magic !== value.magic) {
        throw new Error('Invalid command');
    }
});
export var AdbPacket;
(function (AdbPacket) {
    function create(init, calculateChecksum, backend) {
        let checksum;
        if (calculateChecksum && init.payload) {
            const array = new Uint8Array(init.payload);
            checksum = array.reduce((result, item) => result + item, 0);
        }
        else {
            checksum = 0;
        }
        return AdbPacketStruct.create({
            ...init,
            checksum,
            magic: init.command ^ 0xFFFFFFFF,
        }, backend);
    }
    AdbPacket.create = create;
    async function read(backend) {
        let buffer = await backend.read(24);
        if (buffer.byteLength !== 24) {
            // Maybe it's a payload from last connection.
            // Ignore and try again
            buffer = await backend.read(24);
        }
        let bufferUsed = false;
        const stream = new BufferedStream({
            read(length) {
                if (!bufferUsed) {
                    bufferUsed = true;
                    return buffer;
                }
                return backend.read(length);
            }
        });
        return AdbPacketStruct.deserialize({
            read: stream.read.bind(stream),
            decodeUtf8: backend.decodeUtf8.bind(backend),
            encodeUtf8: backend.encodeUtf8.bind(backend),
        });
    }
    AdbPacket.read = read;
    async function write(packet, backend) {
        // Write payload separately to avoid an extra copy
        await backend.write(AdbPacketWithoutPayload.serialize(packet, backend));
        if (packet.payload) {
            await backend.write(packet.payload);
        }
    }
    AdbPacket.write = write;
})(AdbPacket || (AdbPacket = {}));
//# sourceMappingURL=packet.js.map