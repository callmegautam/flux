# Developer Guide

How to work on Flux locally, and how a change gets from your machine to a published release.

## Requirements

| Tool | Version | Needed for |
| --- | --- | --- |
| Node.js | 18+ | running and building Flux |
| pnpm | 9+ | dependency management |
| Bun | 1.1+ | building standalone binaries only |

Bun is not needed for normal development.

## Setup

```sh
git clone https://github.com/callmegautam/flux.git
cd flux
pnpm install
```

`pnpm install` runs `prepare`, which regenerates `src/version.ts` and compiles to `dist/`. If pnpm asks you to approve a build script for `esbuild`, that is expected. It comes from `tsx` and is already allowed in `pnpm-workspace.yaml`.

## Project layout

```
bin/flux.ts          CLI entry point: yargs setup, timer, command registration
src/commands/        yargs command definitions (flags, positionals, handlers)
src/services/        the logic behind each command
src/utils/           registry HTTP, downloads, tar extraction, package.json IO, logging
src/types/           NpmPackument and PackageJson interfaces
src/version.ts       generated from package.json, do not edit by hand
scripts/             version codegen and the binary build driver
```

The layering is worth preserving. Commands parse input and call services, services orchestrate utils, and utils do the IO. A command should not perform filesystem or network work directly.

Flux is ESM and compiles with `moduleResolution: nodenext`, so all relative imports must carry a `.js` extension even in `.ts` files:

```ts
import logger from '../utils/logger.js';
```

## Style

- No comments in source files. Names and structure should carry the meaning. Shebangs are not comments and stay.
- `strict` and `noUncheckedIndexedAccess` are on. Fix the type error rather than casting. `any` and `@ts-ignore` should not appear in a diff.
- Index access returns `T | undefined`. Assign to a local and narrow it before use.
- `catch` bindings are `unknown`. Use `getErrorMessage()` from `src/utils/errors.ts`, or `axios.isAxiosError()` for HTTP failures.

## Development

Run the CLI straight from TypeScript with no build step:

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
pnpm build
node dist/bin/flux.js --help
```

### Testing a change

There is no automated test suite yet, so exercise changes against a scratch project. Do not test inside the Flux repo, because Flux rewrites `package.json` and `node_modules`.

```sh
mkdir -p /tmp/flux-test && cd /tmp/flux-test
node ~/dev/flux/dist/bin/flux.js init
node ~/dev/flux/dist/bin/flux.js install chalk
node ~/dev/flux/dist/bin/flux.js install @types/semver
node ~/dev/flux/dist/bin/flux.js list
node ~/dev/flux/dist/bin/flux.js outdated
node ~/dev/flux/dist/bin/flux.js uninstall
node ~/dev/flux/dist/bin/flux.js clear
```

Always include one scoped package such as `@types/semver`. Scope handling affects both the registry URL and the cache path, and it is the easiest thing to break.

To test the real global install path:

```sh
npm pack
npm install -g ./iamgautamsuthar-flux-<version>.tgz
flux --help
npm uninstall -g @iamgautamsuthar/flux
```

### Cache

Downloaded tarballs are cached per user:

| Platform | Location |
| --- | --- |
| Linux | `$XDG_CACHE_HOME/flux`, or `~/.cache/flux` |
| macOS | `~/Library/Caches/flux` |
| Windows | `%LOCALAPPDATA%\flux\Cache` |

Override with `FLUX_CACHE_DIR`, which is useful for isolating a test run:

```sh
FLUX_CACHE_DIR=/tmp/flux-cache node dist/bin/flux.js install chalk
```

Clear it with `flux clear`.

## Standalone binaries

Built with `bun build --compile`. Bun is needed only to build them. The output is self-contained and runs without Node.

```sh
pnpm build:binaries
node scripts/build-binaries.mjs bun-linux-x64
```

Output lands in `dist-bin/`, which is git-ignored: `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, and `windows-x64`. All five cross-compile from any one machine.

A compiled binary has no `package.json` to read at runtime, so the version is baked in as a constant. That is why `src/version.ts` is generated. Never read `package.json` at runtime, import `VERSION` instead.

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

    Also run the scratch-project check above for anything touching install, download, or extraction.

3. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, with `!` for a breaking change.

4. Open a pull request against `dev` describing what changed and how you verified it.

### Branching

`dev` is the integration branch and `main` is what gets released. History is linear, so `main` only ever fast-forwards:

```sh
git checkout main
git merge --ff-only dev
git push origin main
```

If `--ff-only` is rejected, `main` has moved. Rebase `dev` onto it with `git rebase main` rather than creating a merge commit.

## Releasing

Maintainers only. Flux ships to two places from one tag: npm as `@iamgautamsuthar/flux`, and GitHub Releases for the standalone binaries.

### Steps

1. Land everything on `main` using the fast-forward flow above, and confirm it builds:

    ```sh
    pnpm typecheck && pnpm build
    ```

2. Bump the version. `src/version.ts` is regenerated by the build, so do not edit it:

    ```sh
    npm version patch --no-git-tag-version
    pnpm build
    ```

3. Commit and push the bump:

    ```sh
    git commit -am "chore: release vX.Y.Z"
    git push origin main
    ```

4. Tag and push. The tag must match `package.json`, since the workflow fails the release if they disagree:

    ```sh
    git tag vX.Y.Z
    git push origin vX.Y.Z
    ```

The tag triggers `.github/workflows/release.yml`, which cross-compiles all five binaries with Bun, generates `SHA256SUMS`, creates the GitHub Release with generated notes, uploads every artifact, and publishes to npm if `NPM_TOKEN` is set.

### Publishing to npm by hand

```sh
npm login
npm publish
```

`prepublishOnly` regenerates the version and recompiles, so a stale `dist/` cannot be published. Check what will ship first with `npm publish --dry-run`. Only `dist/`, `README.md`, and `LICENSE` are included, per the `files` field.

The package is scoped and needs `--access public` on a first publish. That is already set through `publishConfig` in `package.json`, so plain `npm publish` is enough.

Publishing requires a second factor, because the account is set to `two-factor auth: auth-and-writes`. npm opens a browser to confirm, which needs a real interactive terminal. It fails immediately with `EOTP` when run from a non-TTY, such as a piped shell or an agent session. In that case use a backup code:

```sh
npm publish --otp=YOUR-BACKUP-CODE
```

Automation tokens that bypass 2FA are being restricted by npm. The long-term replacement is trusted publishing, where npm accepts an OIDC identity directly from GitHub Actions with no token and no OTP. `release.yml` already requests `id-token: write` and publishes with `--provenance`, so enabling it only requires adding the trusted publisher under the package settings on npmjs.com.

### After a release

Verify all three install paths:

```sh
npm install -g @iamgautamsuthar/flux && flux --version

curl -fsSL https://raw.githubusercontent.com/callmegautam/flux/main/install.sh | sh

irm https://raw.githubusercontent.com/callmegautam/flux/main/install.ps1 | iex
```

The shell installers resolve the newest non-prerelease GitHub Release. A release marked as a prerelease is invisible to them, and `install.sh` exits with `could not determine latest version`. Pin explicitly to test one:

```sh
curl -fsSL .../install.sh | FLUX_VERSION=vX.Y.Z sh
```

## Known gaps

Worth knowing before filing a bug or picking up work:

- No dependency resolution. Only direct dependencies are installed, and the tree is not walked.
- No lockfile, so installs are not reproducible.
- No version range resolution. A `^1.2.3` range installs the latest published version rather than the newest match within the range.
- No test suite. Verification is the manual scratch-project run described above.
