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
            console.log("[VersionCheck] Iniciando... Versión actual:", this.getCurrentVersion());
            await fetchAndActivate(remoteConfig);

            const latestRaw = getValue(remoteConfig, 'android_latest_version').asString();
            const minRaw = getValue(remoteConfig, 'android_min_version').asString();
            const updateUrl = getValue(remoteConfig, 'android_update_url').asString() || 'https://play.google.com/store/apps/details?id=com.tradingcoach.app';

            console.log("[VersionCheck] Firebase devolvió -> Latest:", latestRaw, "Min:", minRaw);

            const current = this.getCurrentVersion();
            const latestVersion = latestRaw || '1.4.0';
            const minVersion = minRaw || '1.4.0';

            const res = {
                latestVersion,
                minVersion,
                isUpdateRequired: this.compareVersions(current, minVersion) < 0,
                isUpdateAvailable: this.compareVersions(current, latestVersion) < 0,
                updateUrl
            };

            console.log("[VersionCheck] Resultado final:", res);
            return res;
        } catch (error) {
            console.error("[VersionCheck] Error:", error);
            return {
                latestVersion: '1.4.0',
                minVersion: '1.4.0',
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
