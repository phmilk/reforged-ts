import { describe, expect, it } from "vitest";
import { AuthorError } from "../src/errors.js";
import {
  customMapDataFolder,
  DOCUMENTS_KEY,
  DOCUMENTS_VALUE,
  USER_FOLDER_VARIABLE,
} from "../src/user-folder.js";
import { fakeMachine } from "./support/machine.js";

/** A registry whose Documents known folder is `data`. */
function documents(data: string) {
  return { [DOCUMENTS_KEY]: { [DOCUMENTS_VALUE]: data } };
}

describe("customMapDataFolder", () => {
  it("takes WC3_USER_FOLDER before the registry", () => {
    const machine = fakeMachine({
      env: { [USER_FOLDER_VARIABLE]: "D:\\Games\\Warcraft III" },
      registry: documents("C:\\Users\\me\\Documents"),
    });
    expect(customMapDataFolder(machine)).toBe(
      "D:\\Games\\Warcraft III\\CustomMapData",
    );
  });

  it("takes WC3_USER_FOLDER off Windows", () => {
    const machine = fakeMachine({
      platform: "linux",
      env: { [USER_FOLDER_VARIABLE]: "/home/me/wine/Warcraft III" },
    });
    expect(customMapDataFolder(machine)).toBe(
      "/home/me/wine/Warcraft III/CustomMapData",
    );
  });

  it("reads the Documents known folder from the registry on Windows", () => {
    const machine = fakeMachine({
      registry: documents("C:\\Users\\me\\OneDrive\\Documentos"),
    });
    expect(customMapDataFolder(machine)).toBe(
      "C:\\Users\\me\\OneDrive\\Documentos\\Warcraft III\\CustomMapData",
    );
  });

  it("expands the %VAR%s of the registry value, by name in any case", () => {
    const machine = fakeMachine({
      env: { USERPROFILE: "C:\\Users\\me", OneDriveName: "OneDrive" },
      registry: documents("%UserProfile%\\%ONEDRIVENAME%\\Documentos"),
    });
    expect(customMapDataFolder(machine)).toBe(
      "C:\\Users\\me\\OneDrive\\Documentos\\Warcraft III\\CustomMapData",
    );
  });

  it("ignores an empty WC3_USER_FOLDER", () => {
    const machine = fakeMachine({
      env: { [USER_FOLDER_VARIABLE]: "" },
      registry: documents("C:\\Users\\me\\Documents"),
    });
    expect(customMapDataFolder(machine)).toBe(
      "C:\\Users\\me\\Documents\\Warcraft III\\CustomMapData",
    );
  });

  describe("never chooses homedir + Documents, even when it exists", () => {
    const home = "C:\\Users\\me";
    const homeResult =
      "C:\\Users\\me\\Documents\\Warcraft III\\CustomMapData\\reforged-ts\\probes\\hello.txt";

    it("with the registry pointing elsewhere", () => {
      const machine = fakeMachine({
        env: { USERPROFILE: home, HOME: home },
        files: { [homeResult]: "" },
        registry: documents("%USERPROFILE%\\OneDrive\\Documentos"),
      });
      expect(customMapDataFolder(machine)).toBe(
        "C:\\Users\\me\\OneDrive\\Documentos\\Warcraft III\\CustomMapData",
      );
    });

    it("with no registry value: an author error instead", () => {
      const machine = fakeMachine({
        env: { USERPROFILE: home, HOME: home },
        files: { [homeResult]: "" },
      });
      expect(() => customMapDataFolder(machine)).toThrow(AuthorError);
      expect(() => customMapDataFolder(machine)).toThrow(USER_FOLDER_VARIABLE);
    });
  });

  it("under WSL, finds the Windows Documents folder, redirection included, at its WSL path", () => {
    const machine = fakeMachine({
      wsl: { documents: "C:\\Users\\me\\OneDrive\\Documentos" },
    });
    expect(customMapDataFolder(machine)).toBe(
      "/mnt/c/Users/me/OneDrive/Documentos/Warcraft III/CustomMapData",
    );
  });

  it("under WSL, takes WC3_USER_FOLDER before the Windows Documents folder", () => {
    const machine = fakeMachine({
      env: { [USER_FOLDER_VARIABLE]: "/mnt/d/Warcraft III" },
      wsl: { documents: "C:\\Users\\me\\Documents" },
    });
    expect(customMapDataFolder(machine)).toBe(
      "/mnt/d/Warcraft III/CustomMapData",
    );
  });

  it("never reads the home folder's Documents under WSL", () => {
    const machine = fakeMachine({
      env: { HOME: "/home/me" },
      files: {
        "/home/me/Documents/Warcraft III/CustomMapData/reforged-ts/probes/hello.txt":
          "",
      },
      wsl: { documents: "C:\\Users\\me\\Documents" },
    });
    expect(customMapDataFolder(machine)).toBe(
      "/mnt/c/Users/me/Documents/Warcraft III/CustomMapData",
    );
  });

  it("off Windows without WC3_USER_FOLDER, fails with an author error naming it", () => {
    const machine = fakeMachine({
      platform: "darwin",
      env: { HOME: "/Users/me" },
      files: {
        "/Users/me/Documents/Warcraft III/CustomMapData/reforged-ts/probes/hello.txt":
          "",
      },
    });
    expect(() => customMapDataFolder(machine)).toThrow(AuthorError);
    expect(() => customMapDataFolder(machine)).toThrow(
      /WC3_USER_FOLDER.*only on Windows/,
    );
  });
});
