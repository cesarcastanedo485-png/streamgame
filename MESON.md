# Meson: hands-free Bubblewrap (Linux sandbox) build

This project includes a **one-command** Meson setup to build and install the **Linux bubblewrap** sandbox ([containers/bubblewrap](https://github.com/containers/bubblewrap)). That’s the **sandbox/runtime** used by Flatpak and others — not the Android PWA “Bubblewrap” used for the APK (that’s `npm run build-apk`).

## One-command build and install

**On Linux** (or WSL), from this repo root:

```bash
chmod +x scripts/build-bubblewrap-sandbox.sh
./scripts/build-bubblewrap-sandbox.sh
```

Or via npm:

```bash
npm run build-bubblewrap-sandbox
```

The script will:

1. Clone [containers/bubblewrap](https://github.com/containers/bubblewrap) into `bubblewrap-src/` (or update it).
2. Run `meson _builddir` (with `--prefix=$HOME/.local` so no `sudo`).
3. Run `meson compile -C _builddir`.
4. Run `meson test -C _builddir`.
5. Run `meson install -C _builddir`.

After that, `bwrap` is in `$HOME/.local/bin`. Add that to your `PATH` if it isn’t already.

## Requirements

- **Linux** (or WSL). The bubblewrap sandbox is Linux-only.
- **Meson** (≥ 0.49) and **Ninja**.
- Build deps (e.g. **libcap** with pkg-config).

Install them, for example:

- **Ubuntu / Debian**
  ```bash
  sudo apt install meson ninja-build libcap-dev
  ```
- **Fedora**
  ```bash
  sudo dnf install meson ninja-build libcap-devel
  ```

## Install prefix

By default the script uses `--prefix=$HOME/.local` so install doesn’t require `sudo`. To use a different prefix:

```bash
BUBBLEWRAP_INSTALL_PREFIX=/opt/bwrap ./scripts/build-bubblewrap-sandbox.sh
```

(You may need `sudo` for a system-wide prefix.)

## Manual Meson commands (same as upstream)

If you prefer to run Meson yourself inside a clone of bubblewrap:

```bash
cd bubblewrap-src   # or your clone
meson _builddir
meson compile -C _builddir
meson test -C _builddir
meson install -C _builddir
```

## Windows

The **bubblewrap sandbox** is a Linux binary. On Windows you can:

- Use **WSL** and run the script inside WSL, or  
- Build on a Linux machine or VM.

For building the **Android APK** (PWA wrapper) on Windows, use `npm run build-apk`; that does not use Meson or the Linux bubblewrap.
