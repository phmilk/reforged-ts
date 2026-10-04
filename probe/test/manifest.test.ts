import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AuthorError } from "../src/errors.js";
import { TYPINGS_MANIFEST } from "../src/folders.js";
import { typingsManifest } from "../src/manifest.js";

/** A temporary reforged-types folder whose `vendor/` holds `patches`. */
async function typesFolder(patches: readonly string[]): Promise<string> {
  const folder = await mkdtemp(path.join(tmpdir(), "probe-types-"));
  for (const patch of patches) {
    await mkdir(path.join(folder, "vendor", patch), { recursive: true });
  }
  return folder;
}

describe("typingsManifest", () => {
  it("is the manifest of the Game version of the newest vendored Build, Builds ordered by number", async () => {
    const folder = await typesFolder([
      "3.0.0.24268",
      "3.1.0.9000",
      "3.1.0.25000",
      "3.0.1.30000",
    ]);

    expect(typingsManifest(folder)).toBe(
      path.join(folder, "3.1.0", "manifest.json"),
    );
  });

  it("passes over what is not a Build in the vendor folder", async () => {
    const folder = await typesFolder(["3.0.0.24268", "notes", "4.0"]);

    expect(typingsManifest(folder)).toBe(
      path.join(folder, "3.0.0", "manifest.json"),
    );
  });

  it("refuses a vendor folder without a Build", async () => {
    const folder = await typesFolder([]);

    expect(() => typingsManifest(folder)).toThrow(
      new AuthorError(
        `${path.join(folder, "vendor")} holds no vendored Build, such as 3.0.0.24268: the Probes compile against the Typings of the newest.`,
      ),
    );
  });

  it("is what the Probe runner builds against in the workspace", () => {
    expect(TYPINGS_MANIFEST).toMatch(
      /reforged-types[\\/]3\.0\.0[\\/]manifest\.json$/,
    );
  });
});
