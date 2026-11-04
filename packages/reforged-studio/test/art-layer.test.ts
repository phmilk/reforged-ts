/**
 * Seam 3, the art layer: `readArtLayer` on a preferences file the tests
 * write in a temporary folder, and a map's Supported Modes as
 * `war3map.w3i` stores them. The tests assert the art layer chosen.
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  allowedArtLayers,
  findWorldEditorPreferences,
  readArtLayer,
  SUPPORTED_MODE_BITS,
  type PreferencesMachine,
} from "../src/index.js";
import { tempDir } from "./support/casc.js";

/** A `WorldEditPreferences.txt` whose `[Misc]` section holds `misc`. */
async function preferences(misc: string): Promise<string> {
  const file = join(await tempDir("prefs"), "WorldEditPreferences.txt");
  await writeFile(
    file,
    `[Test Map]\r\nhd=0\r\n\r\n[Misc]\r\nPreviewer Height=311\r\n${misc}`,
  );
  return file;
}

describe("readArtLayer", () => {
  it("takes the World Editor's Asset Mode preference: 0 SD, 1 HD, 2 DE", async () => {
    expect(
      await readArtLayer({
        preferencesFile: await preferences("assetMode=0\r\n"),
      }),
    ).toBe("sd");
    expect(
      await readArtLayer({
        preferencesFile: await preferences("assetMode=1\r\n"),
      }),
    ).toBe("hd");
    expect(
      await readArtLayer({
        preferencesFile: await preferences("assetMode=2\r\n"),
      }),
    ).toBe("de");
  });

  // #842 saw the World Editor run in SD under assetMode=-1 with hd=1:
  // docs/research/world-editor-asset-mode.md.
  it.each(["0", "1", "2"])(
    "is SD for the Asset Mode Default, whatever the preference's hd: hd=%s",
    async (hd) => {
      expect(
        await readArtLayer({
          preferencesFile: await preferences(`assetMode=-1\r\nhd=${hd}\r\n`),
        }),
      ).toBe("sd");
    },
  );

  it("defaults to HD when the preference cannot be read", async () => {
    const folder = await tempDir("prefs");
    expect(
      await readArtLayer({ preferencesFile: join(folder, "missing.txt") }),
    ).toBe("hd");
    expect(await readArtLayer({ preferencesFile: await preferences("") })).toBe(
      "hd",
    );
    expect(
      await readArtLayer({
        preferencesFile: await preferences("assetMode=7\r\n"),
      }),
    ).toBe("hd");
    expect(await readArtLayer({})).toBe("hd");
  });

  it("limits the preference to the map's Supported Modes", async () => {
    const de = await preferences("assetMode=2\r\n");
    const sd = await preferences("assetMode=0\r\n");

    // A bit mask, as #842 read it back from maps the World Editor saved:
    // docs/research/world-editor-asset-mode.md.
    expect(SUPPORTED_MODE_BITS).toEqual({ sd: 1, hd: 2, de: 4 });
    // SD and HD, the World Editor's default: a DE preference reads SD.
    expect(await readArtLayer({ preferencesFile: de, supportedModes: 3 })).toBe(
      "sd",
    );
    // All three: the preference as it is.
    expect(await readArtLayer({ preferencesFile: de, supportedModes: 7 })).toBe(
      "de",
    );
    // HD and DE: an SD preference reads HD.
    expect(await readArtLayer({ preferencesFile: sd, supportedModes: 6 })).toBe(
      "hd",
    );
    // HD only: a DE preference reads HD.
    expect(await readArtLayer({ preferencesFile: de, supportedModes: 2 })).toBe(
      "hd",
    );
    expect(await readArtLayer({ preferencesFile: de, supportedModes: 1 })).toBe(
      "sd",
    );
    expect(await readArtLayer({ preferencesFile: sd, supportedModes: 4 })).toBe(
      "de",
    );
    expect(await readArtLayer({ supportedModes: 1 })).toBe("sd");
    // A value the World Editor does not write limits nothing.
    expect(await readArtLayer({ preferencesFile: sd, supportedModes: 0 })).toBe(
      "sd",
    );
  });
});

