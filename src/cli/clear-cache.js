import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';

const currentDir = process.cwd();
const dirve = currentDir.slice(0, 2);
const storePath = path.join(dirve, '.flux-store');

export const clearCache = async () => {
    try {
        await fs.promises.rm(storePath, { recursive: true, force: true });
    } catch (error) {
        logger.error(`Error while clearing cache: ${error}`);
        process.exit(1);
    }
};
