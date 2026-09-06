import path from 'path';
import { readPackageJson, writePackageJson } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';
import type { PackageJson } from '../types/package-json.js';

export const init = async (): Promise<void> => {
    const dirName = path.basename(process.cwd());

    const existing = await readPackageJson();

    const defaults: PackageJson = {
        name: dirName,
        version: '1.0.0',
        description: '',
        main: 'index.js',
        scripts: {
            test: 'echo "Error: no test specified" && exit 1',
        },
        keywords: [],
        license: 'ISC',
        dependencies: {},
        devDependencies: {},
    };

    const merged: PackageJson = {
        ...defaults,
        ...existing,
    };

    await writePackageJson(merged);

    logger.success('Project initialized successfully.');
    console.log(merged);
};
