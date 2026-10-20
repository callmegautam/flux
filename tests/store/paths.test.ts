import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import {
    integrityFromShasum,
    metadataFilePath,
    packageDirPath,
    packageId,
    parseIntegrity,
    resolveIntegrity,
    tarballFilePath,
} from '../../src/store/paths.js';
import { withCacheDir } from '../helpers.js';

test('parseIntegrity decodes algorithm and hex digest', () => {
    const parsed = parseIntegrity('sha512-3q2+7w==');
    assert.equal(parsed.algorithm, 'sha512');
    assert.equal(parsed.base64, '3q2+7w==');
    assert.equal(parsed.hex, 'deadbeef');
});

test('parseIntegrity rejects malformed and unsupported values', () => {
    assert.throws(() => parseIntegrity('nodash'), /Malformed integrity/);
    assert.throws(() => parseIntegrity('md5-abcd'), /Unsupported integrity algorithm/);
    assert.throws(() => parseIntegrity('sha512-'), /Malformed integrity/);
});

test('integrityFromShasum converts a sha1 hex digest to an integrity string', () => {
    const integrity = integrityFromShasum('deadbeef');
    assert.equal(integrity, 'sha1-3q2+7w==');
    assert.equal(parseIntegrity(integrity).hex, 'deadbeef');
});

test('resolveIntegrity prefers integrity and falls back to shasum', () => {
    assert.equal(resolveIntegrity({ integrity: 'sha512-3q2+7w==', shasum: 'deadbeef' }), 'sha512-3q2+7w==');
    assert.equal(resolveIntegrity({ shasum: 'deadbeef' }), 'sha1-3q2+7w==');
    assert.throws(() => resolveIntegrity({}), /neither integrity nor shasum/);
});

test('store paths shard by the first byte of the digest', async () => {
    await withCacheDir(async (dir) => {
        assert.equal(
            tarballFilePath('sha512-3q2+7w=='),
            path.join(dir, 'tarballs', 'sha512', 'de', 'adbeef.tgz')
        );
        assert.equal(
            packageDirPath('sha512-3q2+7w=='),
            path.join(dir, 'packages', 'sha512', 'de', 'adbeef')
        );
    });
});

test('metadata paths escape scoped package names', async () => {
    await withCacheDir(async (dir) => {
        assert.equal(metadataFilePath('express'), path.join(dir, 'metadata', 'express.json'));
        assert.equal(
            metadataFilePath('@types/node'),
            path.join(dir, 'metadata', '%40types%2Fnode.json')
        );
    });
});

test('packageId joins name and version', () => {
    assert.equal(packageId('@types/node', '20.1.0'), '@types/node@20.1.0');
});
