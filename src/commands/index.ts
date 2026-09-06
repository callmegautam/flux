import type { Argv, CommandModule } from 'yargs';
import init from './init.js';
import install from './install.js';
import uninstall from './uninstall.js';
import list from './list.js';
import update from './update.js';
import reinstall from './reinstall.js';
import outdated from './outdated.js';
import run from './run.js';
import info from './info.js';
import clear from './clear.js';

const commands: CommandModule<any, any>[] = [
    init,
    install,
    uninstall,
    list,
    update,
    reinstall,
    outdated,
    run,
    info,
    clear,
];

export default function registerCommands(yargs: Argv): void {
    commands.forEach((command) => yargs.command(command));
}
