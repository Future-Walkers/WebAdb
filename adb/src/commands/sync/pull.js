/*
 * @title: todo
 * @author: Rodney Cheung
 * @date: 2020-12-26 13:10:42
 * @last_author: Rodney Cheung
 * @last_edit_time: 2020-12-28 17:26:01
 */
import { Struct } from '../../struct/index.js';
import { AdbSyncRequestId, adbSyncWriteRequest } from './request';
import { AdbSyncDoneResponse, adbSyncReadResponse, AdbSyncResponseId } from './response';
export const AdbSyncDataResponse = new Struct({ littleEndian: true })
    .uint32('dataLength')
    .arrayBuffer('data', { lengthField: 'dataLength' })
    .extra({ id: AdbSyncResponseId.Data });
const ResponseTypes = {
    [AdbSyncResponseId.Data]: AdbSyncDataResponse,
    [AdbSyncResponseId.Done]: new AdbSyncDoneResponse(AdbSyncDataResponse.size),
};
export async function* adbSyncPull(stream, path) {
    await adbSyncWriteRequest(stream, AdbSyncRequestId.Receive, path);
    while (true) {
        const response = await adbSyncReadResponse(stream, ResponseTypes);
        switch (response.id) {
            case AdbSyncResponseId.Data:
                yield response.data;
                break;
            case AdbSyncResponseId.Done:
                return;
            default:
                throw new Error('Unexpected response id');
        }
    }
}
//# sourceMappingURL=pull.js.map