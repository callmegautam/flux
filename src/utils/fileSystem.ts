import fs from 'fs';
import path from 'path';
import logger from './logger.js';
import { getErrorMessage } from './errors.js';
import { writeFileAtomic } from '../store/atomic.js';
import { unlinkRoot } from '../store/linker.js';
import type { PackageJson } from '../types/package-json.js';

export const packageJsonPathIn = (projectDir: string = process.cwd()): string =>
    path.join(projectDir, 'package.json');

export const readPackageJson = async (projectDir?: string): Promise<PackageJson> => {
    const target = packageJsonPathIn(projectDir);

    try {
        const fileContent = await fs.promises.readFile(target, 'utf8');
        const packageData = JSON.parse(fileContent) as PackageJson;
        return {
            ...packageData,
            dependencies: packageData.dependencies || {},
            devDependencies: packageData.devDependencies || {},
        };
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            await writeFileAtomic(target, `${JSON.stringify({ dependencies: {} }, null, 2)}\n`);
            return { dependencies: {}, devDependencies: {} };
        }
        logger.error(`Error while reading package.json: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};

export const writePackageJson = async (
    packageData: PackageJson,
    projectDir?: string
): Promise<void> => {
    try {
        const serializable: Record<string, unknown> = { ...packageData };

        if (Object.keys(packageData.devDependencies ?? {}).length === 0) {
            delete serializable['devDependencies'];
        }

        await writeFileAtomic(
            packageJsonPathIn(projectDir),
            `${JSON.stringify(serializable, null, 2)}\n`
        );
    } catch (error) {
        logger.error(`Error while writing package.json: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};

export const removePackageFromModule = async (
    packageName: string,
    projectDir: string = process.cwd()
): Promise<void> => {
    try {
        await unlinkRoot(projectDir, packageName);
    } catch (error) {
        logger.error(`Error while deleting package: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};
