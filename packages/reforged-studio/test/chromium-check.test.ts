/**
 * The check the project's global setup runs before any test file (#945):
 * that Playwright can launch the headless Chromium the page's tests drive.
 * The tests call the check with an executable path of their own, which
 * reaches the launch, so they need no machine without the browser.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkChromium, INSTALL_COMMAND } from "./support/chromium.js";

describe("the Chromium check", () => {
  it("fails with one line naming the install command when no executable stands at the path", async () => {
    const missing = path.join(import.meta.dirname, "no-such-chromium");

    const failure = await checkChromium(missing).then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    const { message } = failure as Error;
    expect(message.split("\n")).toHaveLength(1);
    expect(message).toContain(
      "pnpm --filter reforged-studio exec playwright install --only-shell chromium",
    );
  });

  it("passes another launch failure through with Playwright's own message", async () => {
    // This file exists and is no browser: the launch fails past the
    // missing-executable test, in the spawn or in the start of the process.
    const notABrowser = fileURLToPath(import.meta.url);

    const failure = await checkChromium(notABrowser).then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    const { message } = failure as Error;
    expect(message).toContain("browserType.launch");
    expect(message).not.toContain(INSTALL_COMMAND);
  });
});
