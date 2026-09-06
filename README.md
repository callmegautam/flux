# Flux

A minimal package manager for JavaScript projects. Flux installs, updates, and removes npm packages from the command line.

Flux is alpha software and is not ready for production use. It installs direct dependencies only; see [Limitations](#limitations).

## Contents

- [Installation](#installation)
- [Commands](#commands)
- [Configuration](#configuration)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [License](#license)

## Installation

### npm

Requires Node.js 18 or later.

```sh
npm install -g @iamgautamsuthar/flux
```

To run it without installing:

```sh
npx @iamgautamsuthar/flux --help
```

### Standalone binary

The binary is self-contained and does not require Node.js.

Linux and macOS:

```sh
curl -fsSL https://raw.githubusercontent.com/callmegautam/flux/main/install.sh | sh
```

Windows, in PowerShell. This installs per-user and does not need administrator rights:

```powershell
irm https://raw.githubusercontent.com/callmegautam/flux/main/install.ps1 | iex
```

Binaries for `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, and `windows-x64` are attached to every [release](https://github.com/callmegautam/flux/releases), along with a `SHA256SUMS` file that both install scripts verify automatically.

Both scripts read two optional environment variables:

| Variable | Default |
| --- | --- |
| `FLUX_VERSION` | latest release |
| `FLUX_INSTALL_DIR` | `~/.local/bin` on Unix, `%LOCALAPPDATA%\flux\bin` on Windows |

### Updating

Re-run whichever command you installed with.

### Uninstalling

```sh
npm uninstall -g @iamgautamsuthar/flux
```

For the standalone binary on Unix, delete it:

```sh
rm ~/.local/bin/flux
```

## Commands

```sh
flux init                     Create a package.json
flux install                  Install every dependency in package.json
flux install <package>        Install one package and record it
flux uninstall [package]      Remove one package, or all of them
flux reinstall [package]      Reinstall one package, or all of them
flux update [package]         Update one package, or all of them
flux list                     List installed dependencies
flux outdated                 Show packages with a newer version available
flux info <package>           Show registry information for a package
flux run <script>             Run a script from package.json
flux clear                    Delete the download cache
```

Most commands have aliases, such as `add` for `install` and `ls` for `list`. Run `flux --help` for the full list.

A typical session:

```sh
flux init
flux install express
flux list
flux update express
flux uninstall express
```

Pass `--flux` to `install` to resolve tarballs through the Flux registry instead of npm.

## Configuration

Downloaded tarballs are cached per user:

| Platform | Location |
| --- | --- |
| Linux | `$XDG_CACHE_HOME/flux`, or `~/.cache/flux` |
| macOS | `~/Library/Caches/flux` |
| Windows | `%LOCALAPPDATA%\flux\Cache` |

Set `FLUX_CACHE_DIR` to override this. Run `flux clear` to empty the cache.

## Limitations

Flux is an alpha release, and these gaps are worth knowing before you rely on it:

- Only direct dependencies are installed. Flux does not walk the dependency tree, so most real packages will not work end to end.
- There is no lockfile, so installs are not reproducible.
- Version ranges are not resolved. A `^1.2.3` range installs the latest published version rather than the newest match within the range.
- There is no test suite.

Planned work includes dependency resolution, a lockfile, registry search, a dependency tree viewer, parallel installs, workspace support, and vulnerability scanning.

## Contributing

Contributions are welcome. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for how to set up the project, run it locally, and publish a release.

The short version:

1. Fork the repository and branch off `dev`.
2. Make your change, then run `pnpm typecheck` and `pnpm build`.
3. Open a pull request against `dev` describing what changed and how you verified it.

Open tasks and known bugs are in the [issues](https://github.com/callmegautam/flux/issues) tab.

## License

[MIT](LICENSE)
