# Flux

A minimal package manager for JavaScript projects. Flux installs, updates, and removes npm packages from the command line.

Flux is alpha software and is not ready for production use. See [Limitations](#limitations).

## Contents

- [Installation](#installation)
- [Commands](#commands)
- [Configuration](#configuration)
- [How installs work](#how-installs-work)
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
flux install <package>@<range>  Install a specific version or range
flux uninstall [package]      Remove one package, or all of them
flux reinstall [package]      Reinstall one package, or all of them
flux update [package]         Update one package, or all of them
flux list                     List installed dependencies
flux outdated                 Show packages with a newer version available
flux info <package>           Show registry information for a package
flux run <script>             Run a script from package.json
flux clear                    Delete every cache layer
flux cache info               Show the size of each cache layer
flux cache dir                Print the cache location
flux cache clean [--metadata] [--tarballs] [--packages] [--all]
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

`install` also accepts:

- `--save-dev` (`-D`) to record the package under `devDependencies`
- `--offline` to resolve only from the local cache and never hit the network
- `--flux` to resolve tarballs through the Flux registry instead of npm

## Configuration

Registry metadata, tarballs, and extracted packages are cached per user and
shared across every project on the machine:

| Platform | Location |
| --- | --- |
| Linux | `$XDG_CACHE_HOME/flux`, or `~/.cache/flux` |
| macOS | `~/Library/Caches/flux` |
| Windows | `%LOCALAPPDATA%\flux\Cache` |

Set `FLUX_CACHE_DIR` to override this. Run `flux cache info` to see how much
each layer is using, and `flux cache clean --all` to empty it.

| Variable | Default | Purpose |
| --- | --- | --- |
| `FLUX_CACHE_DIR` | platform default above | Cache and store location |
| `FLUX_NETWORK_CONCURRENCY` | `16` | Parallel metadata and tarball requests |
| `FLUX_FS_CONCURRENCY` | `32` | Parallel filesystem link operations |

## How installs work

Flux keeps four separate layers so that installing a package a second time — in
any project on the machine — does no network, download, or extraction work.

```
flux add express
      |
      v
metadata cache      ~/.cache/flux/metadata     "which version, and where?"
      |
      v
tarball store       ~/.cache/flux/tarballs     "do I already have the archive?"
      |
      v
package store       ~/.cache/flux/packages     "do I already have the files?"
      |
      v
node_modules                                   hardlink + symlink
```

Each layer is content-addressed by the package's integrity hash and written
atomically (staged under a temp name, then renamed), so an interrupted install
can never leave a half-written tarball or a partially extracted package behind.

`node_modules` uses a strict, pnpm-style layout: every package is hardlinked
into `node_modules/.flux/<name>@<version>/`, and only your declared
dependencies are symlinked at the top level. Conflicting versions coexist, and
undeclared packages are not importable.

Resolution results are written to `flux-lock.json`. When it matches your
`package.json`, Flux skips resolution entirely and installs straight from the
store. Commit it.

## Limitations

Flux is an alpha release, and these gaps are worth knowing before you rely on it:

- Lifecycle scripts (`preinstall`, `install`, `postinstall`) are never run, so
  packages that compile native code at install time will not work.
- Peer dependencies are resolved but not auto-installed.
- Workspaces and monorepos are not supported.
- The `os` and `cpu` fields are not enforced.
- The store has no garbage collection; use `flux cache clean` to reclaim space.

Planned work includes registry search, a dependency tree viewer, workspace
support, and vulnerability scanning.

## Contributing

Contributions are welcome. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for how to set up the project, run it locally, and publish a release.

The short version:

1. Fork the repository and branch off `dev`.
2. Make your change, then run `pnpm typecheck` and `pnpm build`.
3. Open a pull request against `dev` describing what changed and how you verified it.

Open tasks and known bugs are in the [issues](https://github.com/callmegautam/flux/issues) tab.

## License

[MIT](LICENSE)
