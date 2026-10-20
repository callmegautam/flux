import os from 'os';
import path from 'path';

const resolveCachePath = (): string => {
    const override = process.env.FLUX_CACHE_DIR;
    if (override) return path.resolve(override);

    const home = os.homedir();

    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
        return path.join(localAppData, 'flux', 'Cache');
    }

    if (process.platform === 'darwin') {
        return path.join(home, 'Library', 'Caches', 'flux');
    }

    const xdgCache = process.env.XDG_CACHE_HOME || path.join(home, '.cache');
    return path.join(xdgCache, 'flux');
};

const resolveNetworkConcurrency = (): number => {
    const raw = Number(process.env.FLUX_NETWORK_CONCURRENCY);
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 16;
};

const resolveFsConcurrency = (): number => {
    const raw = Number(process.env.FLUX_FS_CONCURRENCY);
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 32;
};

export const config = {
    registry: 'https://registry.npmjs.org/',
    backendAPI: 'http://api.gautamsuthar.in/flux/api/v1',
    metadataTtlMs: 5 * 60 * 1000,
    lockfileName: 'flux-lock.json',
    virtualStoreDir: '.flux',
    get cachePath(): string {
        return resolveCachePath();
    },
    get networkConcurrency(): number {
        return resolveNetworkConcurrency();
    },
    get fsConcurrency(): number {
        return resolveFsConcurrency();
    },
};
