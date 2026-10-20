import test from 'node:test';
import assert from 'node:assert/strict';
import { clearMemo, getMetadata, isFresh, read, write } from '../../src/cache/metadata.js';
import type { CachedMetadata } from '../../src/cache/metadata.js';
import type { MetadataFetcher } from '../../src/resolver/registry.js';
import { fakeRegistry, withCacheDir } from '../helpers.js';
import { config } from '../../src/config.js';
import { FluxError } from '../../src/utils/errors.js';

const entryFor = (name: string, versions: string[], fetchedAt: number): CachedMetadata => ({
    name,
    fetchedAt,
    etag: '"cached"',
    packument: {
        name,
        'dist-tags': { latest: versions[versions.length - 1] as string },
        versions: Object.fromEntries(
            versions.map((version) => [
                version,
                { name, version, dist: { tarball: '', integrity: 'sha512-3q2+7w==' } },
            ])
        ),
    },
});

test('isFresh respects the configured TTL', () => {
    const now = Date.now();
    assert.equal(isFresh(entryFor('a', ['1.0.0'], now), now), true);
    assert.equal(isFresh(entryFor('a', ['1.0.0'], now - config.metadataTtlMs - 1), now), false);
});

test('a fresh disk entry is served without hitting the registry', async () => {
    await withCacheDir(async () => {
        clearMemo();
        await write(entryFor('demo', ['1.0.0'], Date.now()));

        const { fetcher, calls } = fakeRegistry([{ name: 'demo', version: '9.9.9' }]);
        const packument = await getMetadata('demo', { fetcher });

        assert.deepEqual(Object.keys(packument.versions), ['1.0.0']);
        assert.deepEqual(calls, []);
    });
});

test('a stale entry is refetched', async () => {
    await withCacheDir(async () => {
        clearMemo();
        await write(entryFor('demo', ['1.0.0'], Date.now() - config.metadataTtlMs - 1));

        const { fetcher, calls } = fakeRegistry([{ name: 'demo', version: '9.9.9' }]);
        const packument = await getMetadata('demo', { fetcher });

        assert.deepEqual(Object.keys(packument.versions), ['9.9.9']);
        assert.deepEqual(calls, ['demo']);
    });
});

test('a stale entry containing the exact version wanted is used as-is', async () => {
    await withCacheDir(async () => {
        clearMemo();
        await write(entryFor('demo', ['1.0.0'], Date.now() - config.metadataTtlMs - 1));

        const { fetcher, calls } = fakeRegistry([{ name: 'demo', version: '9.9.9' }]);
        const packument = await getMetadata('demo', { fetcher, exactVersion: '1.0.0' });

        assert.deepEqual(Object.keys(packument.versions), ['1.0.0']);
        assert.deepEqual(calls, []);
    });
});

test('a 304 response refreshes the cached entry in place', async () => {
    await withCacheDir(async () => {
        clearMemo();
        const stale = entryFor('demo', ['1.0.0'], Date.now() - config.metadataTtlMs - 1);
        await write(stale);

        let seenEtag: string | undefined;
        const fetcher: MetadataFetcher = async (_name, etag) => {
            seenEtag = etag;
            return { packument: {} as never, notModified: true, etag };
        };

        const packument = await getMetadata('demo', { fetcher });

        assert.equal(seenEtag, '"cached"');
        assert.deepEqual(Object.keys(packument.versions), ['1.0.0']);

        const persisted = await read('demo');
        assert.ok(persisted && persisted.fetchedAt > stale.fetchedAt);
    });
});

test('a stale entry is used when the registry is unreachable', async () => {
    await withCacheDir(async () => {
        clearMemo();
        await write(entryFor('demo', ['1.0.0'], Date.now() - config.metadataTtlMs - 1));

        const fetcher: MetadataFetcher = async () => {
            throw new FluxError('offline', 'FLUX_REGISTRY_ERROR');
        };

        const packument = await getMetadata('demo', { fetcher });
        assert.deepEqual(Object.keys(packument.versions), ['1.0.0']);
    });
});

test('offline mode never contacts the registry', async () => {
    await withCacheDir(async () => {
        clearMemo();
        await write(entryFor('demo', ['1.0.0'], Date.now() - config.metadataTtlMs - 1));

        const { fetcher, calls } = fakeRegistry([{ name: 'demo', version: '9.9.9' }]);
        await getMetadata('demo', { fetcher, offline: true });
        assert.deepEqual(calls, []);
    });
});

test('concurrent requests for the same package share one fetch', async () => {
    await withCacheDir(async () => {
        clearMemo();
        const { fetcher, calls } = fakeRegistry([{ name: 'demo', version: '1.0.0' }]);

        await Promise.all([
            getMetadata('demo', { fetcher }),
            getMetadata('demo', { fetcher }),
            getMetadata('demo', { fetcher }),
        ]);

        assert.deepEqual(calls, ['demo']);
    });
});

test('a missing package with no cache entry propagates the error', async () => {
    await withCacheDir(async () => {
        clearMemo();
        const { fetcher } = fakeRegistry([]);
        await assert.rejects(getMetadata('ghost', { fetcher }), /was not found/);
    });
});
