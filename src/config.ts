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

export const config = {
    registry: 'https://registry.npmjs.org/',
    cachePath: resolveCachePath(),
    backendAPI: 'http://api.gautamsuthar.in/flux/api/v1',
};
