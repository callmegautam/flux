import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { publishDirAtomic, writeFileAtomic, withTempDir, pathExists } from '../../src/store/atomic.js';
import { withTempProject } from '../helpers.js';

test('writeFileAtomic leaves no temp files behind', async () => {
    await withTempProject(async (dir) => {
        const target = path.join(dir, 'nested', 'file.json');
        await writeFileAtomic(target, '{"a":1}');

        assert.equal(await fs.promises.readFile(target, 'utf8'), '{"a":1}');
        const entries = await fs.promises.readdir(path.dirname(target));
        assert.deepEqual(entries, ['file.json']);
    });
});

test('writeFileAtomic cleans up the temp file when the write fails', async () => {
    await withTempProject(async (dir) => {
        const target = path.join(dir, 'out.json');
        await assert.rejects(writeFileAtomic(target, undefined as unknown as string));
        assert.deepEqual(await fs.promises.readdir(dir), []);
    });
});

test('publishDirAtomic exposes only a complete directory', async () => {
    await withTempProject(async (dir) => {
        const staging = path.join(dir, 'staging');
        const target = path.join(dir, 'final');

        await fs.promises.mkdir(staging, { recursive: true });
        await fs.promises.writeFile(path.join(staging, 'package.json'), '{}');

        await publishDirAtomic(staging, target);

        assert.ok(await pathExists(path.join(target, 'package.json')));
        assert.equal(await pathExists(staging), false);
    });
});

test('publishDirAtomic tolerates losing the race to another writer', async () => {
    await withTempProject(async (dir) => {
        const target = path.join(dir, 'final');
        await fs.promises.mkdir(target, { recursive: true });
        await fs.promises.writeFile(path.join(target, 'winner.txt'), 'first');

        const staging = path.join(dir, 'staging');
        await fs.promises.mkdir(staging, { recursive: true });
        await fs.promises.writeFile(path.join(staging, 'loser.txt'), 'second');

        await publishDirAtomic(staging, target);

        assert.ok(await pathExists(path.join(target, 'winner.txt')));
        assert.equal(await pathExists(staging), false);
    });
});

test('withTempDir removes the staging directory when the body throws', async () => {
    await withTempProject(async (dir) => {
        let staging = '';
        await assert.rejects(
            withTempDir(dir, async (created) => {
                staging = created;
                await fs.promises.writeFile(path.join(created, 'partial'), 'x');
                throw new Error('boom');
            })
        );
        assert.equal(await pathExists(staging), false);
    });
});
