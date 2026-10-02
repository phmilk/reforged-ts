import { describe, expect, it } from "vitest";
import { AuthorError } from "../src/errors.js";
import { interop, isWsl } from "../src/machine.js";

describe("isWsl", () => {
  it("is true on Linux with WSL_DISTRO_NAME set", () => {
    expect(isWsl("linux", { WSL_DISTRO_NAME: "Ubuntu" }, undefined)).toBe(true);
  });

  it("is true on Linux whose kernel version names Microsoft", () => {
    expect(
      isWsl(
        "linux",
        {},
        "Linux version 6.6.114.1-microsoft-standard-WSL2 (root@host) ...",
      ),
    ).toBe(true);
  });

  it("is false on plain Linux, and on any other platform", () => {
    expect(isWsl("linux", {}, "Linux version 6.8.0-45-generic")).toBe(false);
    expect(isWsl("linux", { WSL_DISTRO_NAME: "" }, undefined)).toBe(false);
    expect(isWsl("win32", { WSL_DISTRO_NAME: "Ubuntu" }, undefined)).toBe(
      false,
    );
  });
});

describe("interop", () => {
  it("gives the program's output, trimmed", () => {
    expect(
      interop("read the TEMP folder", "", "cmd.exe", [], () => "C:\\Temp\r\n"),
    ).toBe("C:\\Temp");
  });

  it("fails on one line naming the step, the program and the override when the program fails", () => {
    const failing = () => {
      throw new Error("spawn powershell.exe ENOENT\nmore");
    };
    const call = () =>
      interop(
        "read the Windows Documents folder",
        "Set WC3_USER_FOLDER to the game's user folder instead.",
        "powershell.exe",
        [],
        failing,
      );
    expect(call).toThrow(AuthorError);
    expect(call).toThrow(
      "WSL interop failed to read the Windows Documents folder (powershell.exe: spawn powershell.exe ENOENT). Set WC3_USER_FOLDER to the game's user folder instead.",
    );
  });

  it("fails naming the step when the program prints nothing", () => {
    expect(() =>
      interop(
        "read the Windows TEMP folder",
        "Check interop.",
        "cmd.exe",
        [],
        () => "  \r\n",
      ),
    ).toThrow(
      "WSL interop failed to read the Windows TEMP folder: cmd.exe printed nothing. Check interop.",
    );
  });
});
