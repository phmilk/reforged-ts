/**
 * actionlint without a global install: the release build pinned here is
 * downloaded once, checked against its published checksum and kept in the
 * workspace's `node_modules/.cache`. CI runs the same version through its
 * published action (`.github/workflows/ci.yml`); bump both together.
 */
import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { delimiter, join } from "node:path";
import type { Runner } from "./process.js";

/** The actionlint release the root `actionlint` script runs. */
export const ACTIONLINT_VERSION = "1.7.12";

/**
 * The SHA-256 of each release archive, from the release's
 * `actionlint_<version>_checksums.txt`, by `<os>_<arch>` of its file name.
 */
const CHECKSUMS: Readonly<Partial<Record<string, string>>> = {
  darwin_amd64:
    "5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644",
  darwin_arm64:
    "aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f",
  linux_amd64:
    "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8",
  linux_arm64:
    "325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6",
  windows_amd64:
    "6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9",
  windows_arm64:
    "cadcf7ea4efe3a68728893813643cebe1185e5b1d4be5b96245f65c9a4d5ea41",
};

const OS: Readonly<Partial<Record<NodeJS.Platform, string>>> = {
  darwin: "darwin",
  linux: "linux",
  win32: "windows",
};

const ARCH: Readonly<Partial<Record<string, string>>> = {
  x64: "amd64",
  arm64: "arm64",
};

/** A release archive of actionlint and the executable it holds. */
export interface ActionlintAsset {
  version: string;
  url: string;
  /** The archive's file name. */
  archive: string;
  /** Its SHA-256, lowercase hexadecimal. */
  sha256: string;
  /** The executable's file name inside the archive. */
  executable: string;
}

/**
 * The pinned archive for Node's `platform` and `arch`; `undefined` when none
 * is pinned for them.
 */
export function actionlintAsset(
  platform: NodeJS.Platform,
  arch: string,
): ActionlintAsset | undefined {
  const os = OS[platform];
  const target = `${os ?? ""}_${ARCH[arch] ?? ""}`;
  const sha256 = CHECKSUMS[target];
  if (os === undefined || sha256 === undefined) return undefined;
  const archive = `actionlint_${ACTIONLINT_VERSION}_${target}.${os === "windows" ? "zip" : "tar.gz"}`;
  return {
    version: ACTIONLINT_VERSION,
    url: `https://github.com/rhysd/actionlint/releases/download/v${ACTIONLINT_VERSION}/${archive}`,
    archive,
    sha256,
    executable: os === "windows" ? "actionlint.exe" : "actionlint",
  };
}

/** Downloads a URL; `fetch` in production. */
export type Fetcher = (url: string) => Promise<Response>;

/**
 * The tar that extracts the archive: on Windows the system's bsdtar, which
 * reads zip (Git Bash's GNU tar, first on its PATH, does not).
 */
export function tarCommand(
  platform: NodeJS.Platform,
  env: Readonly<Record<string, string | undefined>>,
): string {
  return platform === "win32"
    ? join(env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe")
    : "tar";
}

async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  );
}

/** The installed executable, or why it could not be installed. */
export type InstallResult =
  { ok: true; path: string } | { ok: false; message: string };

/**
 * The path of `asset`'s executable under `cacheDir`, downloaded, verified
 * and extracted there first when it is not yet. Only a verified archive is
 * extracted, and the executable is moved into place last, so the cache
 * never holds a partial or unverified one.
 */
export async function installActionlint(options: {
  asset: ActionlintAsset;
  cacheDir: string;
  fetcher: Fetcher;
  run: Runner;
  tar: string;
}): Promise<InstallResult> {
  const { asset, fetcher, run, tar } = options;
  const dir = join(
    options.cacheDir,
    asset.archive.replace(/\.(zip|tar\.gz)$/, ""),
  );
  const path = join(dir, asset.executable);
  if (await exists(path)) return { ok: true, path };

  const response = await fetcher(asset.url);
  if (!response.ok) {
    return {
      ok: false,
      message:
        `Downloading ${asset.url} failed: HTTP ${String(response.status)}. ` +
        `Check the network, or that actionlint ${asset.version} is released for this platform (github.com/rhysd/actionlint/releases).`,
    };
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== asset.sha256) {
    return {
      ok: false,
      message:
        `The checksum of ${asset.url} is ${actual}, not the pinned ${asset.sha256}: ` +
        "the download is not the release actionlint published. " +
        `After a bump of ACTIONLINT_VERSION, copy the checksums from the release's actionlint_${asset.version}_checksums.txt into release/src/actionlint.ts.`,
    };
  }

  await mkdir(options.cacheDir, { recursive: true });
  const work = await mkdtemp(join(options.cacheDir, "download-"));
  try {
    const archive = join(work, asset.archive);
    await writeFile(archive, bytes);
    const code = await run({
      command: tar,
      args: ["-xf", archive, "-C", work, asset.executable],
    });
    if (code !== 0) {
      return {
        ok: false,
        message: `Extracting ${asset.executable} from ${asset.archive} with ${tar} failed (exit code ${String(code)}).`,
      };
    }
    await mkdir(dir, { recursive: true });
    await rename(join(work, asset.executable), path);
    return { ok: true, path };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

/** Whether an executable named `name` is in a folder of the `PATH` value. */
export async function onPath(
  name: string,
  path: string | undefined,
  platform: NodeJS.Platform,
): Promise<boolean> {
  const file = platform === "win32" ? `${name}.exe` : name;
  for (const dir of (path ?? "").split(delimiter)) {
    if (dir !== "" && (await exists(join(dir, file)))) return true;
  }
  return false;
}
