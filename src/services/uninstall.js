import { readPackageJson, removePackageFromModule } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import {
    checkIfPackageExists,
    removePackageFromJson,
} from '../utils/packageJson.js';

export const uninstall = async (packageName) => {
    try {
        if (packageName === null) {
            await checkIfPackageExists();
            const { dependencies } = await readPackageJson();
            logger.info('Uninstalling all packages...');
            for (const dependency in dependencies) {
                await uninstall(dependency);
            }
            logger.info('All packages uninstalled successfully.');
            process.exit(1);
        }
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
