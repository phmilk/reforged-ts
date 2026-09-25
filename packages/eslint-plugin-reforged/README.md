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

Peer dependencies: ESLint 9 or later (10 is tested), `typescript-eslint` 8 and TypeScript 6.0.2. `reforged-types` and `reforged-ts` are optional peers: the plugin reads their data files from the Map project's own installation.

## Rules

Each diagnostic links to the rule's page on the docs site; the pages ship in `docs/`.

| Rule                                                       | Severity | Reports                                                                                         |
| ---------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| [`no-dotted-asset-paths`](docs/no-dotted-asset-paths.md)   | error    | An asset path whose file name holds a dot before its extension (`model_1.0.mdx`).               |
| [`no-unsafe-natives`](docs/no-unsafe-natives.md)           | error    | A Native on the ban list (`TriggerSleepAction`, `PolledWait`, the BJ timer helpers, ...).       |
| [`no-unordered-iteration`](docs/no-unordered-iteration.md) | warn     | Iteration that compiles to `pairs` (`for...in`, `Object.keys/values/entries`, `pairs`, `next`). |
| [`no-self-recursion`](docs/no-self-recursion.md)           | warn     | A function that calls itself by name in its own body.                                           |

To silence a rule on one line, say why:

```ts
// eslint-disable-next-line reforged/no-unsafe-natives -- runs in a trigger action, where the sleep is safe
TriggerSleepAction(1);
```

## License

MIT, with the upstream line of [cipherxof/w3ts](https://github.com/cipherxof/w3ts). See `LICENSE`.
