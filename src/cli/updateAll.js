// import { readPackageJson } from '../utils/fileSystem.js';
// import logger from '../utils/logger.js';
// import { checkIfAnyPackagesExist } from '../utils/packageJson.js';
// import { update } from './update.js';

// export const updateAll = async () => {
//     try {
//         await checkIfAnyPackagesExist();
//         const packageJson = await readPackageJson();
//         const dependencies = packageJson.dependencies;
//         logger.info('Updating all packages...');
//         for (const dependency in dependencies) {
//             await update(dependency);
//         }
//         logger.info('All packages updated successfully.');
//     } catch (error) {
//         logger.error(`Error while updating all packages: ${error}`);
//         process.exit(1);
//     }
// };

import { readPackageJson } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import { checkIfAnyPackagesExist } from '../utils/packageJson.js';
import { update } from './update.js';

export const updateAll = async () => {
    try {
        await checkIfAnyPackagesExist();
        const packageJson = await readPackageJson();
        const dependencies = packageJson.dependencies;
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
    } catch (error) {
        logger.error(`Error while updating all packages: ${error}`);
        process.exit(1);
    }
};
