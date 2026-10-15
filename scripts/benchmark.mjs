#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const compiled = path.join(root, 'dist', 'bin', 'flux.js');
const useCompiled = fs.existsSync(compiled);
const fluxEntry = useCompiled ? compiled : path.join(root, 'bin', 'flux.ts');
const runner = useCompiled ? process.execPath : path.join(root, 'node_modules', '.bin', 'tsx');

const FIXTURES = {
    small: ['chalk'],
    medium: ['express'],
    large: ['express', 'typescript', 'axios'],
};

const args = process.argv.slice(2);
const fixtureName = args.find((a) => !a.startsWith('-')) ?? 'medium';
const runs = Number(args.find((a) => a.startsWith('--runs='))?.split('=')[1] ?? 3);
const compare = args.includes('--compare');

const packages = FIXTURES[fixtureName];
if (!packages) {
    console.error(`Unknown fixture '${fixtureName}'. Options: ${Object.keys(FIXTURES).join(', ')}`);
    process.exit(1);
}

const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'flux-bench-'));
const cacheDir = path.join(workRoot, 'cache');

const rm = (target) => fs.rmSync(target, { recursive: true, force: true });

const freshProject = (name) => {
    const dir = path.join(workRoot, `${name}-${Math.random().toString(36).slice(2, 8)}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ name: 'bench', version: '1.0.0', private: true }, null, 2)
    );
    return dir;
};

const runFlux = (dir, fluxArgs) => {
    const started = process.hrtime.bigint();
    const result = spawnSync(runner, [fluxEntry, ...fluxArgs], {
        cwd: dir,
        env: { ...process.env, FLUX_CACHE_DIR: cacheDir },
        stdio: 'pipe',
        encoding: 'utf8',
    });
    const ms = Number(process.hrtime.bigint() - started) / 1e6;

    if (result.status !== 0) {
        console.error(result.stdout, result.stderr);
        throw new Error(`flux ${fluxArgs.join(' ')} failed in ${dir}`);
    }
    return ms;
};

const runOther = (bin, dir, otherArgs, env = {}) => {
    const started = process.hrtime.bigint();
    const result = spawnSync(bin, otherArgs, {
        cwd: dir,
        env: { ...process.env, ...env },
        stdio: 'pipe',
        encoding: 'utf8',
    });
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    return result.status === 0 ? ms : null;
};

const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const installAll = (dir) => {
    let total = 0;
    for (const pkg of packages) total += runFlux(dir, ['add', pkg]);
    return total;
};

const scenarios = [
    {
        name: 'cold',
        note: 'empty cache, empty node_modules',
        run: () => {
            rm(cacheDir);
            return installAll(freshProject('cold'));
        },
    },
    {
        name: 'warm metadata',
        note: 'metadata cached, tarballs + store cleared',
        run: () => {
            rm(path.join(cacheDir, 'tarballs'));
            rm(path.join(cacheDir, 'packages'));
            return installAll(freshProject('warm-meta'));
        },
    },
    {
        name: 'warm tarball',
        note: 'metadata + tarballs cached, store cleared',
        run: () => {
            rm(path.join(cacheDir, 'packages'));
            return installAll(freshProject('warm-tar'));
        },
    },
    {
        name: 'second project',
        note: 'everything cached, link only',
        run: () => installAll(freshProject('second')),
    },
    {
        name: 'lockfile',
        note: 'node_modules deleted, flux-lock.json present',
        run: () => {
            const dir = freshProject('lock');
            installAll(dir);
            rm(path.join(dir, 'node_modules'));
            return runFlux(dir, ['install']);
        },
    },
];

const startupSamples = [];
for (let i = 0; i < 3; i++) startupSamples.push(runFlux(workRoot, ['--version']));
const startupMs = median(startupSamples);

console.log(`\nflux benchmark  fixture=${fixtureName} (${packages.join(', ')})  runs=${runs}`);
console.log(`entry: ${useCompiled ? 'dist (compiled)' : 'tsx (source)'}`);
console.log(`cache: ${cacheDir}`);
console.log(`process startup floor: ${startupMs.toFixed(0)}ms (included in every number below)\n`);

const results = [];

for (const scenario of scenarios) {
    const samples = [];
    for (let i = 0; i < runs; i++) samples.push(scenario.run());
    results.push({ ...scenario, ms: median(samples) });
    const ms = median(samples);
    const net = Math.max(0, ms - startupMs * packages.length);
    console.log(
        `  ${scenario.name.padEnd(16)} ${`${ms.toFixed(0)}ms`.padStart(8)} ${`(${net.toFixed(0)}ms net)`.padStart(12)}   ${scenario.note}`
    );
}

const cold = results.find((r) => r.name === 'cold')?.ms ?? 0;
const second = results.find((r) => r.name === 'second project')?.ms ?? 0;
if (cold && second) {
    console.log(`\n  second project is ${(cold / second).toFixed(1)}x faster than cold.`);
}

if (compare) {
    console.log('\n  comparison (cold, each with its own empty cache):');

    const npmCache = path.join(workRoot, 'npm-cache');
    const npmDir = freshProject('npm');
    const npmMs = runOther('npm', npmDir, ['install', ...packages, '--cache', npmCache, '--no-audit', '--no-fund']);
    console.log(`    npm            ${npmMs === null ? 'n/a' : `${npmMs.toFixed(0)}ms`}`);

    const pnpmStore = path.join(workRoot, 'pnpm-store');
    const pnpmDir = freshProject('pnpm');
    const pnpmMs = runOther('pnpm', pnpmDir, ['add', ...packages, '--store-dir', pnpmStore, '--ignore-scripts']);
    console.log(`    pnpm           ${pnpmMs === null ? 'n/a' : `${pnpmMs.toFixed(0)}ms`}`);

    console.log(`    flux           ${cold.toFixed(0)}ms`);
}

console.log('');
rm(workRoot);
