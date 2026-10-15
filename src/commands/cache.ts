import type { CommandModule } from 'yargs';
import { cacheClean, cacheDir, cacheInfo } from '../index.js';

interface CacheArgs {
    action: string;
    metadata: boolean;
    tarballs: boolean;
    packages: boolean;
    all: boolean;
}

const command: CommandModule<object, CacheArgs> = {
    command: 'cache <action>',
    describe: 'Inspect or clean the flux store (clean | dir | info)',
    builder: (yargs) =>
        yargs
            .positional('action', {
                describe: 'clean, dir or info',
                type: 'string',
                choices: ['clean', 'dir', 'info'],
                demandOption: true,
            })
            .option('metadata', { type: 'boolean', default: false, describe: 'Clean cached registry metadata' })
            .option('tarballs', { type: 'boolean', default: false, describe: 'Clean cached tarballs' })
            .option('packages', { type: 'boolean', default: false, describe: 'Clean the extracted package store' })
            .option('all', { type: 'boolean', default: false, describe: 'Clean every cache layer' }) as never,
    handler: async (argv) => {
        if (argv.action === 'dir') {
            cacheDir();
            return;
        }
        if (argv.action === 'info') {
            await cacheInfo();
            return;
        }
        await cacheClean({
            metadata: argv.metadata,
            tarballs: argv.tarballs,
            packages: argv.packages,
            all: argv.all,
        });
    },
};

export default command;
