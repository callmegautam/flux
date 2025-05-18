import fs from 'fs';
import logger from '../utils/logger.js';
import { config } from '../config.js';

export const clearCache = async () => {
    try {
        await fs.promises.rm(config.cachePath, { recursive: true, force: true });
        logger.success('Cache cleared successfully.');
    } catch (error) {
        logger.error(`Error while clearing cache: ${error}`);
        process.exit(1);
    }
};
