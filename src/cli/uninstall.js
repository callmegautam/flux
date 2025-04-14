import { removePackageFromModule } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import { checkIfPackageExists, removePackageFromJson } from '../utils/packageJson.js';

export const uninstall = async (packageName) => {
    try {
        await checkIfPackageExists(packageName);
        logger.info(`Uninstalling package: ${packageName}...`);
        await removePackageFromJson(packageName);
        await removePackageFromModule(packageName);
        logger.info(`${packageName} uninstalled successfully.`);
    } catch (error) {
        logger.error(`Error while uninstalling package: ${error}`);
        process.exit(1);
    }
};
