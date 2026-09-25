# eslint-plugin-reforged

## Overview

The lint layer of the Guards: type-aware ESLint rules that report Warcraft III scripting pitfalls (desync, crash, leak) in a Map project. The decisions are in spec #50 and ADR 0007; the pitfall ids (D1, C2, ...) come from the catalogue in #15.

The rules classify through the type checker, never by name alone. They read:

- the Typings of `reforged-types`: a Native is a function declared in that package;
- the Wrappers of `reforged-ts`: classes whose chain reaches its `Handle` base;
- the plugin's own data files in `data/`.

`configs.recommended` sets no parser. A Map project places it after a configuration that provides type information.

## Commands

Run from the repository root:

| Command                                             | What it does                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm --filter eslint-plugin-reforged test`         | The package's vitest project: the rule fixtures and the export tests. |
| `pnpm --filter eslint-plugin-reforged typecheck`    | `tsc --noEmit` on the sources and on the tests.                       |
| `pnpm --filter eslint-plugin-reforged build`        | Compiles `src/` to `dist/`, the entry ESLint loads.                   |
| `pnpm exec eslint packages/eslint-plugin-reforged`  | The workspace lint on this package.                                   |
| `pnpm check`                                        | The whole workspace; the finish condition.                            |
| `pnpm --filter eslint-plugin-reforged measure-cost` | The cost over typescript-eslint's type-checked preset (see below).    |

The tests run from source. They do not need `build`.

**Cost.** Spec #50 expects the plugin to add less than one fifth to a lint run with typescript-eslint's type-checked preset. `scripts/measure-cost.mjs` lints the docs examples on the fixture project in fresh processes, with and without the plugin, and prints the median overhead (about 10% at the first release, most of it loading the plugin; the rules themselves take about 50 ms). Run it after a change to a classification helper or a new rule that asks the checker more.

## Layout

- `src/index.ts`: the entry. Its default export is `createPlugin()`.
- `src/plugin.ts`: `createPlugin` builds `meta`, `rules` and `configs.recommended` from the registry.
- `src/rules/index.ts`: the registry, one line per rule, sorted by name.
- `src/rules/<rule>.ts`: one file per rule. Its default export is a `RuleEntry` (`src/rule-entry.ts`) with the name, the severity and a `create(data)` factory.
- `src/create-rule.ts`: the rule creator. It sets `meta.docs.url` from `src/meta.ts`.
- `src/classify/`: the shared classification helpers, one module per concept (`package.ts`, `native.ts`, `handle.ts`, `wrapper.ts`, `creation.ts`, `top-level.ts`, ...). Rules never inspect declarations themselves.
- `src/data/`: loading and shape checks for the data files. `schema.ts` holds the field readers, and there is one parser module per file. `optional.ts` finds a file another package publishes in the linted project's installation. `index.ts` loads them all into `PluginData`.
- `data/*.json`: the plugin's own data files, shipped.
- `docs/<rule>.md`: one page per rule, shipped. `templates/rule-doc.md` is the template; it is not shipped.
- `test/rules/<rule>.test.ts`: the RuleTester fixtures of one rule.
- `test/plugin.test.ts`: the rule table, the recommended config, the metadata, the docs pages, and loading without the optional packages.
- `test/data.test.ts`: the shape errors, and a check that every Native a data file names resolves in the Typings.
- `test/support/`: the seams. `rule-tester.ts` wires the RuleTester to vitest. `lint.ts` lints with the recommended config as a Map project does. `plugin.ts` provides the plugin created with the fixture project as its project root (its optional packages are the fixture's), and `ruleOf(name)`. `typings.ts` provides `installedNatives()`. `fixture-project.ts` holds the paths.
- `test/fixture-project/`: the Map project the rules lint. See its `tsconfig.json`.
  - The real `reforged-types` comes from this package's devDependency.
  - `node_modules/reforged-ts/` is a stub declaration package, committed; the root `.gitignore` re-includes it.
  - Every RuleTester case is linted as `file.ts`, with its content replaced in memory.
  - The other `.ts` files are modules a case can import.

## Adding or changing a rule

1. **Rule file.** Create `src/rules/<rule>.ts` with `createRule` and a default `defineRuleEntry({ name, severity, create })`. Set the severity from #16's table. The rule declares `meta.type`, `meta.docs.description`, `messages` with ids, `hasSuggestions` if it suggests, and `schema` with `defaultOptions`. Only `no-legacy-w3ts-names` may declare `fixable`. Each message says the pitfall, the consequence and the replacement.
2. **Match syntactically first.** Then ask the checker, through `src/classify/`, only for the matched node. Call `ESLintUtils.getParserServices(context)` at the top of `create`: without type information, the rule then fails at the first file.
3. **Registry.** Add one import and one line to `src/rules/index.ts`, in name order. The recommended config follows from it.
4. **Rule-table test.** In `test/plugin.test.ts`, add the rule to `decidedTable` with its severity, and raise the rule count and the error/warning split the table asserts. Extend `everyRuleReports` so the new rule reports it. A rule with `requires` goes in `optionalRules` too.
5. **Fixtures.** Create `test/rules/<rule>.test.ts` with `createRuleTester()` and `ruleOf("<rule>")`. It needs these cases:
   - valid cases, including every allowlist family and every option;
   - invalid cases with message ids and data;
   - suggestion outputs;
   - fix outputs, for rule 6.

   Test escapes (`eslint-disable-next-line reforged/<rule> -- reason`) and severities with `lintWithRecommended`. The RuleTester registers rules under its own prefix. When a case needs a Wrapper member the stub lacks, add it to `test/fixture-project/node_modules/reforged-ts/index.d.ts`, with the shape of the real library.

6. **Docs page.** Copy `templates/rule-doc.md` to `docs/<rule>.md`. Keep the title and the six headings. Add a row to the rules table in `README.md`.
7. **Data.** If the rule reads a data file, write a parser in `src/data/` with the `schema.ts` readers. Add the file to `PluginData` and `DataFiles` in `src/data/index.ts`. Add shape tests to `test/data.test.ts`. Every Native the file names must be in `installedNatives()`.
8. **Changeset.** Until the first release, add the rule's paragraph to the initial-release changeset, `.changeset/eslint-plugin-reforged.md`, under its severity. After it, write a new changeset for `eslint-plugin-reforged`.

## Data files

| File                         | Owner          | Shape                                                                                                                                                        |
| ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data/unsafe-natives.json`   | this plugin    | `[{ name, reason, replacement }]`                                                                                                                            |
| `data/local-safe.json`       | this plugin    | `[{ name, kind: "visual" \| "text" \| "pure", reason }]`; `name` is a Native, `print`, `Class#member` or `Class.member` (static); a `pure` entry is a Native |
| `data/creation-natives.json` | this plugin    | `[{ name, family }]`                                                                                                                                         |
| `migration/renames.json`     | reforged-ts    | `[{ old, new, kind, versions: { from, to }, oneToOne, note }]` (the library's `renames.schema.json`)                                                         |
| `async-natives.json`         | reforged-types | a sorted array of Native names; the same set the Typings tag `@async` (the oracle test in `test/data.test.ts`)                                               |

A file another package publishes is read from the linted project's installation of that package, found from the project root (`src/data/optional.ts`), never from this plugin's dependencies. Declare it as an `OptionalDataFile` next to its parser, read it in `loadPluginData` with its empty value, and list the package in the rule entry's `requires`: when the package is missing, the plugin warns once and registers the rule disabled.

A data file grows by pull request, and every line carries its reason. A review can then challenge one entry. A file with an unexpected shape throws a `DataFileError` at plugin load, naming the file and the field. Changing the shape of a file the plugin reads from another package is a major of this plugin.

## Definition of done

- The fixtures of the rule are green.
- Its docs page is present with the fixed sections.
- The rule-table test is green.
- A changeset is written.
- `pnpm check` is green.
