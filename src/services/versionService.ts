import { remoteConfig, fetchAndActivate, getValue } from './firebase';
import packageJson from '../../package.json';

export interface VersionInfo {
    latestVersion: string;
    minVersion: string;
    isUpdateRequired: boolean;
    isUpdateAvailable: boolean;
    updateUrl: string;
}

export const VersionService = {
    getCurrentVersion(): string {
        return packageJson.version;
    },

    async checkVersion(): Promise<VersionInfo> {
        try {
            await fetchAndActivate(remoteConfig);

            const latestVersion = getValue(remoteConfig, 'android_latest_version').asString() || '1.1.0';
            const minVersion = getValue(remoteConfig, 'android_min_version').asString() || '1.1.0';
            const updateUrl = getValue(remoteConfig, 'android_update_url').asString() || 'https://play.google.com/store/apps/details?id=com.tradingcoach.app';

            const current = this.getCurrentVersion();

            return {
                latestVersion,
                minVersion,
                isUpdateRequired: this.compareVersions(current, minVersion) < 0,
                isUpdateAvailable: this.compareVersions(current, latestVersion) < 0,
                updateUrl
            };
        } catch (error) {
            console.error("Error checking version:", error);
            return {
                latestVersion: '1.1.0',
                minVersion: '1.1.0',
                isUpdateRequired: false,
                isUpdateAvailable: false,
                updateUrl: ''
            };
        }
    },

    /**
     * Compare two version strings.
     * Returns 1 if v1 > v2
     * Returns -1 if v1 < v2
     * Returns 0 if v1 == v2
     */
    compareVersions(v1: string, v2: string): number {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        return 0;
    }
};
