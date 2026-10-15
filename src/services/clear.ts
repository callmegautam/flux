import { cacheClean } from './cache.js';

export const clearCache = async (): Promise<void> => {
    await cacheClean({ all: true });
};
