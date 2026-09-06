import { readPackageJson, removePackageFromModule } from '../utils/fileSystem.js';
import { checkIfPackageExists } from '../utils/packageJson.js';
import { install } from './install.js';
import { getErrorMessage } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const reinstall = async (packageName: string | null): Promise<void> => {
    try {
        if (packageName === null) {
            await checkIfPackageExists();
            const { dependencies } = await readPackageJson();
            for (const dependency in dependencies) {
                await reinstall(dependency);
            }
            logger.info('All packages reinstalled successfully.');
            return;
        }
        await checkIfPackageExists(packageName);
        logger.info(`Reinstalling ${packageName}...`);
        await removePackageFromModule(packageName);
        await install(packageName);
    } catch (error) {
        logger.error(`Error while reinstalling package: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};
