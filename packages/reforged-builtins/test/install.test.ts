/**
 * The install lookup, on a fake machine: the argument, then the Probe
 * runner's WC3_EXECUTABLE, then the well-known folders.
 */
import { describe, expect, it } from "vitest";
import {
  findInstall,
  InstallNotFoundError,
  type InstallMachine,
} from "../src/install.js";

function machine(
  buildInfos: readonly string[],
  overrides: Partial<InstallMachine> = {},
): InstallMachine {
  return {
    platform: "linux",
    wsl: false,
    env: {},
    isFile: (file) => buildInfos.includes(file),
    ...overrides,
  };
}

describe("findInstall", () => {
  it("takes the folder the argument names, relative to the working folder", () => {
    expect(
      findInstall("wc3", "/home/me", machine(["/home/me/wc3/.build.info"])),
    ).toBe("/home/me/wc3");
  });

  it("walks up from a file inside the install, such as the executable", () => {
    expect(
      findInstall(
        "/games/wc3/_retail_/x86_64/Warcraft III.exe",
        "/",
        machine(["/games/wc3/.build.info"]),
      ),
    ).toBe("/games/wc3");
  });

  it("refuses an argument with no .build.info at or above it, without looking elsewhere", () => {
    expect(() =>
      findInstall(
        "/nowhere",
        "/",
        machine(["/mnt/c/Program Files (x86)/Warcraft III/.build.info"], {
          wsl: true,
        }),
      ),
    ).toThrow(
      new InstallNotFoundError(
        '--install is set to "/nowhere", and no .build.info is at or above /nowhere.',
      ),
    );
  });

  it("then takes the install of the Probe runner's WC3_EXECUTABLE", () => {
    expect(
      findInstall(
        undefined,
        "/",
        machine(
          [
            "/opt/wc3/.build.info",
            "/mnt/c/Program Files (x86)/Warcraft III/.build.info",
          ],
          {
            wsl: true,
            env: {
              WC3_EXECUTABLE: "/opt/wc3/_retail_/x86_64/Warcraft III.exe",
            },
          },
        ),
      ),
    ).toBe("/opt/wc3");
  });

  it("then the Battle.net app's folders on Windows", () => {
    expect(
      findInstall(
        undefined,
        "C:\\work",
        machine(["D:\\Games\\Warcraft III\\.build.info"], {
          platform: "win32",
          env: { "ProgramFiles(x86)": "D:\\Games" },
        }),
      ),
    ).toBe("D:\\Games\\Warcraft III");
    expect(
      findInstall(
        undefined,
        "C:\\work",
        machine(["C:\\Program Files\\Warcraft III\\.build.info"], {
          platform: "win32",
        }),
      ),
    ).toBe("C:\\Program Files\\Warcraft III");
  });

  it("and their drive C under WSL", () => {
    expect(
      findInstall(
        undefined,
        "/",
        machine(["/mnt/c/Program Files (x86)/Warcraft III/.build.info"], {
          wsl: true,
        }),
      ),
    ).toBe("/mnt/c/Program Files (x86)/Warcraft III");
  });

  it("names what to set and where it looked when nothing is found", () => {
    expect(() =>
      findInstall(
        undefined,
        "/",
        machine([], { wsl: true, env: { WC3_EXECUTABLE: "/opt/game.exe" } }),
      ),
    ).toThrow(
      new InstallNotFoundError(
        'Warcraft III was not found. Pass --install <folder> or set the WC3_EXECUTABLE environment variable to the game\'s executable. Looked at: "/opt/game.exe", "/mnt/c/Program Files (x86)/Warcraft III", "/mnt/c/Program Files/Warcraft III".',
      ),
    );
  });
});
