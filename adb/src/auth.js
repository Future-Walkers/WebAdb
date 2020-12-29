/*
 * @Author: Sphantix Hang
 * @date: 2020-12-26 13:10:46
 * @last_author: Sphantix Hang
 * @last_edit_time: 2020-12-28 14:15:41
 * @file_path: /webadb/adb/src/auth.js
 */
import { PromiseResolver } from './async-operation-manager/index';
import { calculatePublicKey, calculatePublicKeyLength, sign } from './crypto';
import { AdbCommand } from './packet';
import { calculateBase64EncodedLength, encodeBase64 } from './utils/index';
export var AdbAuthType;
(function (AdbAuthType) {
    AdbAuthType[AdbAuthType["Token"] = 1] = "Token";
    AdbAuthType[AdbAuthType["Signature"] = 2] = "Signature";
    AdbAuthType[AdbAuthType["PublicKey"] = 3] = "PublicKey";
})(AdbAuthType || (AdbAuthType = {}));
export const AdbSignatureAuthenticator = async function* (backend, getNextRequest) {
    for await (const key of backend.iterateKeys()) {
        const packet = await getNextRequest();
        if (packet.arg0 !== AdbAuthType.Token) {
            return;
        }
        const signature = sign(key, packet.payload);
        yield {
            command: AdbCommand.Auth,
            arg0: AdbAuthType.Signature,
            arg1: 0,
            payload: signature,
        };
    }
};
export const AdbPublicKeyAuthenticator = async function* (backend, getNextRequest) {
    const packet = await getNextRequest();
    if (packet.arg0 !== AdbAuthType.Token) {
        return;
    }
    let privateKey;
    for await (const key of backend.iterateKeys()) {
        privateKey = key;
        break;
    }
    if (!privateKey) {
        privateKey = await backend.generateKey();
    }
    const publicKeyLength = calculatePublicKeyLength();
    const [publicKeyBase64Length] = calculateBase64EncodedLength(publicKeyLength);
    // The public key is null terminated,
    // So we allocate the buffer with one extra byte.
    const publicKeyBuffer = new ArrayBuffer(publicKeyBase64Length + 1);
    calculatePublicKey(privateKey, publicKeyBuffer);
    encodeBase64(publicKeyBuffer, 0, publicKeyLength, publicKeyBuffer);
    yield {
        command: AdbCommand.Auth,
        arg0: AdbAuthType.PublicKey,
        arg1: 0,
        payload: publicKeyBuffer
    };
};
export const AdbDefaultAuthenticators = [
    AdbSignatureAuthenticator,
    AdbPublicKeyAuthenticator
];
export class AdbAuthenticationHandler {
    constructor(authenticators, backend) {
        this.pendingRequest = new PromiseResolver();
        this.getNextRequest = () => {
            return this.pendingRequest.promise;
        };
        this.authenticators = authenticators;
        this.backend = backend;
    }
    async *runAuthenticator() {
        for (const authenticator of this.authenticators) {
            for await (const packet of authenticator(this.backend, this.getNextRequest)) {
                // If the authenticator yielded a response
                // Prepare `nextRequest` for next authentication request
                this.pendingRequest = new PromiseResolver();
                // Yield the response to outer layer
                yield packet;
            }
            // If the authenticator returned,
            // Next authenticator will be given the same `pendingRequest`
        }
        throw new Error('Cannot authenticate with device');
    }
    async handle(packet) {
        if (!this.iterator) {
            this.iterator = this.runAuthenticator();
        }
        this.pendingRequest.resolve(packet);
        const result = await this.iterator.next();
        return result.value;
    }
    dispose() {
        var _a, _b;
        (_b = (_a = this.iterator) === null || _a === void 0 ? void 0 : _a.return) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
}
//# sourceMappingURL=auth.js.map