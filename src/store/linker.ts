import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { packagePath } from './packages.js';
import { pathExists } from './atomic.js';
import { errorCode, getErrorMessage } from '../utils/errors.js';
import { mapLimit } from '../utils/limit.js';
import type { ResolutionGraph, ResolvedPackage } from '../resolver/resolve.js';
import type { PackageBin } from '../types/npm.js';
import logger from '../utils/logger.js';

const isWindows = process.platform === 'win32';
const DIR_LINK_TYPE = isWindows ? 'junction' : 'dir';

let copyFallback = false;

export const resetLinkStrategy = (): void => {
    copyFallback = false;
};

const virtualDirName = (id: string): string => id.replace(/\//g, '+');

export const virtualPackageDir = (nodeModules: string, pkg: ResolvedPackage): string =>
    path.join(nodeModules, config.virtualStoreDir, virtualDirName(pkg.id), 'node_modules', pkg.name);

const virtualNodeModules = (nodeModules: string, pkg: ResolvedPackage): string =>
    path.join(nodeModules, config.virtualStoreDir, virtualDirName(pkg.id), 'node_modules');

const linkFile = async (source: string, target: string): Promise<void> => {
    if (!copyFallback) {
        try {
            await fs.promises.link(source, target);
            return;
        } catch (error) {
            const code = errorCode(error);
            if (code === 'EEXIST') return;
            if (code !== 'EXDEV' && code !== 'EPERM' && code !== 'EMLINK' && code !== 'ENOSYS') {
                throw error;
            }
            copyFallback = true;
        }
    }

    await fs.promises.copyFile(source, target);
};

export const importPackage = async (storeDir: string, targetDir: string): Promise<void> => {
    const entries = await fs.promises.readdir(storeDir, { withFileTypes: true });
    await fs.promises.mkdir(targetDir, { recursive: true });

    await mapLimit(entries, config.fsConcurrency, async (entry) => {
        const source = path.join(storeDir, entry.name);
        const target = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
            await importPackage(source, target);
            return;
        }

        if (entry.isSymbolicLink()) {
            const link = await fs.promises.readlink(source);
            await fs.promises.symlink(link, target).catch((error: unknown) => {
                if (errorCode(error) !== 'EEXIST') throw error;
            });
            return;
        }

        if (entry.isFile()) await linkFile(source, target);
    });
};

const symlinkIfNeeded = async (
    target: string,
    linkPath: string,
    type: 'dir' | 'junction' | 'file'
): Promise<void> => {
    try {
        const current = await fs.promises.readlink(linkPath);
        if (path.resolve(path.dirname(linkPath), current) === path.resolve(path.dirname(linkPath), target)) {
            return;
        }
        await fs.promises.unlink(linkPath);
    } catch (error) {
        const code = errorCode(error);
        if (code === 'EINVAL' || code === 'EISDIR' || code === 'EPERM' || code === 'ENOTDIR') {
            await fs.promises.rm(linkPath, { recursive: true, force: true });
        } else if (code !== 'ENOENT') {
            throw error;
        }
    }

    await fs.promises.mkdir(path.dirname(linkPath), { recursive: true });

    try {
        await fs.promises.symlink(target, linkPath, type);
    } catch (error) {
        if (errorCode(error) !== 'EEXIST') throw error;
    }
};

const binEntries = (pkg: ResolvedPackage, bin: PackageBin | undefined): Array<[string, string]> => {
    if (!bin) return [];
    if (typeof bin === 'string') {
        const shortName = pkg.name.startsWith('@') ? (pkg.name.split('/')[1] ?? pkg.name) : pkg.name;
        return [[shortName, bin]];
    }
    return Object.entries(bin);
};

const readBinField = async (packageDir: string): Promise<PackageBin | undefined> => {
    try {
        const raw = await fs.promises.readFile(path.join(packageDir, 'package.json'), 'utf8');
        return (JSON.parse(raw) as { bin?: PackageBin }).bin;
    } catch {
        return undefined;
    }
};

const writeWindowsShim = async (binDir: string, name: string, target: string): Promise<void> => {
    const relative = path.relative(binDir, target).split(path.sep).join('\\');
    await fs.promises.writeFile(
        path.join(binDir, `${name}.cmd`),
        `@ECHO off\r\nSETLOCAL\r\nnode "%~dp0\\${relative}" %*\r\n`
    );
    await fs.promises.writeFile(
        path.join(binDir, `${name}.ps1`),
        `#!/usr/bin/env pwsh\nnode "$PSScriptRoot/${relative.split('\\').join('/')}" @args\n`
    );
};

