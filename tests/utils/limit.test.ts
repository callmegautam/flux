import test from 'node:test';
import assert from 'node:assert/strict';
import { createLimit, mapLimit } from '../../src/utils/limit.js';

const defer = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

test('createLimit never exceeds the configured concurrency', async () => {
    const limit = createLimit(3);
    let active = 0;
    let peak = 0;

    await Promise.all(
        Array.from({ length: 20 }, () =>
            limit(async () => {
                active++;
                peak = Math.max(peak, active);
                await defer(5);
                active--;
            })
        )
    );

    assert.ok(peak <= 3, `peak concurrency was ${peak}`);
    assert.equal(active, 0);
});

test('a rejected task releases its slot', async () => {
    const limit = createLimit(1);

    await assert.rejects(limit(async () => Promise.reject(new Error('boom'))), /boom/);
    assert.equal(await limit(async () => 'ok'), 'ok');
});

test('mapLimit preserves input order', async () => {
    const results = await mapLimit([5, 1, 4, 2, 3], 2, async (value) => {
        await defer(value);
        return value * 2;
    });

    assert.deepEqual(results, [10, 2, 8, 4, 6]);
});

test('createLimit rejects an invalid concurrency', () => {
    assert.throws(() => createLimit(0), RangeError);
});
