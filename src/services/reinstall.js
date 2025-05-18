import { removePackageFromModule } from '../utils/fileSystem.js';
import { checkIfPackageExists } from '../utils/packageJson.js';
import { install } from './install.js';
import logger from '../utils/logger.js';

export const reinstall = async (packageName) => {
    try {
        await checkIfPackageExists(packageName);
        logger.info(`Reinstalling ${packageName}...`);
        await removePackageFromModule(packageName);
        await install(packageName);
    } catch (error) {
        logger.error(`Error while reinstalling package: ${error.message}`);
        process.exit(1);
    }
};
