/** @noSelfInFile */

// eslint-disable-next-line prefer-const -- the entry point global is declared with let because the hooks reassign it; step 4 (#49) removes it
declare let main: () => void;
// eslint-disable-next-line prefer-const -- the entry point global is declared with let because the hooks reassign it; step 4 (#49) removes it
declare let config: () => void;

const oldMain = main;
const oldConfig = config;

type scriptHookSignature = () => void;

const hooksMainBefore: scriptHookSignature[] = [];
const hooksMainAfter: scriptHookSignature[] = [];
const hooksConfigBefore: scriptHookSignature[] = [];
const hooksConfigAfter: scriptHookSignature[] = [];

export const executeHooksMainBefore = () =>
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- adding braces changes the emitted Lua; step 4 (#49) removes it
  hooksMainBefore.forEach((func) => func());
export const executeHooksMainAfter = () =>
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- adding braces changes the emitted Lua; step 4 (#49) removes it
  hooksMainAfter.forEach((func) => func());

export function hookedMain() {
  executeHooksMainBefore();
  oldMain();
  executeHooksMainAfter();
}

export const executeHooksConfigBefore = () =>
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- adding braces changes the emitted Lua; step 4 (#49) removes it
  hooksConfigBefore.forEach((func) => func());
export const executeHooksConfigAfter = () =>
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- adding braces changes the emitted Lua; step 4 (#49) removes it
  hooksConfigAfter.forEach((func) => func());

export function hookedConfig() {
  executeHooksConfigBefore();
  oldConfig();
  executeHooksConfigAfter();
}

// eslint-disable-next-line no-useless-assignment -- the hooks reassign the global entry point; step 4 (#49) removes it
main = hookedMain;
// eslint-disable-next-line no-useless-assignment -- the hooks reassign the global entry point; step 4 (#49) removes it
config = hookedConfig;

type W3tsHookType =
  "main::before" | "main::after" | "config::before" | "config::after";

export enum W3TS_HOOK {
  MAIN_BEFORE = "main::before",
  MAIN_AFTER = "main::after",
  CONFIG_BEFORE = "config::before",
  CONFIG_AFTER = "config::after",
}

const entryPoints: Record<string, scriptHookSignature[]> = {
  [W3TS_HOOK.MAIN_BEFORE]: hooksMainBefore,
  [W3TS_HOOK.MAIN_AFTER]: hooksMainAfter,
  [W3TS_HOOK.CONFIG_BEFORE]: hooksConfigBefore,
  [W3TS_HOOK.CONFIG_AFTER]: hooksConfigAfter,
};

export function addScriptHook(
  entryPoint: W3tsHookType,
  hook: scriptHookSignature,
): boolean {
  if (!(entryPoint in entryPoints)) {
    return false;
  }
  entryPoints[entryPoint].push(hook);
  return true;
}
