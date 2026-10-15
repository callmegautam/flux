import semver from 'semver';
import { readPackageJson, writePackageJson } from '../utils/fileSystem.js';
import { getErrorMessage } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { parseSpecifier, resolve } from '../resolver/resolve.js';
import type { RootRequest } from '../resolver/resolve.js';
import { materialize } from '../store/materialize.js';
import { linkGraph } from '../store/linker.js';
import {
    buildLockfile,
    graphFromLockfile,
    isLockfileCurrent,
    readLockfile,
    writeLockfile,
} from '../lockfile.js';

export interface InstallOptions {
    isFlux?: boolean;
    projectDir?: string;
    offline?: boolean;
    dev?: boolean;
}

const preferredRange = (requested: string, version: string): string => {
    if (requested === 'latest' || requested === '*' || requested === '') return `^${version}`;
    return requested;
};

const toRoots = (
    dependencies: Record<string, string>,
    devDependencies: Record<string, string>
): RootRequest[] => {
    const merged = new Map<string, string>();
    for (const [name, range] of Object.entries(dependencies)) merged.set(name, range);
    for (const [name, range] of Object.entries(devDependencies)) {
        if (!merged.has(name)) merged.set(name, range);
    }
    return [...merged].map(([name, range]) => ({ name, range }));
};

export const install = async (
    packageName: string | null,
    customVersion: string | null = null,
    isFluxOrOptions: boolean | InstallOptions = false
): Promise<void> => {
    const options: InstallOptions =
        typeof isFluxOrOptions === 'boolean' ? { isFlux: isFluxOrOptions } : isFluxOrOptions;
    const projectDir = options.projectDir ?? process.cwd();
    const isFlux = options.isFlux ?? false;

    try {
        const packageJson = await readPackageJson();
        const dependencies = { ...packageJson.dependencies };
        const devDependencies = { ...packageJson.devDependencies };

        let requestedName: string | null = null;

        if (packageName !== null) {
            const parsed = parseSpecifier(packageName);
            requestedName = parsed.name;
            const range = customVersion ?? parsed.range;
            if (options.dev) devDependencies[parsed.name] = range;
            else dependencies[parsed.name] = range;
        }

        const roots = toRoots(dependencies, devDependencies);

        if (roots.length === 0) {
            logger.info('No dependencies found in package.json. Nothing to install.');
            return;
        }

        const lockfile = await readLockfile(projectDir);
        const reusable =
            requestedName === null &&
            lockfile !== null &&
            isLockfileCurrent(lockfile, dependencies, devDependencies);

        const graph = reusable
            ? graphFromLockfile(lockfile)
            : await resolve(roots, { offline: options.offline });

        if (reusable) logger.info('Using flux-lock.json (resolution skipped).');

        await materialize(graph, { useFluxRegistry: isFlux });
        const result = await linkGraph(projectDir, graph);

        if (requestedName !== null) {
            const rootId = graph.roots[requestedName];
            const resolved = rootId ? graph.packages.get(rootId) : undefined;

            if (resolved) {
                const target = options.dev ? devDependencies : dependencies;
                const requested = target[requestedName] ?? 'latest';
                target[requestedName] = preferredRange(requested, resolved.version);
                logger.success(`Package ${resolved.name}@${resolved.version} installed successfully.`);
            }
        } else {
            logger.success(
                `Installed ${graph.packages.size} package(s) (${result.imported} newly linked from store).`
            );
        }

        packageJson.dependencies = dependencies;
        packageJson.devDependencies = devDependencies;
        await writePackageJson(packageJson);
        await writeLockfile(projectDir, buildLockfile(graph, dependencies, devDependencies));
    } catch (error) {
        logger.error(`Error while installing package: ${getErrorMessage(error)}`);
        process.exit(1);
    }
};

export const satisfies = (version: string, range: string): boolean =>
    semver.satisfies(version, range, { loose: true, includePrerelease: range.includes('-') });
