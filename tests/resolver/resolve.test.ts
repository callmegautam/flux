import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSpecifier, resolve, selectVersion } from '../../src/resolver/resolve.js';
import { clearMemo } from '../../src/cache/metadata.js';
import { fakeRegistry, withCacheDir } from '../helpers.js';
import type { AbbreviatedPackument } from '../../src/types/npm.js';

const packument = (versions: string[], tags: Record<string, string>): AbbreviatedPackument => ({
    name: 'demo',
    'dist-tags': tags,
    versions: Object.fromEntries(
        versions.map((version) => [
            version,
            { name: 'demo', version, dist: { tarball: '', integrity: 'sha512-3q2+7w==' } },
        ])
    ),
});

test('parseSpecifier splits plain and scoped specifiers', () => {
    assert.deepEqual(parseSpecifier('express'), { name: 'express', range: 'latest' });
    assert.deepEqual(parseSpecifier('express@5.2.1'), { name: 'express', range: '5.2.1' });
    assert.deepEqual(parseSpecifier('express@^5'), { name: 'express', range: '^5' });
    assert.deepEqual(parseSpecifier('@types/node'), { name: '@types/node', range: 'latest' });
    assert.deepEqual(parseSpecifier('@types/node@20.1.0'), { name: '@types/node', range: '20.1.0' });
    assert.deepEqual(parseSpecifier('express@'), { name: 'express', range: 'latest' });
});

test('selectVersion honours tags, exact versions and ranges', () => {
    const doc = packument(['1.0.0', '1.2.0', '2.0.0'], { latest: '1.2.0', next: '2.0.0' });

    assert.equal(selectVersion(doc, 'latest'), '1.2.0');
    assert.equal(selectVersion(doc, 'next'), '2.0.0');
    assert.equal(selectVersion(doc, '1.0.0'), '1.0.0');
    assert.equal(selectVersion(doc, '^1.0.0'), '1.2.0');
    assert.equal(selectVersion(doc, '*'), '2.0.0');
});

test('selectVersion excludes prereleases unless the range asks for one', () => {
    const doc = packument(['1.0.0', '2.0.0-beta.1'], { latest: '1.0.0' });

    assert.equal(selectVersion(doc, '*'), '1.0.0');
    assert.equal(selectVersion(doc, '>=2.0.0-0'), '2.0.0-beta.1');
});

test('selectVersion throws when nothing satisfies the range', () => {
    const doc = packument(['1.0.0'], { latest: '1.0.0' });
    assert.throws(() => selectVersion(doc, '^9'), /No version of 'demo' satisfies/);
});

test('resolve walks transitive dependencies', async () => {
    await withCacheDir(async () => {
        clearMemo();
        const { fetcher } = fakeRegistry([
            { name: 'a', version: '1.0.0', dependencies: { b: '^1.0.0' } },
            { name: 'b', version: '1.0.0', dependencies: { c: '^1.0.0' } },
            { name: 'c', version: '1.0.0' },
        ]);

        const graph = await resolve([{ name: 'a', range: '^1.0.0' }], { fetcher });

        assert.deepEqual(graph.roots, { a: 'a@1.0.0' });
        assert.deepEqual([...graph.packages.keys()].sort(), ['a@1.0.0', 'b@1.0.0', 'c@1.0.0']);
        assert.deepEqual(graph.packages.get('a@1.0.0')?.dependencies, { b: 'b@1.0.0' });
        assert.deepEqual(graph.packages.get('b@1.0.0')?.dependencies, { c: 'c@1.0.0' });
    });
});

test('resolve fetches each package once for a diamond graph', async () => {
    await withCacheDir(async () => {
        clearMemo();
        const { fetcher, calls } = fakeRegistry([
            { name: 'root', version: '1.0.0', dependencies: { left: '^1.0.0', right: '^1.0.0' } },
            { name: 'left', version: '1.0.0', dependencies: { shared: '^1.0.0' } },
            { name: 'right', version: '1.0.0', dependencies: { shared: '^1.0.0' } },
            { name: 'shared', version: '1.0.0' },
        ]);

        const graph = await resolve([{ name: 'root', range: '*' }], { fetcher });

        assert.equal(graph.packages.size, 4);
        assert.equal(calls.filter((name) => name === 'shared').length, 1);
    });
});

test('resolve keeps conflicting versions of the same package', async () => {
    await withCacheDir(async () => {
        clearMemo();
        const { fetcher } = fakeRegistry([
            { name: 'root', version: '1.0.0', dependencies: { a: '^1.0.0', b: '^1.0.0' } },
            { name: 'a', version: '1.0.0', dependencies: { foo: '^1.0.0' } },
            { name: 'b', version: '1.0.0', dependencies: { foo: '^2.0.0' } },
            { name: 'foo', version: '1.5.0' },
            { name: 'foo', version: '2.1.0' },
        ]);

        const graph = await resolve([{ name: 'root', range: '*' }], { fetcher });

        assert.ok(graph.packages.has('foo@1.5.0'));
        assert.ok(graph.packages.has('foo@2.1.0'));
        assert.deepEqual(graph.packages.get('a@1.0.0')?.dependencies, { foo: 'foo@1.5.0' });
        assert.deepEqual(graph.packages.get('b@1.0.0')?.dependencies, { foo: 'foo@2.1.0' });
    });
});

test('resolve terminates on a dependency cycle', async () => {
    await withCacheDir(async () => {
        clearMemo();
        const { fetcher } = fakeRegistry([
            { name: 'a', version: '1.0.0', dependencies: { b: '^1.0.0' } },
            { name: 'b', version: '1.0.0', dependencies: { a: '^1.0.0' } },
        ]);

        const graph = await resolve([{ name: 'a', range: '*' }], { fetcher });

        assert.equal(graph.packages.size, 2);
        assert.deepEqual(graph.packages.get('a@1.0.0')?.dependencies, { b: 'b@1.0.0' });
        assert.deepEqual(graph.packages.get('b@1.0.0')?.dependencies, { a: 'a@1.0.0' });
    });
});

test('resolve skips a missing optional dependency but fails on a missing required one', async () => {
    await withCacheDir(async () => {
        clearMemo();
        const { fetcher } = fakeRegistry([
            { name: 'a', version: '1.0.0', optionalDependencies: { ghost: '^1.0.0' } },
            { name: 'bad', version: '1.0.0', dependencies: { ghost: '^1.0.0' } },
        ]);

        const graph = await resolve([{ name: 'a', range: '*' }], { fetcher });
        assert.equal(graph.packages.size, 1);
        assert.deepEqual(graph.packages.get('a@1.0.0')?.dependencies, {});

        clearMemo();
        await assert.rejects(resolve([{ name: 'bad', range: '*' }], { fetcher }), /was not found/);
    });
});
