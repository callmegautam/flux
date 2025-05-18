import { outdated } from '../index.js';

export default {
    command: 'outdated',
    describe: 'List outdated packages',
    aliases: ['out', 'old', 'new'],
    handler: async () => {
        await outdated();
    },
};
