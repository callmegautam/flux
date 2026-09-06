import { readPackageJson } from '../utils/fileSystem.js';
import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';
import logger from '../utils/logger.js';
import { checkIfAnyPackagesExist } from '../utils/packageJson.js';

export const outdated = async (): Promise<void> => {
    try {
        await checkIfAnyPackagesExist();
        let isAnyUpdate = false;
        const packageJson = await readPackageJson();

        for (const [packageName, currentVersion] of Object.entries(packageJson.dependencies)) {
            const packageInfo = await fetchPackageInformation(packageName);
            const latestVersion = packageInfo['dist-tags'].latest;

            if (currentVersion !== latestVersion) {
                logger.info(`${packageName}@${currentVersion} -> ${packageName}@${latestVersion}`);
                isAnyUpdate = true;
            }
        }

        if (!isAnyUpdate) {
            logger.info('All packages are up to date.');
        }
    } catch (error) {
        logger.error(`Error while listing outdated packages: ${error}`);
        process.exit(1);
    }
};
