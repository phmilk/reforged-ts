/**
 * The real-install check, on a synthetic install: `checkInstall` reads a
 * Built-in object's base values, its icon and its HD model, and says what
 * it found. On a machine with the game, `pnpm --filter reforged-studio
 * studio:check-install` runs it on the real install.
 */
import { describe, expect, it } from "vitest";
import { checkInstall, openStorage } from "../src/index.js";
import { writeStorage } from "./support/casc.js";
import { GAME_FILES } from "./support/game.js";

const ART = {
  "War3.w3mod:_HD.w3mod:ReplaceableTextures/CommandButtons/BTNFootman.dds":
    "icon",
  "War3.w3mod:Footman1.mdx": "sd model",
  "War3.w3mod:_HD.w3mod:Footman1.mdx": "hd model",
};

async function check(files: Readonly<Record<string, string>>) {
  const storage = await writeStorage({ files: { ...GAME_FILES, ...files } });
  return checkInstall(await openStorage(storage.installDir), {
    rawcode: "hfoo",
    icon: "uico",
    model: "ua1m",
  });
}

describe("checkInstall", () => {
  it("reads an object's base values, its icon and its HD model", async () => {
    const result = await check(ART);

    expect(result.ok).toBe(true);
    expect(result.report).toBe(
      [
        "Build 3.0.0.24268, Game data set custom-fk.",
        "The unit hfoo has 6 base values: unam Footman, uhpm 420, ua1t normal.",
        "Its icon (uico) ReplaceableTextures/CommandButtons/BTNFootman.blp: War3.w3mod:_HD.w3mod:ReplaceableTextures/CommandButtons/BTNFootman.dds, 4 bytes.",
        "Its model (ua1m) Footman1.mdx in HD: War3.w3mod:_HD.w3mod:Footman1.mdx, 8 bytes.",
        "",
      ].join("\n"),
    );
  });

  it("fails when the model is not found in the HD layer", async () => {
    const result = await check(
      Object.fromEntries(
        Object.entries(ART).filter(([path]) => !path.includes("_HD.w3mod:F")),
      ),
    );

    expect(result.ok).toBe(false);
    expect(result.report).toContain(
      "Its model (ua1m) Footman1.mdx in HD: not in the HD layer (War3.w3mod:Footman1.mdx).\n",
    );
  });
});
