import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';
import { readPackageJson } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import { checkIfPackageExists } from '../utils/packageJson.js';
import { install } from './install.js';
import { uninstall } from './uninstall.js';

export const update = async (packageName) => {
    try {
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
        // await uninstall(packageName);
        await install(packageName);
        logger.success(`Package ${packageName}@${latestVersion} updated successfully.`);
    } catch (error) {
        logger.error(`Error while updating package: ${error.message}`);
        process.exit(1);
    }
};
