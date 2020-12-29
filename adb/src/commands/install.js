import { escapeArg } from "./shell";
export async function install(adb, apk, onProgress) {
    const filename = `/data/local/tmp/${Math.random().toString().substr(2)}.apk`;
    // Upload apk file to tmp folder
    const sync = await adb.sync();
    await sync.write(filename, apk, undefined, undefined, onProgress);
    sync.dispose();
    // Invoke `pm install` to install it
    await adb.exec('pm', 'install', escapeArg(filename));
    // Remove the temp file
    await adb.rm(filename);
}
//# sourceMappingURL=install.js.map