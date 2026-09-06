import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';
import logger from '../utils/logger.js';
import type { NpmPackument } from '../types/npm.js';

const authorName = (author: NpmPackument['author']): string => {
    if (typeof author === 'string') return author;
    return author?.name ?? 'unknown';
};

export const info = async (packageName: string): Promise<void> => {
    const packageInfo = await fetchPackageInformation(packageName);
    if (!packageInfo) {
        logger.error(`Package ${packageName} not found.`);
        process.exit(1);
    }
    console.log(`\n${packageName}`);
    console.log(`Version: ${packageInfo['dist-tags'].latest}`);
    console.log(`Description: ${packageInfo.description ?? ''}`);
    console.log(`Author: ${authorName(packageInfo.author)}`);
    console.log(`License: ${packageInfo.license ?? 'unknown'}`);
    console.log(`Published: ${packageInfo.time.created}`);
    console.log(`Updated: ${packageInfo.time.modified}`);
};
