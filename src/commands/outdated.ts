import type { CommandModule } from 'yargs';
import { outdated } from '../index.js';

const command: CommandModule = {
    command: 'outdated',
    describe: 'List outdated packages',
    aliases: ['out', 'old', 'new'],
    handler: async () => {
        await outdated();
    },
};

export default command;
