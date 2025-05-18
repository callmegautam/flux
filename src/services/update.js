import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';
import { readPackageJson } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import { checkIfPackageExists } from '../utils/packageJson.js';
import { install } from './install.js';

export const update = async (packageName) => {
    try {
        if (packageName === null) {
            await checkIfPackageExists();
            const { dependencies } = await readPackageJson();
            const packageNames = Object.keys(dependencies);

            logger.info(`Updating all ${packageNames.length} packages...`);

            await Promise.all(
                packageNames.map(async (dependency) => {
                    try {
                        await update(dependency);
                    } catch (err) {
                        logger.error(`Failed to update ${dependency}: ${err.message}`);
                    }
                })
            );

            logger.info('All packages update process completed.');
        }

        await checkIfPackageExists(packageName);
        const data = await fetchPackageInformation(packageName);
        const latestVersion = data['dist-tags'].latest;
        const packageJson = await readPackageJson();
        const currentVersion = packageJson.dependencies[packageName];
        if (currentVersion == latestVersion) {
            logger.info(`Package ${packageName}@${latestVersion} is already up to date.`);
            return;
        }
        logger.info(`Updating '${packageName}' from v${currentVersion} ➝ v${latestVersion} ...`);
        await install(packageName);
        logger.success(`Package ${packageName}@${latestVersion} updated successfully.`);
    } catch (error) {
        logger.error(`Error while updating package: ${error.message}`);
        process.exit(1);
    }
};
