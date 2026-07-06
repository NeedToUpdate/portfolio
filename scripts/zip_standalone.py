#!/usr/bin/env python3
"""Packages the Next.js standalone build into .next/standalone.zip for Lambda.

The standalone output contains the server and traced node_modules, but not
the static assets or public files. This script copies those in, normalizes
the cache handler path (Windows builds serialize it with backslashes), and
zips everything with run.sh marked executable.
"""

import json
import os
import re
import shutil
import stat
import zipfile

STANDALONE_DIR = os.path.join(".next", "standalone")
ZIP_PATH = os.path.join(".next", "standalone.zip")


def fail(message: str) -> None:
    raise SystemExit(f"error: {message}")


def fix_cache_handler_paths() -> None:
    """Rewrites the cacheHandler path to a portable relative posix path."""
    server_js = os.path.join(STANDALONE_DIR, "server.js")
    required_files = os.path.join(STANDALONE_DIR, ".next", "required-server-files.json")

    if os.path.exists(server_js):
        with open(server_js, "r", encoding="utf-8") as f:
            content = f.read()
        content = re.sub(
            r'"cacheHandler":\s*"[^"]*isr-cache-handler\.js"',
            '"cacheHandler":"../lib/isr-cache-handler.js"',
            content,
        )
        with open(server_js, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"normalized cacheHandler path in {server_js}")

    if os.path.exists(required_files):
        with open(required_files, "r", encoding="utf-8") as f:
            data = json.load(f)
        if "config" in data and data["config"].get("cacheHandler"):
            # Resolved relative to the .next directory at runtime.
            data["config"]["cacheHandler"] = "../lib/isr-cache-handler.js"
            with open(required_files, "w", encoding="utf-8") as f:
                json.dump(data, f)
            print(f"normalized cacheHandler path in {required_files}")


def copy_assets() -> None:
    """Static assets and public files are not traced into standalone output."""
    static_src = os.path.join(".next", "static")
    static_dst = os.path.join(STANDALONE_DIR, ".next", "static")
    if os.path.exists(static_dst):
        shutil.rmtree(static_dst)
    shutil.copytree(static_src, static_dst)
    print(f"copied {static_src} -> {static_dst}")

    public_dst = os.path.join(STANDALONE_DIR, "public")
    if os.path.exists(public_dst):
        shutil.rmtree(public_dst)
    shutil.copytree("public", public_dst)
    print(f"copied public -> {public_dst}")

    # Copy the entrypoint with LF endings; CRLF breaks the shebang in Lambda.
    with open(os.path.join("scripts", "run.cjs"), "rb") as f:
        entrypoint = f.read().replace(b"\r\n", b"\n")
    with open(os.path.join(STANDALONE_DIR, "run.cjs"), "wb") as f:
        f.write(entrypoint)
    print("copied scripts/run.cjs")


def ensure_cache_handler() -> None:
    """The cache handler must ship inside the bundle at lib/."""
    lib_dst = os.path.join(STANDALONE_DIR, "lib")
    os.makedirs(lib_dst, exist_ok=True)
    shutil.copy(os.path.join("lib", "isr-cache-handler.js"), lib_dst)
    print("copied lib/isr-cache-handler.js")


def zip_standalone() -> None:
    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(STANDALONE_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, STANDALONE_DIR).replace(os.sep, "/")
                info = zipfile.ZipInfo(arcname)
                # Lambda executes the entrypoint directly; it needs the exec bit.
                mode = 0o755 if arcname == "run.cjs" else 0o644
                info.external_attr = (stat.S_IFREG | mode) << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                with open(file_path, "rb") as f:
                    zf.writestr(info, f.read())
    size_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)
    print(f"wrote {ZIP_PATH} ({size_mb:.1f} MB)")


def main() -> None:
    if not os.path.exists(STANDALONE_DIR):
        fail(f"{STANDALONE_DIR} not found. Run 'npm run build' first.")
    copy_assets()
    ensure_cache_handler()
    fix_cache_handler_paths()
    zip_standalone()


if __name__ == "__main__":
    main()
