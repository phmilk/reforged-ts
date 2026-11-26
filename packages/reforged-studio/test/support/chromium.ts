/**
 * The global setup of the reforged-studio vitest project (#945): before any
 * test file runs, it checks that Playwright can launch the headless Chromium
 * the page's tests drive, so a machine without the browser fails once, with
 * the command that installs it, and not twice in each page test file.
 */

import { chromium } from "playwright";

/**
 * The command that installs the headless Chromium the page's tests drive:
 * the README's. CI's Install Chromium step installs the same build with it
 * plus its own flags (`--no-progress`, and `--with-deps` on Linux). It works
 * from any folder of the workspace, the root included, where `playwright` is
 * no dependency and a bare `pnpm exec playwright` does not resolve.
 */
export const INSTALL_COMMAND =
  "pnpm --filter reforged-studio exec playwright install --only-shell chromium";

// Playwright's two messages for no executable at the path, measured with
// Playwright 1.65.1 on Windows, 2026-11: "Executable doesn't exist at <path>"
// for a build that is not installed, and "Failed to launch chromium because
// executable doesn't exist at <path>" for an `executablePath` option.
const MISSING_EXECUTABLE = /executable doesn't exist at /i;

/**
 * Checks the browser by launching it and closing it once, as the page's
 * tests launch it. A headless launch starts the headless shell, a build of
 * its own that `chromium.executablePath()` does not name, so a look at that
 * path would fail where only the shell is installed, as on CI.
 *
 * @param executablePath - The executable to launch in place of the installed
 * build: for the tests of the check, which name a path of their own.
 * @throws An `Error` of one line naming {@link INSTALL_COMMAND} when no
 * executable stands at the path. Any other launch failure is Playwright's
 * own, unchanged.
 */
export async function checkChromium(executablePath?: string): Promise<void> {
  let browser;
  try {
    browser = await chromium.launch(
      executablePath === undefined ? {} : { executablePath },
    );
  } catch (error) {
    if (error instanceof Error && MISSING_EXECUTABLE.test(error.message)) {
      // Without the cause: vitest prints it under the line, and Playwright's
      // message names a command of its own, `pnpm exec playwright install`,
      // which does not resolve at the workspace root and downloads every
      // browser.
      // eslint-disable-next-line preserve-caught-error -- the cause names the wrong command under the line that names the right one
      throw new Error(
        `The Studio's page tests drive Playwright's headless Chromium, which is not installed: run \`${INSTALL_COMMAND}\`.`,
      );
    }
    throw error;
  }
  // A failed launch leaves no process: Playwright starts none for a missing
  // executable and kills the one whose start failed.
  await browser.close();
}

/**
 * The global setup vitest runs once, before any test file of the project:
 * {@link checkChromium} on the installed build.
 *
 * @throws What {@link checkChromium} throws, which fails the run.
 */
export default async function setup(): Promise<void> {
  await checkChromium();
}
