import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';
import logger from '../utils/logger.js';

export const info = async (packageName) => {
    const packageInfo = await fetchPackageInformation(packageName);
    if (!packageInfo) {
        logger.error(`Package ${packageName} not found.`);
        process.exit(1);
    }
    console.log(`\n${packageName}`);
    console.log(`Version: ${packageInfo['dist-tags'].latest}`);
    console.log(`Description: ${packageInfo.description}`);
    console.log(`Author: ${packageInfo.author.name}`);
    console.log(`License: ${packageInfo.license}`);
    console.log(`Published: ${packageInfo.time.created}`);
    console.log(`Updated: ${packageInfo.time.modified}`);
};
