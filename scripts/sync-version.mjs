#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

writeFileSync(
    join(root, 'src', 'version.ts'),
    `export const VERSION = '${version}';\n`
);

console.log(`src/version.ts -> ${version}`);
