import path from 'path';
import { readPackageJson, writePackageJson } from '../utils/fileSystem.js';
import logger from '../utils/logger.js';

export const init = async () => {
    const dirName = path.basename(process.cwd());

    let existing = await readPackageJson();

    const updated = {
        name: dirName,
        version: '1.0.0',
        description: '',
        main: 'index.js',
        scripts: {
            test: 'echo "Error: no test specified" && exit 1',
        },
        keywords: [],
        license: 'ISC',
    };

    const merged = {
        ...updated,
        ...existing,
    };

    await writePackageJson(merged);

    logger.success('Project initialized successfully.');
    console.log(merged);
};
