import type { CommandModule } from 'yargs';
import { list } from '../index.js';

const command: CommandModule = {
    command: 'list',
    describe: 'List installed packages',
    aliases: ['ls', 'show'],
    handler: async () => {
        await list();
    },
};

export default command;
