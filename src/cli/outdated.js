import { readPackageJson } from '../utils/fileSystem.js';
import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';
import logger from '../utils/logger.js';
import { checkIfAnyPackagesExist } from '../utils/packageJson.js';

export const outdated = async () => {
    try {
        await checkIfAnyPackagesExist();
        let isAnyUpdate = false;
        const packageJson = await readPackageJson();

        Object.keys(packageJson.dependencies).forEach(async (packageName) => {
            const packageInfo = await fetchPackageInformation(packageName);
            const latestVersion = packageInfo['dist-tags'].latest;
            const currentVersion = packageJson.dependencies[packageName];

            if (currentVersion != latestVersion) {
                logger.info(
                    `${packageName}@${packageJson.dependencies[packageName]} -> ${packageName}@${latestVersion}`
                );
                isAnyUpdate = true;
            }
        });

        if (!isAnyUpdate) {
            logger.info('All packages are up to date.');
        }
    } catch (error) {
        logger.error(`Error while listing outdated packages: ${error}`);
        process.exit(1);
    }
};
