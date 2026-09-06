#!/usr/bin/env node
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const TARGETS = [
    { target: 'bun-linux-x64', out: 'flux-linux-x64' },
    { target: 'bun-linux-arm64', out: 'flux-linux-arm64' },
    { target: 'bun-darwin-x64', out: 'flux-darwin-x64' },
    { target: 'bun-darwin-arm64', out: 'flux-darwin-arm64' },
    { target: 'bun-windows-x64', out: 'flux-windows-x64.exe' },
];

const OUT_DIR = 'dist-bin';
const only = process.argv[2];

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

execFileSync('node', ['scripts/sync-version.mjs'], { stdio: 'inherit' });

const targets = only ? TARGETS.filter((t) => t.target === only) : TARGETS;
if (targets.length === 0) {
    console.error(`Unknown target "${only}". Known: ${TARGETS.map((t) => t.target).join(', ')}`);
    process.exit(1);
}

for (const { target, out } of targets) {
    console.log(`\n==> ${target}`);
    execFileSync(
        'bun',
        [
            'build',
            '--compile',
            '--minify',
            `--target=${target}`,
            'bin/flux.ts',
            '--outfile',
            join(OUT_DIR, out),
        ],
        { stdio: 'inherit' }
    );
}

console.log('\nBuilt:');
for (const f of readdirSync(OUT_DIR).sort()) {
    const size = (statSync(join(OUT_DIR, f)).size / 1024 / 1024).toFixed(1);
    console.log(`  ${f}  ${size} MB`);
}
