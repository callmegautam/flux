import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
    buildLockfile,
    graphFromLockfile,
    isLockfileCurrent,
    lockfilePath,
    readLockfile,
    writeLockfile,
} from '../src/lockfile.js';
import type { ResolutionGraph, ResolvedPackage } from '../src/resolver/resolve.js';
import { withTempProject } from './helpers.js';

const graph = (): ResolutionGraph => ({
    roots: { express: 'express@5.2.1' },
    packages: new Map<string, ResolvedPackage>([
        [
            'express@5.2.1',
            {
                id: 'express@5.2.1',
                name: 'express',
                version: '5.2.1',
                tarball: 'https://example.test/express-5.2.1.tgz',
                integrity: 'sha512-3q2+7w==',
                dependencies: { accepts: 'accepts@2.0.0' },
                optional: false,
            },
        ],
        [
            'accepts@2.0.0',
            {
                id: 'accepts@2.0.0',
                name: 'accepts',
                version: '2.0.0',
                tarball: 'https://example.test/accepts-2.0.0.tgz',
                integrity: 'sha512-3q2+7w==',
                dependencies: {},
                optional: false,
            },
        ],
    ]),
});

test('a lockfile round-trips through disk without losing the graph', async () => {
    await withTempProject(async (dir) => {
        const deps = { express: '^5.2.1' };
        await writeLockfile(dir, buildLockfile(graph(), deps, {}));

        const onDisk = await readLockfile(dir);
        assert.ok(onDisk);

        const restored = graphFromLockfile(onDisk);
        assert.deepEqual(restored.roots, { express: 'express@5.2.1' });
        assert.equal(restored.packages.size, 2);
        assert.deepEqual(restored.packages.get('express@5.2.1')?.dependencies, {
            accepts: 'accepts@2.0.0',
        });
        assert.equal(restored.packages.get('accepts@2.0.0')?.version, '2.0.0');
    });
});

test('graphFromLockfile splits scoped ids on the last @', () => {
    const restored = graphFromLockfile({
        lockfileVersion: 1,
        importers: { '.': { dependencies: {}, devDependencies: {} } },
        roots: {},
        packages: {
            '@types/node@20.1.0': {
                resolution: { tarball: 't', integrity: 'sha512-3q2+7w==' },
            },
        },
    });

    const entry = restored.packages.get('@types/node@20.1.0');
    assert.equal(entry?.name, '@types/node');
    assert.equal(entry?.version, '20.1.0');
});

test('isLockfileCurrent tracks package.json changes', () => {
    const lockfile = buildLockfile(graph(), { express: '^5.2.1' }, {});

    assert.equal(isLockfileCurrent(lockfile, { express: '^5.2.1' }, {}), true);
    assert.equal(isLockfileCurrent(lockfile, { express: '^5.3.0' }, {}), false);
    assert.equal(isLockfileCurrent(lockfile, { express: '^5.2.1', cors: '^2' }, {}), false);
    assert.equal(isLockfileCurrent(lockfile, {}, {}), false);
    assert.equal(isLockfileCurrent(lockfile, { express: '^5.2.1' }, { tap: '^1' }), false);
});

test('isLockfileCurrent rejects a lockfile with a dangling dependency id', () => {
    const lockfile = buildLockfile(graph(), { express: '^5.2.1' }, {});
    delete lockfile.packages['accepts@2.0.0'];
    assert.equal(isLockfileCurrent(lockfile, { express: '^5.2.1' }, {}), false);
});

test('readLockfile rejects an unknown lockfile version or malformed json', async () => {
    await withTempProject(async (dir) => {
        await fs.promises.writeFile(lockfilePath(dir), JSON.stringify({ lockfileVersion: 99 }));
        assert.equal(await readLockfile(dir), null);

        await fs.promises.writeFile(lockfilePath(dir), 'not json');
        assert.equal(await readLockfile(dir), null);

        await fs.promises.rm(lockfilePath(dir));
        assert.equal(await readLockfile(dir), null);
    });
});

test('buildLockfile writes deterministic, sorted output', async () => {
    await withTempProject(async (dir) => {
        await writeLockfile(dir, buildLockfile(graph(), { express: '^5.2.1', cors: '^2' }, {}));
        const first = await fs.promises.readFile(path.join(dir, 'flux-lock.json'), 'utf8');

        await writeLockfile(dir, buildLockfile(graph(), { cors: '^2', express: '^5.2.1' }, {}));
        const second = await fs.promises.readFile(path.join(dir, 'flux-lock.json'), 'utf8');

        assert.equal(first, second);

        const packagesSection = first.slice(first.indexOf('"packages"'));
        assert.ok(
            packagesSection.indexOf('"accepts@2.0.0"') < packagesSection.indexOf('"express@5.2.1"')
        );
    });
});
