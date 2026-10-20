import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import * as tar from 'tar';
import type { AbbreviatedPackument, AbbreviatedVersion } from '../src/types/npm.js';
import type { MetadataFetcher } from '../src/resolver/registry.js';
import { FluxError } from '../src/utils/errors.js';

export const withCacheDir = async <T>(fn: (dir: string) => Promise<T>): Promise<T> => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'flux-test-'));
    const previous = process.env.FLUX_CACHE_DIR;
    process.env.FLUX_CACHE_DIR = dir;

    try {
        return await fn(dir);
    } finally {
        if (previous === undefined) delete process.env.FLUX_CACHE_DIR;
        else process.env.FLUX_CACHE_DIR = previous;
        await fs.promises.rm(dir, { recursive: true, force: true });
    }
};

export const withTempProject = async <T>(fn: (dir: string) => Promise<T>): Promise<T> => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'flux-project-'));
    try {
        return await fn(dir);
    } finally {
        await fs.promises.rm(dir, { recursive: true, force: true });
    }
};

export const sha512 = (data: Buffer): string =>
    `sha512-${crypto.createHash('sha512').update(data).digest('base64')}`;

export const makeTarball = async (
    files: Record<string, string>,
    targetPath: string
): Promise<Buffer> => {
    const staging = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'flux-tar-'));
    const root = path.join(staging, 'package');

    for (const [name, content] of Object.entries(files)) {
        const file = path.join(root, name);
        await fs.promises.mkdir(path.dirname(file), { recursive: true });
        await fs.promises.writeFile(file, content);
    }

    await tar.c({ file: targetPath, cwd: staging, gzip: true }, ['package']);
    const buffer = await fs.promises.readFile(targetPath);
    await fs.promises.rm(staging, { recursive: true, force: true });
    return buffer;
};

export const gzipEmpty = (): Buffer => zlib.gzipSync(Buffer.alloc(1024));

export interface FakePackage {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    tarball?: string;
    integrity?: string;
}

export const fakeRegistry = (
    packages: readonly FakePackage[],
    tags: Record<string, Record<string, string>> = {}
): { fetcher: MetadataFetcher; calls: string[] } => {
    const byName = new Map<string, AbbreviatedPackument>();

    for (const pkg of packages) {
        const existing = byName.get(pkg.name) ?? {
            name: pkg.name,
            'dist-tags': {},
            versions: {},
        };

        const version: AbbreviatedVersion = {
            name: pkg.name,
            version: pkg.version,
            dependencies: pkg.dependencies,
            optionalDependencies: pkg.optionalDependencies,
            dist: {
                tarball: pkg.tarball ?? `https://example.test/${pkg.name}-${pkg.version}.tgz`,
                integrity: pkg.integrity ?? sha512(Buffer.from(`${pkg.name}@${pkg.version}`)),
            },
        };

        existing.versions[pkg.version] = version;
        byName.set(pkg.name, existing);
    }

    for (const [name, packument] of byName) {
        const versions = Object.keys(packument.versions);
        packument['dist-tags'] = tags[name] ?? { latest: versions[versions.length - 1] as string };
    }

    const calls: string[] = [];

    const fetcher: MetadataFetcher = async (name) => {
        calls.push(name);
        const packument = byName.get(name);
        if (!packument) throw new FluxError(`Package '${name}' was not found.`, 'FLUX_NOT_FOUND');
        return { packument, notModified: false, etag: `"${name}"` };
    };

    return { fetcher, calls };
};
