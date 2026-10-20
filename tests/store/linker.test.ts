import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { importPackage, linkGraph, unlinkRoot, virtualPackageDir } from '../../src/store/linker.js';
import { packagePath } from '../../src/store/packages.js';
import type { ResolutionGraph, ResolvedPackage } from '../../src/resolver/resolve.js';
import { withCacheDir, withTempProject } from '../helpers.js';

const integrityFor = (index: number): string =>
    `sha512-${Buffer.from(String(index).padStart(64, '0'), 'hex').toString('base64')}`;

const makePackage = (
    name: string,
    version: string,
    index: number,
    dependencies: Record<string, string> = {},
    bin?: string
): ResolvedPackage => ({
    id: `${name}@${version}`,
    name,
    version,
    tarball: '',
    integrity: integrityFor(index),
    bin,
    dependencies,
    optional: false,
});

const seedStore = async (pkg: ResolvedPackage, extra: Record<string, string> = {}): Promise<void> => {
    const dir = packagePath(pkg.integrity);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(
        path.join(dir, 'package.json'),
        JSON.stringify({ name: pkg.name, version: pkg.version, ...(pkg.bin ? { bin: pkg.bin } : {}) })
    );
    await fs.promises.writeFile(path.join(dir, 'index.js'), `module.exports='${pkg.name}';`);

    for (const [file, content] of Object.entries(extra)) {
        const target = path.join(dir, file);
        await fs.promises.mkdir(path.dirname(target), { recursive: true });
        await fs.promises.writeFile(target, content);
    }
};

test('importPackage hardlinks files rather than copying them', async () => {
    await withCacheDir(async () => {
        await withTempProject(async (project) => {
            const pkg = makePackage('demo', '1.0.0', 1, {}, undefined);
            await seedStore(pkg, { 'lib/deep.js': 'deep' });

            const target = path.join(project, 'imported');
            await importPackage(packagePath(pkg.integrity), target);

            assert.equal(await fs.promises.readFile(path.join(target, 'lib/deep.js'), 'utf8'), 'deep');

            const storeStat = await fs.promises.stat(path.join(packagePath(pkg.integrity), 'index.js'));
            const linkStat = await fs.promises.stat(path.join(target, 'index.js'));
            assert.equal(storeStat.ino, linkStat.ino);
        });
    });
});

test('linkGraph builds the virtual store and links only direct dependencies at top level', async () => {
    await withCacheDir(async () => {
        await withTempProject(async (project) => {
            const dep = makePackage('dep', '2.0.0', 2);
            const root = makePackage('root', '1.0.0', 1, { dep: 'dep@2.0.0' });
            await seedStore(dep);
            await seedStore(root);

            const graph: ResolutionGraph = {
                roots: { root: 'root@1.0.0' },
                packages: new Map([
                    ['root@1.0.0', root],
                    ['dep@2.0.0', dep],
                ]),
            };

            await linkGraph(project, graph);

            const nodeModules = path.join(project, 'node_modules');

            assert.ok((await fs.promises.lstat(path.join(nodeModules, 'root'))).isSymbolicLink());
            await assert.rejects(fs.promises.lstat(path.join(nodeModules, 'dep')));

            const nested = path.join(nodeModules, '.flux/root@1.0.0/node_modules/dep');
            assert.ok((await fs.promises.lstat(nested)).isSymbolicLink());
            assert.equal(
                await fs.promises.readFile(path.join(nested, 'package.json'), 'utf8'),
                JSON.stringify({ name: 'dep', version: '2.0.0' })
            );
        });
    });
});

test('linkGraph uses relative symlinks so the tree can be relocated', async () => {
    await withCacheDir(async () => {
        await withTempProject(async (project) => {
            const root = makePackage('root', '1.0.0', 1);
            await seedStore(root);

            await linkGraph(project, {
                roots: { root: 'root@1.0.0' },
                packages: new Map([['root@1.0.0', root]]),
            });

            const link = await fs.promises.readlink(path.join(project, 'node_modules', 'root'));
            assert.equal(path.isAbsolute(link), false);
            assert.equal(link, path.join('.flux', 'root@1.0.0', 'node_modules', 'root'));
        });
    });
});

test('linkGraph is idempotent and prunes packages that left the graph', async () => {
    await withCacheDir(async () => {
        await withTempProject(async (project) => {
            const a = makePackage('a', '1.0.0', 1);
            const b = makePackage('b', '1.0.0', 2);
            await seedStore(a);
            await seedStore(b);

            const full: ResolutionGraph = {
                roots: { a: 'a@1.0.0', b: 'b@1.0.0' },
                packages: new Map([
                    ['a@1.0.0', a],
                    ['b@1.0.0', b],
                ]),
            };

            const first = await linkGraph(project, full);
            assert.equal(first.imported, 2);

            const second = await linkGraph(project, full);
            assert.equal(second.imported, 0);

            await linkGraph(project, {
                roots: { a: 'a@1.0.0' },
                packages: new Map([['a@1.0.0', a]]),
            });

            const nodeModules = path.join(project, 'node_modules');
            assert.ok(await fs.promises.lstat(path.join(nodeModules, 'a')));
            await assert.rejects(fs.promises.lstat(path.join(nodeModules, 'b')));
        });
    });
});

