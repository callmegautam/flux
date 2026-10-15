import fs from 'fs';
import path from 'path';
import { readPackageJson } from '../utils/fileSystem.js';
import { resolve } from '../resolver/resolve.js';
import { linkGraph } from '../store/linker.js';
import { materialize } from '../store/materialize.js';
import {
    buildLockfile,
    graphFromLockfile,
    isLockfileCurrent,
    readLockfile,
    writeLockfile,
} from '../lockfile.js';

export const relinkProject = async (projectDir: string = process.cwd()): Promise<void> => {
    const packageJson = await readPackageJson(projectDir);
    const dependencies = packageJson.dependencies ?? {};
    const devDependencies = packageJson.devDependencies ?? {};

    const roots = [
        ...Object.entries(dependencies),
        ...Object.entries(devDependencies).filter(([name]) => !(name in dependencies)),
    ].map(([name, range]) => ({ name, range }));

    if (roots.length === 0) {
        await fs.promises.rm(path.join(projectDir, 'node_modules'), {
            recursive: true,
            force: true,
        });
        await writeLockfile(
            projectDir,
            buildLockfile({ roots: {}, packages: new Map() }, dependencies, devDependencies)
        );
        return;
    }

    const lockfile = await readLockfile(projectDir);
    const graph =
        lockfile && isLockfileCurrent(lockfile, dependencies, devDependencies)
            ? graphFromLockfile(lockfile)
            : await resolve(roots);

    await materialize(graph);

    await linkGraph(projectDir, graph);
    await writeLockfile(projectDir, buildLockfile(graph, dependencies, devDependencies));
};
