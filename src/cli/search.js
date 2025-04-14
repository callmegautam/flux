import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';
import logger from '../utils/logger.js';

export const search = async (packageName) => {
    try {
        const data = await fetchPackageInformation(packageName);
        if (!data) {
            logger.error(`${packageName} does not exists.`);
            process.exit(1);
        }
        const description = data['description'];
        const latestVersion = data['dist-tags'].latest;

        logger.info(`${packageName} @ ${latestVersion} - ${description}`);
    } catch (error) {
        logger.error('Error while fetching data...');
    }
};
