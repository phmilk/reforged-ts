# eslint-plugin-reforged

Type-aware ESLint rules that catch the Warcraft III scripting pitfalls (desync, crash, leak) in a [reforged-ts](https://github.com/phmilk/reforged-ts) Map project before the map compiles. The lint layer of the Guards.

**Supported Patch: 3.0.0.24268.** The `reforged.patch` field of `package.json` carries the same Build.

## Setup

The rules need type information: put the recommended config after typescript-eslint's type-checked presets, or after any configuration that sets `parserOptions.projectService`. It sets no parser and no project options itself.

```js
// eslint.config.mjs
import { defineConfig } from "eslint/config";
import reforged from "eslint-plugin-reforged";
import tseslint from "typescript-eslint";

export default defineConfig(
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...reforged.configs.recommended,
);
```

Peer dependencies: ESLint 9 or later (10 is tested), `typescript-eslint` 8 and TypeScript 6.0.2. `reforged-types` and `reforged-ts` are optional peers: the plugin reads their data files from the Map project's own installation, found from the directory ESLint runs in (`createPlugin({ projectRoot })` sets another). Without one of them, the plugin prints one warning at load and the rules that need it report nothing.

## Rules

Each diagnostic links to the rule's page on the docs site; the pages ship in `docs/`.

| Rule                                                                       | Severity | Reports                                                                                                 |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| [`no-game-state-in-local-branch`](docs/no-game-state-in-local-branch.md)   | error    | A game-state call, creation or random number inside a branch that runs for the local player only.       |
| [`no-dotted-asset-paths`](docs/no-dotted-asset-paths.md)                   | error    | An asset path whose file name holds a dot before its extension (`model_1.0.mdx`).                       |
| [`no-handles-at-module-top-level`](docs/no-handles-at-module-top-level.md) | error    | A creation (`Unit.create`, `CreateTimer`, ...) at module top level, which runs in the Lua root.         |
| [`no-legacy-w3ts-names`](docs/no-legacy-w3ts-names.md)                     | error    | A w3ts 3.x name reforged-ts renamed or removed; fixes the one-to-one renames.                           |
| [`no-unsafe-natives`](docs/no-unsafe-natives.md)                           | error    | A Native on the ban list (`TriggerSleepAction`, `PolledWait`, the BJ timer helpers, ...).               |
| [`no-unused-handle-result`](docs/no-unused-handle-result.md)               | error    | A statement that discards a creation or a `Filter`/`Condition` boolexpr, which then leaks.              |
| [`no-unordered-iteration`](docs/no-unordered-iteration.md)                 | warn     | Iteration that compiles to `pairs` (`for...in`, `Object.keys/values/entries`, `pairs`, `next`).         |
| [`no-percent-in-display-strings`](docs/no-percent-in-display-strings.md)   | warn     | A lone `%` in a string that reaches a text-display Native (`print`, `DisplayTextToPlayer`, frame text). |
| [`no-self-recursion`](docs/no-self-recursion.md)                           | warn     | A function that calls itself by name in its own body.                                                   |

To silence a rule on one line, say why:

```ts
// eslint-disable-next-line reforged/no-unsafe-natives -- runs in a trigger action, where the sleep is safe
TriggerSleepAction(1);
```

## License

MIT, with the upstream line of [cipherxof/w3ts](https://github.com/cipherxof/w3ts). See `LICENSE`.
