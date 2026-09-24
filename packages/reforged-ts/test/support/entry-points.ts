/** @noSelfInFile */

// The map script's `main` and `config`, stubbed. The game defines both
// before any map code loads, and the library's Hook code captures them when
// it loads, so a test imports this file ahead of the library. The
// shipped stubs leave them nil (see the reforged-test README), so only the
// hooks test defines them.

declare global {
  let main: (() => void) | undefined;
  let config: (() => void) | undefined;
}

/** What ran in `main` and `config`, in order: the stubs log their own names. */
export const entryPointLog: string[] = [];

main = () => {
  entryPointLog.push("main");
};

config = () => {
  entryPointLog.push("config");
};
