import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { extractPackage, hasPackage, packagePath } from '../../src/store/packages.js';
import { packageRoot } from '../../src/store/paths.js';
import { verifyTarball } from '../../src/store/tarballs.js';
import { tarballFilePath } from '../../src/store/paths.js';
import { makeTarball, sha512, withCacheDir } from '../helpers.js';

test('extractPackage strips the leading directory and is idempotent', async () => {
    await withCacheDir(async (dir) => {
        const tarball = path.join(dir, 'demo.tgz');
        const buffer = await makeTarball(
            { 'package.json': '{"name":"demo","version":"1.0.0"}', 'lib/index.js': 'module.exports=1;' },
            tarball
        );
        const integrity = sha512(buffer);

        assert.equal(await hasPackage(integrity), false);

        const target = await extractPackage(integrity, tarball);
        assert.equal(target, packagePath(integrity));
        assert.equal(
            await fs.promises.readFile(path.join(target, 'package.json'), 'utf8'),
            '{"name":"demo","version":"1.0.0"}'
        );
        assert.ok(await hasPackage(integrity));

        const again = await extractPackage(integrity, tarball);
        assert.equal(again, target);
    });
});

test('a corrupt tarball leaves nothing behind in the package store', async () => {
    await withCacheDir(async (dir) => {
        const tarball = path.join(dir, 'broken.tgz');
        await fs.promises.writeFile(tarball, 'NOT A TARBALL');
        const integrity = sha512(Buffer.from('NOT A TARBALL'));

        await assert.rejects(extractPackage(integrity, tarball), /Failed to extract/);
        assert.equal(await hasPackage(integrity), false);

        const stray = await fs.promises.readdir(packageRoot()).catch(() => []);
        assert.deepEqual(stray, []);
    });
});

test('verifyTarball detects a truncated cached tarball', async () => {
    await withCacheDir(async (dir) => {
        const source = path.join(dir, 'demo.tgz');
        const buffer = await makeTarball({ 'package.json': '{}' }, source);
        const integrity = sha512(buffer);

        const cached = tarballFilePath(integrity);
        await fs.promises.mkdir(path.dirname(cached), { recursive: true });
        await fs.promises.copyFile(source, cached);
        assert.equal(await verifyTarball(integrity), true);

        await fs.promises.writeFile(cached, buffer.subarray(0, buffer.length - 10));
        assert.equal(await verifyTarball(integrity), false);
    });
});
