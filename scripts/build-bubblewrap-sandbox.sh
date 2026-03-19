#!/usr/bin/env bash
# Hands-free build and install of the Linux bubblewrap sandbox (containers/bubblewrap).
# Requires: Linux, meson, ninja, and build deps (e.g. libcap). Install with:
#   Ubuntu/Debian: sudo apt install meson ninja-build libcap-dev
#   Fedora:        sudo dnf install meson ninja-build libcap-devel
# Run from project root: ./scripts/build-bubblewrap-sandbox.sh
# Or: npm run build-bubblewrap-sandbox (from this repo root).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="${ROOT}/bubblewrap-src"
BUILD_DIR="${SRC_DIR}/_builddir"
# Install to user prefix so no sudo needed
PREFIX="${BUBBLEWRAP_INSTALL_PREFIX:-$HOME/.local}"

if [ ! -d "$SRC_DIR" ]; then
  echo "Cloning containers/bubblewrap into $SRC_DIR ..."
  git clone --depth 1 https://github.com/containers/bubblewrap.git "$SRC_DIR"
else
  echo "Updating $SRC_DIR ..."
  (cd "$SRC_DIR" && git fetch --depth 1 && git reset --hard origin/main)
fi

cd "$SRC_DIR"
echo "Configuring with meson (prefix=$PREFIX) ..."
meson _builddir --prefix="$PREFIX"
echo "Compiling ..."
meson compile -C _builddir
echo "Running tests ..."
meson test -C _builddir
echo "Installing to $PREFIX ..."
meson install -C _builddir

echo "Done. bubblewrap (bwrap) installed to $PREFIX/bin"
echo "Add to PATH if needed: export PATH=\"$PREFIX/bin:\$PATH\""
