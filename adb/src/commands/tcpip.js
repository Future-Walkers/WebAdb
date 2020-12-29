import { AdbCommandBase } from './base';
export class AdbTcpIpCommand extends AdbCommandBase {
    async setPort(port) {
        if (port <= 0) {
            throw new Error(`Invalid port ${port}`);
        }
        const output = await this.adb.createStreamAndReadAll(`tcpip:${port}`);
        if (output !== `restarting in TCP mode port: ${port}\n`) {
            throw new Error('Invalid response');
        }
    }
    async disable() {
        const output = await this.adb.createStreamAndReadAll('usb:');
        if (output !== 'restarting in USB mode\n') {
            throw new Error('Invalid response');
        }
    }
}
//# sourceMappingURL=tcpip.js.map