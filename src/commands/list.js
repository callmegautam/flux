import { list } from '../index.js';

export default {
    command: 'list',
    describe: 'List installed packages',
    aliases: ['ls', 'show'],
    handler: async () => {
        await list();
    },
};
