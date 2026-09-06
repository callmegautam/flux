#!/bin/sh
set -eu

REPO="callmegautam/flux"
INSTALL_DIR="${FLUX_INSTALL_DIR:-$HOME/.local/bin}"

err() { printf 'error: %s\n' "$1" >&2; exit 1; }

command -v curl >/dev/null 2>&1 || err "curl is required"

case "$(uname -s)" in
    Linux)  OS=linux ;;
    Darwin) OS=darwin ;;
    *)      err "unsupported OS: $(uname -s). Try: npm i -g fluxpm" ;;
esac

case "$(uname -m)" in
    x86_64|amd64)  ARCH=x64 ;;
    arm64|aarch64) ARCH=arm64 ;;
    *)             err "unsupported architecture: $(uname -m). Try: npm i -g fluxpm" ;;
esac

VERSION="${FLUX_VERSION:-}"
if [ -z "$VERSION" ]; then
    VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
        | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -n1)
    [ -n "$VERSION" ] || err "could not determine latest version; set FLUX_VERSION"
fi

ASSET="flux-${OS}-${ARCH}"
URL="https://github.com/$REPO/releases/download/${VERSION}/${ASSET}"

printf 'Installing flux %s (%s-%s)...\n' "$VERSION" "$OS" "$ARCH"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

curl -fsSL "$URL" -o "$TMP/flux" || err "download failed: $URL"

if curl -fsSL "https://github.com/$REPO/releases/download/${VERSION}/SHA256SUMS" -o "$TMP/SHA256SUMS" 2>/dev/null; then
    if command -v sha256sum >/dev/null 2>&1; then
        EXPECTED=$(grep " ${ASSET}\$" "$TMP/SHA256SUMS" | awk '{print $1}')
        ACTUAL=$(sha256sum "$TMP/flux" | awk '{print $1}')
    elif command -v shasum >/dev/null 2>&1; then
        EXPECTED=$(grep " ${ASSET}\$" "$TMP/SHA256SUMS" | awk '{print $1}')
        ACTUAL=$(shasum -a 256 "$TMP/flux" | awk '{print $1}')
    fi
    if [ -n "${EXPECTED:-}" ] && [ "${EXPECTED}" != "${ACTUAL:-}" ]; then
        err "checksum mismatch for $ASSET"
    fi
fi

mkdir -p "$INSTALL_DIR"
chmod +x "$TMP/flux"
mv "$TMP/flux" "$INSTALL_DIR/flux"

printf 'Installed flux to %s/flux\n' "$INSTALL_DIR"

case ":$PATH:" in
    *":$INSTALL_DIR:"*) printf 'Run: flux --help\n' ;;
    *)
        printf '\n%s is not on your PATH. Add it:\n\n' "$INSTALL_DIR"
        printf '  export PATH="%s:$PATH"\n\n' "$INSTALL_DIR"
        ;;
esac
