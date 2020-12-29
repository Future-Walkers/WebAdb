import { AdbCommandBase } from './base';
export var AdbDemoModeWifiSignalStrength;
(function (AdbDemoModeWifiSignalStrength) {
    AdbDemoModeWifiSignalStrength["Hidden"] = "null";
    AdbDemoModeWifiSignalStrength["Level0"] = "0";
    AdbDemoModeWifiSignalStrength["Level1"] = "1";
    AdbDemoModeWifiSignalStrength["Level2"] = "2";
    AdbDemoModeWifiSignalStrength["Level3"] = "3";
    AdbDemoModeWifiSignalStrength["Level4"] = "4";
})(AdbDemoModeWifiSignalStrength || (AdbDemoModeWifiSignalStrength = {}));
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/packages/SystemUI/src/com/android/systemui/statusbar/policy/NetworkControllerImpl.java;l=1073
export const AdbDemoModeMobileDataTypes = ['1x', '3g', '4g', '4g+', '5g', '5ge', '5g+',
    'e', 'g', 'h', 'h+', 'lte', 'lte+', 'dis', 'not', 'null'];
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/packages/SystemUI/src/com/android/systemui/statusbar/phone/StatusBar.java;l=3136
export const AdbDemoModeStatusBarModes = ['opaque', 'translucent', 'semi-transparent', 'transparent', 'warning'];
export class AdbDemoMode extends AdbCommandBase {
    async getAllowed() {
        const result = await this.adb.exec('settings', 'get', 'global', AdbDemoMode.AllowedSettingKey);
        return result.trim() === '1';
    }
    async setAllowed(value) {
        if (value) {
            await this.adb.exec('settings', 'put', 'global', AdbDemoMode.AllowedSettingKey, '1');
        }
        else {
            await this.setEnabled(false);
            await this.adb.exec('settings', 'delete', 'global', AdbDemoMode.AllowedSettingKey);
        }
    }
    async getEnabled() {
        const result = await this.adb.exec('settings', 'get', 'global', AdbDemoMode.EnabledSettingKey);
        return result.trim() === '1';
    }
    async setEnabled(value) {
        if (value) {
            await this.adb.exec('settings', 'put', 'global', AdbDemoMode.EnabledSettingKey, '1');
        }
        else {
            await this.adb.exec('settings', 'delete', 'global', AdbDemoMode.EnabledSettingKey);
            await this.broadcast('exit');
        }
    }
    async broadcast(command, extra) {
        await this.adb.exec('am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', command, ...(extra ? Object.entries(extra).flatMap(([key, value]) => ['-e', key, value]) : []));
    }
    async setBatteryLevel(level) {
        await this.broadcast('battery', { level: level.toString() });
    }
    async setBatteryCharging(value) {
        await this.broadcast('battery', { plugged: value.toString() });
    }
    async setPowerSaveMode(value) {
        await this.broadcast('battery', { powersave: value.toString() });
    }
    async setAirplaneMode(show) {
        await this.broadcast('network', { airplane: show ? 'show' : 'hide' });
    }
    async setWifiSignalStrength(value) {
        await this.broadcast('network', { wifi: 'show', level: value });
    }
    async setMobileDataType(value) {
        for (let i = 0; i < 2; i += 1) {
            await this.broadcast('network', {
                mobile: 'show',
                sims: '1',
                nosim: 'hide',
                slot: '0',
                datatype: value,
                fully: 'true',
                roam: 'false',
                level: '4',
                inflate: 'false',
                activity: 'in',
                carriernetworkchange: 'hide',
            });
        }
    }
    async setMobileSignalStrength(value) {
        await this.broadcast('network', { mobile: 'show', level: value });
    }
    async setNoSimCardIcon(show) {
        await this.broadcast('network', { nosim: show ? 'show' : 'hide' });
    }
    async setStatusBarMode(mode) {
        await this.broadcast('bars', { mode });
    }
    async setVibrateModeEnabled(value) {
        // https://cs.android.com/android/platform/superproject/+/master:frameworks/base/packages/SystemUI/src/com/android/systemui/statusbar/phone/DemoStatusIcons.java;l=103
        await this.broadcast('status', { volume: value ? 'vibrate' : 'hide' });
    }
    async setBluetoothConnected(value) {
        // https://cs.android.com/android/platform/superproject/+/master:frameworks/base/packages/SystemUI/src/com/android/systemui/statusbar/phone/DemoStatusIcons.java;l=114
        await this.broadcast('status', { bluetooth: value ? 'connected' : 'hide' });
    }
    async setLocatingIcon(show) {
        await this.broadcast('status', { location: show ? 'show' : 'hide' });
    }
    async setAlarmIcon(show) {
        await this.broadcast('status', { alarm: show ? 'show' : 'hide' });
    }
    async setSyncingIcon(show) {
        await this.broadcast('status', { sync: show ? 'show' : 'hide' });
    }
    async setMuteIcon(show) {
        await this.broadcast('status', { mute: show ? 'show' : 'hide' });
    }
    async setSpeakerPhoneIcon(show) {
        await this.broadcast('status', { speakerphone: show ? 'show' : 'hide' });
    }
    async setNotificationsVisibility(show) {
        // https://cs.android.com/android/platform/superproject/+/master:frameworks/base/packages/SystemUI/src/com/android/systemui/statusbar/phone/StatusBar.java;l=3131
        await this.broadcast('notifications', { visible: show.toString() });
    }
    async setTime(hour, minute) {
        await this.broadcast('clock', { hhmm: `${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}` });
    }
}
AdbDemoMode.AllowedSettingKey = 'sysui_demo_allowed';
// Demo Mode actually doesn't have a setting indicates its enablement
// However Developer Mode menu uses this key
// So we can only try our best to guess if it's enabled
AdbDemoMode.EnabledSettingKey = 'sysui_tuner_demo_on';
//# sourceMappingURL=demo-mode.js.map