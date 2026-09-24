/** @noSelfInFile */

// The map script's entry points, stubbed. The game defines `main` and
// `config` before any map module loads, and the hooks module captures both
// when it loads, so a test imports this module ahead of the library. The
// shipped stubs leave them nil (see the reforged-test README), so only the
// hooks test defines them.

declare global {
  let main: (() => void) | undefined;
  let config: (() => void) | undefined;
}

/** What ran at the entry points, in order: the stubs log their own names. */
export const entryPointLog: string[] = [];

main = () => {
  entryPointLog.push("main");
};

config = () => {
  entryPointLog.push("config");
};
