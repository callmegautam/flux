# Flux — Developer Guide

How to work on Flux locally and how a change travels from your machine to a published release.

---

## Requirements

| Tool | Version | Needed for |
| --- | --- | --- |
| Node.js | 18+ | running and building Flux |
| pnpm | 9+ | dependency management (the repo uses `pnpm-lock.yaml`) |
| Bun | 1.1+ | building standalone binaries only — not needed for normal development |

---

## Setup

```sh
git clone https://github.com/callmegautam/flux.git
cd flux
pnpm install
```

`pnpm install` runs `prepare`, which regenerates `src/version.ts` and compiles to `dist/`. If pnpm asks you to approve a build script for `esbuild`, that is expected — it comes from `tsx` and is already allowed in `pnpm-workspace.yaml`.

---

## Project layout

```
bin/flux.ts          CLI entry point: yargs setup, timer, command registration
src/commands/        yargs command definitions (flags, positionals, handlers)
src/services/        the logic behind each command
src/utils/           registry HTTP, tarball download, tar extraction, package.json IO, logger
src/types/           NpmPackument and PackageJson interfaces
src/version.ts       GENERATED from package.json — do not edit by hand
scripts/             version codegen and the binary build driver
```

The layering is strict and worth preserving: **commands** parse input and call **services**, services orchestrate **utils**, and utils do the IO. A command should not perform filesystem or network work directly.

Flux is ESM and compiled with `moduleResolution: nodenext`, so **all relative imports must carry a `.js` extension even in `.ts` files**:

```ts
import logger from '../utils/logger.js';
```

### House style

- **No comments in source files.** Names and structure carry the meaning. Shebangs are not comments and stay.
- `strict` and `noUncheckedIndexedAccess` are on. Fix the type error rather than casting; `any` and `@ts-ignore` should not appear in a diff.
- Index access is `T | undefined`. Assign to a local and narrow it before use.
- `catch` bindings are `unknown` — use `getErrorMessage()` from `src/utils/errors.ts`, or `axios.isAxiosError()` for HTTP failures.

---

## Development loop

Run the CLI straight from TypeScript, no build step:

```sh
pnpm dev -- install chalk
pnpm dev -- list
```

Type-check while you work:

```sh
pnpm typecheck
```

Build the JavaScript output:

```sh
pnpm build          # regenerates src/version.ts, then runs tsc into dist/
node dist/bin/flux.js --help
```

### Testing a change end to end

There is no automated test suite yet, so exercise changes against a scratch project. Never test in the Flux repo itself — Flux rewrites `package.json` and `node_modules`.

```sh
mkdir -p /tmp/flux-test && cd /tmp/flux-test
node ~/dev/flux/dist/bin/flux.js init
node ~/dev/flux/dist/bin/flux.js install chalk
node ~/dev/flux/dist/bin/flux.js install @types/semver   # scoped packages
node ~/dev/flux/dist/bin/flux.js list
node ~/dev/flux/dist/bin/flux.js outdated
node ~/dev/flux/dist/bin/flux.js uninstall
node ~/dev/flux/dist/bin/flux.js clear
```

Always include one **scoped** package. Scope handling affects both the registry URL and the cache path, and it is the easiest thing to break.

To test the real global-install path:

```sh
npm pack
npm install -g ./fluxpm-<version>.tgz
flux --help
npm uninstall -g fluxpm
```

### Cache

Downloaded tarballs are cached per user:

| OS | Location |
| --- | --- |
| Linux | `$XDG_CACHE_HOME/flux`, default `~/.cache/flux` |
| macOS | `~/Library/Caches/flux` |
| Windows | `%LOCALAPPDATA%\flux\Cache` |

Override with `FLUX_CACHE_DIR`, which is useful for isolating a test run:

```sh
FLUX_CACHE_DIR=/tmp/flux-cache node dist/bin/flux.js install chalk
```

Clear it with `flux clear`.

---

## Standalone binaries

Built with `bun build --compile`. Bun is needed only to build them; the output is self-contained and runs without Node.