test('linkGraph replaces a real directory left by another package manager', async () => {
    await withCacheDir(async () => {
        await withTempProject(async (project) => {
            const root = makePackage('root', '1.0.0', 1);
            await seedStore(root);

            const stale = path.join(project, 'node_modules', 'root');
            await fs.promises.mkdir(stale, { recursive: true });
            await fs.promises.writeFile(path.join(stale, 'package.json'), '{"stale":true}');

            await linkGraph(project, {
                roots: { root: 'root@1.0.0' },
                packages: new Map([['root@1.0.0', root]]),
            });

            assert.ok((await fs.promises.lstat(stale)).isSymbolicLink());
            assert.equal(
                await fs.promises.readFile(path.join(stale, 'package.json'), 'utf8'),
                JSON.stringify({ name: 'root', version: '1.0.0' })
            );
        });
    });
});

test('linkGraph handles scoped packages and conflicting versions', async () => {
    await withCacheDir(async () => {
        await withTempProject(async (project) => {
            const fooOld = makePackage('foo', '1.0.0', 3);
            const fooNew = makePackage('foo', '2.0.0', 4);
            const a = makePackage('@scope/a', '1.0.0', 1, { foo: 'foo@1.0.0' });
            const b = makePackage('b', '1.0.0', 2, { foo: 'foo@2.0.0' });

            for (const pkg of [fooOld, fooNew, a, b]) await seedStore(pkg);

            await linkGraph(project, {
                roots: { '@scope/a': '@scope/a@1.0.0', b: 'b@1.0.0' },
                packages: new Map([
                    ['@scope/a@1.0.0', a],
                    ['b@1.0.0', b],
                    ['foo@1.0.0', fooOld],
                    ['foo@2.0.0', fooNew],
                ]),
            });

            const nodeModules = path.join(project, 'node_modules');
            assert.ok((await fs.promises.lstat(path.join(nodeModules, '@scope/a'))).isSymbolicLink());

            const aFoo = path.join(nodeModules, '.flux/@scope+a@1.0.0/node_modules/foo/package.json');
            const bFoo = path.join(nodeModules, '.flux/b@1.0.0/node_modules/foo/package.json');

            assert.match(await fs.promises.readFile(aFoo, 'utf8'), /"version":"1.0.0"/);
            assert.match(await fs.promises.readFile(bFoo, 'utf8'), /"version":"2.0.0"/);
        });
    });
});

test('linkGraph creates .bin entries for direct dependencies only', async () => {
    if (process.platform === 'win32') return;

    await withCacheDir(async () => {
        await withTempProject(async (project) => {
            const dep = makePackage('dep', '1.0.0', 2, {}, './cli.js');
            const root = makePackage('root', '1.0.0', 1, { dep: 'dep@1.0.0' }, './cli.js');

            await seedStore(dep, { 'cli.js': '#!/usr/bin/env node\n' });
            await seedStore(root, { 'cli.js': '#!/usr/bin/env node\n' });

            await linkGraph(project, {
                roots: { root: 'root@1.0.0' },
                packages: new Map([
                    ['root@1.0.0', root],
                    ['dep@1.0.0', dep],
                ]),
            });

            const binDir = path.join(project, 'node_modules', '.bin');
            assert.deepEqual(await fs.promises.readdir(binDir), ['root']);
            assert.ok((await fs.promises.lstat(path.join(binDir, 'root'))).isSymbolicLink());
        });
    });
});

test('unlinkRoot removes the symlink without touching the store', async () => {
    await withCacheDir(async () => {
        await withTempProject(async (project) => {
            const root = makePackage('root', '1.0.0', 1);
            await seedStore(root);

            const graph: ResolutionGraph = {
                roots: { root: 'root@1.0.0' },
                packages: new Map([['root@1.0.0', root]]),
            };
            await linkGraph(project, graph);

            await unlinkRoot(project, 'root');

            await assert.rejects(fs.promises.lstat(path.join(project, 'node_modules', 'root')));
            assert.ok(await fs.promises.stat(path.join(packagePath(root.integrity), 'index.js')));
            assert.ok(
                await fs.promises.stat(
                    path.join(virtualPackageDir(path.join(project, 'node_modules'), root), 'index.js')
                )
            );
        });
    });
});

test('unlinkRoot is a no-op for a package that is not linked', async () => {
    await withTempProject(async (project) => {
        await fs.promises.mkdir(path.join(project, 'node_modules'), { recursive: true });
        await unlinkRoot(project, 'absent');
    });
});