describe("allowedArtLayers", () => {
  it.each([
    [1, ["sd"]],
    [2, ["hd"]],
    [3, ["sd", "hd"]],
    [4, ["de"]],
    [5, ["sd", "de"]],
    [6, ["hd", "de"]],
    [7, ["sd", "hd", "de"]],
  ])("offers the bits of the map's Supported Modes: %i", (modes, layers) => {
    expect(allowedArtLayers(modes)).toEqual(layers);
  });

  it("offers every layer when the Supported Modes hold none of the three bits", () => {
    expect(allowedArtLayers(undefined)).toEqual(["sd", "hd", "de"]);
    expect(allowedArtLayers(0)).toEqual(["sd", "hd", "de"]);
    expect(allowedArtLayers(8)).toEqual(["sd", "hd", "de"]);
  });

  it("reads the three bits alone, whatever the others hold", () => {
    expect(allowedArtLayers(9)).toEqual(["sd"]);
    expect(allowedArtLayers(-1)).toEqual(["sd", "hd", "de"]);
  });
});

describe("findWorldEditorPreferences", () => {
  /** A machine whose programs answer from `outputs`, by command; the commands run are kept. */
  function machine(
    platform: NodeJS.Platform,
    options: {
      wsl?: boolean;
      env?: Record<string, string>;
      outputs?: Record<string, string | undefined>;
    } = {},
  ): PreferencesMachine & { ran: string[] } {
    const ran: string[] = [];
    return {
      platform,
      wsl: options.wsl ?? false,
      env: options.env ?? {},
      ran,
      run: (command, args) => {
        ran.push([command, ...args].join(" "));
        return Promise.resolve(options.outputs?.[command]);
      },
    };
  }

  it("takes the game's user folder WC3_USER_FOLDER names", async () => {
    const found = machine("win32", {
      env: { WC3_USER_FOLDER: "D:\\Games\\Warcraft III" },
    });
    expect(await findWorldEditorPreferences(found)).toBe(
      "D:\\Games\\Warcraft III\\WorldEditPreferences.txt",
    );
    expect(found.ran).toEqual([]);
  });

  it("asks Windows for the Documents known folder, which OneDrive may hold", async () => {
    const windows = machine("win32", {
      outputs: { powershell: "C:\\Users\\night\\OneDrive\\Documentos" },
    });
    expect(await findWorldEditorPreferences(windows)).toBe(
      "C:\\Users\\night\\OneDrive\\Documentos\\Warcraft III\\WorldEditPreferences.txt",
    );
    expect(windows.ran[0]).toContain("GetFolderPath('MyDocuments')");
  });

  it("asks Windows through interop under WSL, at the folder's WSL path", async () => {
    const wsl = machine("linux", {
      wsl: true,
      outputs: {
        "powershell.exe": "C:\\Users\\night\\Documents",
        wslpath: "/mnt/c/Users/night/Documents",
      },
    });
    expect(await findWorldEditorPreferences(wsl)).toBe(
      "/mnt/c/Users/night/Documents/Warcraft III/WorldEditPreferences.txt",
    );
    expect(wsl.ran[1]).toBe("wslpath -u C:\\Users\\night\\Documents");
  });

  it("finds none elsewhere, or when Windows does not answer", async () => {
    expect(await findWorldEditorPreferences(machine("linux"))).toBeUndefined();
    expect(await findWorldEditorPreferences(machine("darwin"))).toBeUndefined();
    expect(await findWorldEditorPreferences(machine("win32"))).toBeUndefined();
    expect(
      await findWorldEditorPreferences(machine("linux", { wsl: true })),
    ).toBeUndefined();
  });
});
