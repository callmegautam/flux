import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { writeFileAtomic } from './store/atomic.js';
import type { ResolutionGraph, ResolvedPackage } from './resolver/resolve.js';
import type { PackageBin } from './types/npm.js';

export const LOCKFILE_VERSION = 1;

export interface LockfileEntry {
    resolution: { tarball: string; integrity: string };
    dependencies?: Record<string, string>;
    bin?: PackageBin;
    optional?: boolean;
}

export interface Lockfile {
    lockfileVersion: number;
    importers: {
        '.': {
            dependencies: Record<string, string>;
            devDependencies: Record<string, string>;
        };
    };
    roots: Record<string, string>;
    packages: Record<string, LockfileEntry>;
}

export const lockfilePath = (projectDir: string): string =>
    path.join(projectDir, config.lockfileName);

export const readLockfile = async (projectDir: string): Promise<Lockfile | null> => {
    try {
        const raw = await fs.promises.readFile(lockfilePath(projectDir), 'utf8');
        const parsed = JSON.parse(raw) as Lockfile;
        if (parsed.lockfileVersion !== LOCKFILE_VERSION) return null;
        if (!parsed.packages || !parsed.roots || !parsed.importers?.['.']) return null;
        return parsed;
    } catch {
        return null;
    }
};

export const buildLockfile = (
    graph: ResolutionGraph,
    dependencies: Record<string, string>,
    devDependencies: Record<string, string>
): Lockfile => {
    const packages: Record<string, LockfileEntry> = {};

    for (const id of [...graph.packages.keys()].sort()) {
        const pkg = graph.packages.get(id) as ResolvedPackage;
        const entry: LockfileEntry = {
            resolution: { tarball: pkg.tarball, integrity: pkg.integrity },
        };
        if (Object.keys(pkg.dependencies).length > 0) {
            entry.dependencies = Object.fromEntries(
                Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b))
            );
        }
        if (pkg.bin !== undefined) entry.bin = pkg.bin;
        if (pkg.optional) entry.optional = true;
        packages[id] = entry;
    }

    const sortRecord = (record: Record<string, string>): Record<string, string> =>
        Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));

    return {
        lockfileVersion: LOCKFILE_VERSION,
        importers: {
            '.': {
                dependencies: sortRecord(dependencies),
                devDependencies: sortRecord(devDependencies),
            },
        },
        roots: sortRecord(graph.roots),
        packages,
    };
};

export const writeLockfile = async (projectDir: string, lockfile: Lockfile): Promise<void> => {
    await writeFileAtomic(lockfilePath(projectDir), `${JSON.stringify(lockfile, null, 2)}\n`);
};

const sameRecord = (a: Record<string, string>, b: Record<string, string>): boolean => {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key, index) => bKeys[index] === key && a[key] === b[key]);
};

export const isLockfileCurrent = (
    lockfile: Lockfile,
    dependencies: Record<string, string>,
    devDependencies: Record<string, string>
): boolean => {
    const importer = lockfile.importers['.'];
    if (!sameRecord(importer.dependencies, dependencies)) return false;
    if (!sameRecord(importer.devDependencies ?? {}, devDependencies)) return false;

    for (const id of Object.values(lockfile.roots)) {
        if (!lockfile.packages[id]) return false;
    }

    for (const entry of Object.values(lockfile.packages)) {
        for (const depId of Object.values(entry.dependencies ?? {})) {
            if (!lockfile.packages[depId]) return false;
        }
    }

    return true;
};

export const graphFromLockfile = (lockfile: Lockfile): ResolutionGraph => {
    const packages = new Map<string, ResolvedPackage>();

    for (const [id, entry] of Object.entries(lockfile.packages)) {
        const separator = id.lastIndexOf('@');
        const name = id.slice(0, separator);
        const version = id.slice(separator + 1);

        packages.set(id, {
            id,
            name,
            version,
            tarball: entry.resolution.tarball,
            integrity: entry.resolution.integrity,
            bin: entry.bin,
            dependencies: { ...(entry.dependencies ?? {}) },
            optional: entry.optional ?? false,
        });
    }

    return { roots: { ...lockfile.roots }, packages };
};
