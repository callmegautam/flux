import semver from 'semver';
import { readPackageJson } from '../utils/fileSystem.js';
import { getMetadata } from '../cache/metadata.js';
import { selectVersion } from '../resolver/resolve.js';
import { getErrorMessage } from '../utils/errors.js';
import { mapLimit } from '../utils/limit.js';
import { config } from '../config.js';
import logger from '../utils/logger.js';
import { checkIfAnyPackagesExist } from '../utils/packageJson.js';

export const outdated = async (): Promise<void> => {
    try {
        await checkIfAnyPackagesExist();
        const packageJson = await readPackageJson();

        const entries = [
            ...Object.entries(packageJson.dependencies),
            ...Object.entries(packageJson.devDependencies),
        ];

        const results = await mapLimit(entries, config.networkConcurrency, async ([name, range]) => {
            try {
                const packument = await getMetadata(name);
                const latest = selectVersion(packument, 'latest');
                const current = selectVersion(packument, range);
                return { name, range, current, latest };
            } catch (error) {
                logger.warning(`Could not check ${name}: ${getErrorMessage(error)}`);
                return null;
            }
        });

        let isAnyUpdate = false;

        for (const result of results) {
            if (!result) continue;
            if (semver.eq(result.current, result.latest)) continue;
            logger.info(`${result.name}  ${result.range} (${result.current}) -> ${result.latest}`);
            isAnyUpdate = true;
        }

        if (!isAnyUpdate) logger.info('All packages are up to date.');
    } catch (error) {
        logger.error(`Error while listing outdated packages: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};