const linkBin = async (
    nodeModules: string,
    pkg: ResolvedPackage,
    packageDir: string
): Promise<void> => {
    const bin = pkg.bin ?? (await readBinField(packageDir));
    const entries = binEntries(pkg, bin);
    if (entries.length === 0) return;

    const binDir = path.join(nodeModules, '.bin');
    await fs.promises.mkdir(binDir, { recursive: true });

    for (const [name, relativeTarget] of entries) {
        const absoluteTarget = path.join(packageDir, relativeTarget);
        if (!(await pathExists(absoluteTarget))) continue;

        if (isWindows) {
            await writeWindowsShim(binDir, name, absoluteTarget);
            continue;
        }

        await symlinkIfNeeded(path.relative(binDir, absoluteTarget), path.join(binDir, name), 'file');
        await fs.promises.chmod(absoluteTarget, 0o755).catch(() => undefined);
    }
};

const prune = async (
    nodeModules: string,
    keep: ReadonlySet<string>
): Promise<void> => {
    let entries: fs.Dirent[];
    try {
        entries = await fs.promises.readdir(nodeModules, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        if (entry.name === config.virtualStoreDir || entry.name === '.bin') continue;

        if (entry.name.startsWith('@')) {
            const scopeDir = path.join(nodeModules, entry.name);
            const scoped = await fs.promises.readdir(scopeDir).catch(() => []);
            for (const child of scoped) {
                if (keep.has(`${entry.name}/${child}`)) continue;
                await fs.promises.rm(path.join(scopeDir, child), { recursive: true, force: true });
            }
            const remaining = await fs.promises.readdir(scopeDir).catch(() => ['keep']);
            if (remaining.length === 0) await fs.promises.rm(scopeDir, { recursive: true, force: true });
            continue;
        }

        if (keep.has(entry.name)) continue;
        await fs.promises.rm(path.join(nodeModules, entry.name), { recursive: true, force: true });
    }
};

export interface LinkResult {
    imported: number;
    linked: number;
}

export const linkGraph = async (
    projectDir: string,
    graph: ResolutionGraph
): Promise<LinkResult> => {
    const nodeModules = path.join(projectDir, 'node_modules');
    await fs.promises.mkdir(path.join(nodeModules, config.virtualStoreDir), { recursive: true });

    const packages = [...graph.packages.values()];
    let imported = 0;

    await mapLimit(packages, config.fsConcurrency, async (pkg) => {
        const targetDir = virtualPackageDir(nodeModules, pkg);

        if (!(await pathExists(path.join(targetDir, 'package.json')))) {
            await importPackage(packagePath(pkg.integrity), targetDir);
            imported++;
        }
    });

    await mapLimit(packages, config.fsConcurrency, async (pkg) => {
        const ownNodeModules = virtualNodeModules(nodeModules, pkg);

        for (const [depName, depId] of Object.entries(pkg.dependencies)) {
            const dep = graph.packages.get(depId);
            if (!dep) continue;

            const depDir = virtualPackageDir(nodeModules, dep);
            const linkPath = path.join(ownNodeModules, ...depName.split('/'));
            await symlinkIfNeeded(path.relative(path.dirname(linkPath), depDir), linkPath, DIR_LINK_TYPE);
        }
    });

    const rootNames = new Set<string>();

    for (const [name, id] of Object.entries(graph.roots)) {
        const pkg = graph.packages.get(id);
        if (!pkg) continue;

        const packageDir = virtualPackageDir(nodeModules, pkg);
        const linkPath = path.join(nodeModules, ...name.split('/'));

        await symlinkIfNeeded(path.relative(path.dirname(linkPath), packageDir), linkPath, DIR_LINK_TYPE);
        rootNames.add(name);

        try {
            await linkBin(nodeModules, pkg, packageDir);
        } catch (error) {
            logger.warning(`Could not link binaries for ${pkg.id}: ${getErrorMessage(error)}`);
        }
    }

    await prune(nodeModules, rootNames);

    return { imported, linked: rootNames.size };
};

export const unlinkRoot = async (projectDir: string, name: string): Promise<void> => {
    const linkPath = path.join(projectDir, 'node_modules', ...name.split('/'));

    try {
        const stats = await fs.promises.lstat(linkPath);
        if (stats.isSymbolicLink()) {
            await fs.promises.unlink(linkPath);
            return;
        }
        await fs.promises.rm(linkPath, { recursive: true, force: true });
    } catch (error) {
        if (errorCode(error) !== 'ENOENT') throw error;
    }
};
