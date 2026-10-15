import semver from 'semver';
import { readPackageJson } from '../utils/fileSystem.js';
import { getMetadata } from '../cache/metadata.js';
import { selectVersion } from '../resolver/resolve.js';
import { getErrorMessage } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { checkIfPackageExists } from '../utils/packageJson.js';
import { install } from './install.js';

const currentPinned = (range: string): string | null => semver.valid(range.replace(/^[\^~]/, ''));

export const update = async (packageName: string | null): Promise<void> => {
    try {
        if (packageName === null) {
            await checkIfPackageExists();
            const { dependencies, devDependencies } = await readPackageJson();
            const names = [...new Set([...Object.keys(dependencies), ...Object.keys(devDependencies)])];

            logger.info(`Updating all ${names.length} packages...`);

            for (const name of names) {
                try {
                    await update(name);
                } catch (error) {
                    logger.error(`Failed to update ${name}: ${getErrorMessage(error)}`);
                }
            }

            logger.info('All packages update process completed.');
            return;
        }

        await checkIfPackageExists(packageName);

        const packument = await getMetadata(packageName);
        const latestVersion = selectVersion(packument, 'latest');

        const packageJson = await readPackageJson();
        const currentRange =
            packageJson.dependencies[packageName] ?? packageJson.devDependencies[packageName] ?? '';
        const pinned = currentPinned(currentRange);

        if (pinned === latestVersion) {
            logger.info(`Package ${packageName}@${latestVersion} is already up to date.`);
            return;
        }

        logger.info(`Updating '${packageName}' from ${currentRange} to ^${latestVersion} ...`);
        await install(`${packageName}@^${latestVersion}`);
    } catch (error) {
        logger.error(`Error while updating package: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};