```sh
pnpm build:binaries                        # all five targets
node scripts/build-binaries.mjs bun-linux-x64   # a single target
```

Output lands in `dist-bin/` (git-ignored): `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, `windows-x64`. All five cross-compile from any one machine.

Because a compiled binary has no `package.json` to read at runtime, the version is baked in as a constant. That is why `src/version.ts` is generated — **never read `package.json` at runtime**, import `VERSION` instead.

---

## Contributing a change

1. Branch off `dev`:

    ```sh
    git checkout dev && git pull
    git checkout -b feature/your-change
    ```

2. Make the change. Before pushing:

    ```sh
    pnpm typecheck
    pnpm build
    ```

    plus the scratch-project run above for anything touching install, download, or extraction.

3. Commit using [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, with `!` for a breaking change.

4. Open a pull request against `dev` describing what changed and how you verified it.

### Branching model

`dev` is the integration branch; `main` is what gets released. **History is linear** — `main` only ever fast-forwards:

```sh
git checkout main
git merge --ff-only dev
git push origin main
```

If `--ff-only` is rejected, `main` has moved. Rebase `dev` onto it (`git rebase main`) rather than creating a merge commit.

---

## Releasing

Maintainers only. Flux ships to two places from one tag: **npm** (`fluxpm`) and **GitHub Releases** (standalone binaries).

### One-time setup

- An npm account with publish rights on `fluxpm`.
- For automated publishing, an `NPM_TOKEN` (Automation type) repository secret under **Settings → Secrets and variables → Actions**. Without it the release workflow still builds and uploads binaries, and simply skips the npm step.

### Steps

1. Land everything on `main` via the fast-forward flow above, and confirm it is green:

    ```sh
    pnpm typecheck && pnpm build
    ```

2. Bump the version. `src/version.ts` is regenerated by the build, so do not edit it:

    ```sh
    npm version patch --no-git-tag-version   # or minor / major
    pnpm build
    ```

3. Commit and push the bump:

    ```sh
    git commit -am "chore: release vX.Y.Z"
    git push origin main
    ```

4. Tag and push. The tag must match `package.json` — the workflow fails the release if they disagree:

    ```sh
    git tag vX.Y.Z
    git push origin vX.Y.Z
    ```

That tag triggers `.github/workflows/release.yml`, which:

- cross-compiles all five binaries with Bun,
- generates `SHA256SUMS`,
- creates the GitHub Release with generated notes and uploads every artifact,
- publishes to npm with provenance, if `NPM_TOKEN` is set.

### Publishing to npm by hand

If `NPM_TOKEN` is not configured, or you want to publish outside a tag:

```sh
npm login
npm publish
```

`prepublishOnly` regenerates the version and recompiles, so a stale `dist/` cannot be published. Check what will ship first:

```sh
npm publish --dry-run
```

Only `dist/`, `README.md`, and `LICENSE` are included, per the `files` field.

### After a release

Verify all three install paths:

```sh
npm install -g fluxpm && flux --version

curl -fsSL https://raw.githubusercontent.com/callmegautam/flux/main/install.sh | sh

irm https://raw.githubusercontent.com/callmegautam/flux/main/install.ps1 | iex
```

The shell installers resolve the newest **non-prerelease** GitHub Release. A release marked pre-release is invisible to them, and `install.sh` will exit with `could not determine latest version`. Pin explicitly to test one:

```sh
curl -fsSL .../install.sh | FLUX_VERSION=vX.Y.Z sh
```

---

## Known gaps

Worth knowing before you file a bug or pick up work:

- **No dependency resolution.** Only direct dependencies are installed; transitive dependencies are not walked.
- **No lockfile**, so installs are not deterministic.
- **No semver range resolution.** A `^1.2.3` range resolves to the latest published version rather than the newest match within the range.
- **No test suite.** Verification is the manual scratch-project run described above.
- `flux search` appears in the README but is not implemented; `flux info` covers the closest behaviour.
