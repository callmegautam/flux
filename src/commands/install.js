import { install } from "../index.js";

export default {
    command: "install [package]",
    describe: "Install package(s) from npm registry",
    aliases: ["add"],
    builder: (yargs) => {
        yargs
            .positional("package", {
                description: "The package to install (optional). If not provided, installs project dependencies.",
                type: "string",
            })
            .option("flux", {
                type: "boolean",
                description: "Use flux's package registry",
                default: false,
            });
    },
    handler: async (argv) => {
        if (argv.flux) {
            if (argv.package) {
                await install(argv.package, null, true);
            } else {
                await install(null, null, true);
            }
        } else {
            if (argv.package) {
                await install(argv.package, null, false);
            } else {
                await install(null, null, false);
            }
        }
    },
};
