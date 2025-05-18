import { addPackageToJson } from '../utils/packageJson.js';
import { downloadPackage } from '../utils/download-package.js';
import { extractPackage, readPackageJson } from '../utils/fileSystem.js';
import { fetchPackageInformation } from '../utils/fetchPackageInformation.js';
import logger from '../utils/logger.js';

export const install = async (packageName, customVersion = null) => {
    try {
        if (packageName === null) {
            const packageJson = await readPackageJson();

            if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
                for (const [packageName, version] of Object.entries(packageJson.dependencies)) {
                    if (version.startsWith('^')) {
                        await install(packageName);
                    } else {
                        await install(packageName, version);
                    }
                }
            } else {
                logger.info('No dependencies found in package.json. Nothing to install.');
                process.exit(1);
            }
            return;
        }

        const data = await fetchPackageInformation(packageName);
        const version = customVersion || data['dist-tags'].latest;
        const filePath = await downloadPackage(packageName, version);
        await extractPackage(packageName, filePath);
        await addPackageToJson(packageName, version);
        logger.success(`Package ${packageName}@${version} installed successfully.`);
    } catch (error) {
        logger.error(`Error while installing package: ${error}`);
        process.exit(1);
    }
};
