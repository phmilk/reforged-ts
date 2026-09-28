# Documenting the library

Every exported symbol and every public member of `reforged-ts` carries a doc comment in TSDoc syntax ([ADR 0004](adr/0004-tsdoc-standard-with-compiled-examples.md)). This page is the standard those comments follow: the tags, their order, the tags each kind of symbol requires, the style rules and the examples convention. A Map project author reads these comments in the editor's hover and on the docs site, and an agent reads them in the `.d.ts` files under `node_modules`, so each comment holds the whole contract of its symbol.

The rules apply to the library's sources, `packages/reforged-ts/src/`. Private and protected members, `#private` members and constructors are exempt.

## What checks it

Two gates, run by different tools, count the same symbols:

- **Lint.** `tsdoc/syntax` ([eslint-plugin-tsdoc](https://www.npmjs.com/package/eslint-plugin-tsdoc)) checks the syntax and the tag vocabulary. Four rules of [eslint-plugin-jsdoc](https://www.npmjs.com/package/eslint-plugin-jsdoc) check the rest: `require-jsdoc` (a comment is present), `require-param`, `require-returns` and `sort-tags` (the tag order). Its tag-name and type checks are off: TypeScript gives the types and `tsdoc/syntax` the tags.
- **TypeDoc.** The docs site's `pnpm docs:check` builds the API reference from `packages/reforged-ts/src/index.ts` with the `notDocumented` and `invalidLink` validations on. It also fails on an `{@includeCode}` whose file or region is missing, and on an `@native` naming neither a Native in the Typings manifest nor a Handle type the Typings declare. CI runs it on ubuntu; it runs locally too, after `pnpm build`.

**During the documentation pass**, the lint rules sit in `eslint.docs.config.mjs` at warn, and TypeDoc's validation findings are logged without failing the site build. `pnpm docs:audit` runs both gates without the site build, in `pnpm check` and on both CI legs, and lists the findings per file, largest first ([The docs audit](../website/README.md#the-docs-audit)):

```sh
pnpm docs:audit                              # every file, then the total
pnpm docs:audit --strict handles/unit.ts     # one file; exit code 1 on any finding
pnpm exec eslint -c eslint.docs.config.mjs --fix packages/reforged-ts/src   # fixes the tag order, nothing else
```

At the end of the pass both gates switch to error: the rules move into `eslint.config.mjs`, and `pnpm check` fails on an undocumented public member.

The matrix below marks what lint checks. The rest (the `@native`, `@throws`, `@async` and `@example` tags, and what the sentences say) is checked in review.

## Tag vocabulary

The root [`tsdoc.json`](../tsdoc.json) declares the tags beyond the TSDoc standard ones. The library's `packages/reforged-ts/tsdoc.json` and the site's `website/typedoc/tsdoc.json` extend it, so lint and TypeDoc read the same definitions: a vocabulary change is one edit there. A tag it does not declare is a lint finding.

| Tag             | Kind     | Meaning                                                                                                                                                                                            |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@native`       | block    | A Native behind the member, or the Handle type a Wrapper owns. One name per tag, the bare name only (`@native CreateUnit`); repeat the tag for each. The site renders it as a link to the Typings. |
| `@patch`        | block    | The Patch a member requires, when its Native needs one above 3.0.0.24268: the full version, as the Typings headers write it.                                                                       |
| `@bug`          | block    | One known bug of the game behind the member, one tag per bug.                                                                                                                                      |
| `@since`        | block    | The version of `reforged-ts` that added the symbol (`@since 1.2.0`), never a Patch.                                                                                                                |
| `@async`        | modifier | The member's value can differ between clients: it comes from an async Native.                                                                                                                      |
| `@includeCode`  | inline   | TypeDoc's include of an example file, used only inside `@example` (see [Examples](#examples)).                                                                                                     |
| `@noSelf`       | modifier | A typescript-to-lua directive, not documentation.                                                                                                                                                  |
| `@noSelfInFile` | modifier | A typescript-to-lua directive, in its own `/** @noSelfInFile */` comment at the top of the file, never inside a doc comment.                                                                       |

The standard TSDoc tags stay available: `@remarks`, `@example`, `@typeParam`, `@param`, `@returns`, `@throws`, `@deprecated`, `@see`, `@defaultValue`, `@internal`, `{@link}` and the others. `@note` is not a tag: a caveat goes in `@remarks`.

## Tag order

Every comment orders its tags this way; `sort-tags` reports any other order, and `--fix` corrects it:

1. The summary, then any further paragraphs of it.
2. `@remarks`
3. `@example`
4. `@typeParam`
5. `@param`
6. `@returns`
7. `@throws`
8. `@native`
9. `@patch`
10. `@since`
11. `@deprecated`
12. Every other block tag (`@bug`, `@see`, `@defaultValue`, `@privateRemarks`) and `@noSelf`.
13. The modifiers `@async`, then `@internal`.

Tags of one name stay together, in the order written. No blank line is required between tags.

## Required tags per symbol kind

Every symbol this page covers has a doc comment whose first sentence is the summary. The matrix gives the tags each kind adds; the list under it says what each tag holds. In a cell, **lint** means the item is required and lint reports it missing, **review** means it is required and checked in review, and a condition means it is required only then.

| Kind                                                                             | Comment | `@param`                        | `@returns`                      | `@throws`                   | `@native`                                   | Other                                                         |
| -------------------------------------------------------------------------------- | ------- | ------------------------------- | ------------------------------- | --------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Class: a Wrapper, a Static namespace or a System                                 | lint    |                                 |                                 |                             | review, on a Wrapper: Handle type           | `@example`: review; `@remarks`: caveats, naming-rule sentence |
| `create` factory                                                                 | lint    | lint                            | lint                            | review: error-mode sentence | review: each Native it can call             |                                                               |
| Lookup                                                                           | lint    | lint                            | lint, saying when `undefined`   | when non-null               | review                                      |                                                               |
| Function, method, getter                                                         | lint    | lint                            | lint, unless it returns nothing | when it can raise           | review: each Native it calls                | `@patch`, `@async`: when a Native it calls is                 |
| Setter                                                                           | lint    |                                 |                                 | when it can raise           | review: each Native it calls                | `@patch`, `@async`: when a Native it calls is                 |
| Event descriptor, `on()`                                                         | lint    | lint, on `on()`                 | lint, on `on()`                 |                             | review: registration Native                 | the payload's guarantees                                      |
| Constant, enum, enum member, type alias, interface and its members, public field | lint    | lint, on an interface's methods | lint, on an interface's methods |                             | on an enum member mirroring a game constant |                                                               |
| Deprecated member                                                                |         |                                 |                                 |                             |                                             | `@deprecated`: review                                         |
| Symbol added after 1.0.0                                                         |         |                                 |                                 |                             |                                             | `@since`: review                                              |

What each item holds:

- **Class.** `@example` includes an example file, or a region of one ([Examples](#examples)). `@remarks` holds the caveats, and the naming-rule sentence when a Wrapper's name differs from its Native type ([Style](#style)). A Wrapper carries `@native` naming the Handle type it owns: `@native unit` on `Unit`, `@native rect` on `Rectangle`. A Static namespace or a System that owns no Handle type (`Camera`, `Input`, `Terrain`, `File`) carries no class-level `@native`.
- **`create` factory**, every static member that creates a Handle. `@throws` gives the error-mode sentence and the message: when the game returns no handle, for example an unknown rawcode or a missing FDF definition, it raises `reforged-ts: failed to create <Wrapper> (<detail>)` at the calling line. `@native` names each Native it can call, one tag each.
- **Lookup** (`fromHandle`, `fromEvent`, `fromExpired`, `fromKilling`, `fromLocal`, `getItemInSlot` and the like). `@returns` says when the result is `undefined`: outside the event, an empty slot, an unknown index. The two non-null lookups, `Unit.getOwner` and `MapPlayer.fromLocal`, say instead why the result is never `undefined`, and `@throws` gives the message they raise if that breaks.
- **Function, method, getter, setter.** `@param` for each parameter; an options object is one `@param`, never one per property. A setter takes no `@param`: its summary says what the value means. `@returns` unless the function returns nothing; a getter always has one. `@throws` for each error it can raise, with the message. `@native` for each Native its body calls, directly or through a private helper of its class. `@patch` when a Native it calls requires a Patch above 3.0.0.24268; the first release supports no later Patch, so no member carries one yet. `@async` when a Native it calls is async in the Typings (listed in `packages/reforged-types/async-natives.json`, and marked `@async` on its Typings header).
- **Event descriptor and `on()`.** The comment says what the payload guarantees and which of its fields can be `undefined`. `@native` names the registration Native (`@native TriggerRegisterPlayerUnitEvent`).
- **Constant, enum, enum member, type alias, interface**, the members of an interface and the public fields of a class: the summary alone. An enum member mirroring a game constant names that constant in `@native`.
- **Deprecated member.** `@deprecated` with a `{@link}` to the replacement and the release that removes it, per [the deprecation policy](release.md#deprecating-and-removing-a-symbol): deprecated in a minor, removed in the next major.
- **`@since`.** Optional on the 1.0.0 surface, where everything is 1.0.0. Required, with the version of `reforged-ts` that adds it, on every symbol added in a later release.

Lint's `@param` and `@returns` checks cover exported functions, the public methods and accessors of classes, and the methods of exported interfaces. A comment holding only tags satisfies lint and TypeDoc, but not this page: the summary is required on every kind.

## Style

- **English.**
- **The summary** is one complete sentence that says what the symbol does, starting with its verb ("Creates a unit for the player at the given point."), or, for a class, a type, a constant or a field, what it is ("A rectangular area of the map, aligned with its axes."). It never restates the signature: "Sets the unit's life" on a `life` setter taking a number tells the reader nothing the hover does not show; say what the value means and its unit. Long explanations go in `@remarks`, never in the summary.
- **`@param name - description`**, with the hyphen (`tsdoc/syntax` reports a `@param` without one). Give the unit and the range where they matter: seconds, degrees, world units, 0 to 255, a rawcode such as `FourCC("hfoo")`, what a left-out optional parameter means.
- **`@returns`** describes the value, not its type; a lookup's says when it is `undefined`.
- **Escaping.** Outside a code span, write `\{`, `\}`, `\>` and `\@`: TSDoc reads a brace as an inline tag, `>` as HTML and `@` as a tag. Inside backticks nothing is escaped, so put messages and placeholders in a code span (`` `reforged-ts: failed to create Unit (<rawcode>)` ``). A code span stays on one line: TSDoc cannot continue one on the next. No HTML.
- **One `@remarks` per comment.** It holds the caveats and behaviour notes; several caveats make a bulleted list in it. The first release's behaviour changes from w3ts (the `readDouble` alignment, the corrected error messages, `Players` filled in the globals stage, the silent `fromLocal`) are recorded in the `@remarks` of the members they affect, from `packages/reforged-ts/migration/behaviour-changes.md`, so the migration guide can link to them.
- **The naming-rule sentence.** A Wrapper whose name is not its Native type capitalised says why in its `@remarks`. When the capitalised name collides with a Native function: "Named `Rectangle` because the Native type name, `rect`, collides with the Native function `Rect`." (`MapPlayer`: `player` and `Player`; `Point`: `location` and `Location`.) When the name differs for another reason, one sentence names the Native type and the reason: "Named `DialogButton` because the Native type, `button`, is a dialog's button"; "Named `Frame` after the Native type `framehandle`, without its suffix". Camel-casing alone (`TextTag` for `texttag`) needs no sentence. The rule itself is in the Handle base's doc comment (`packages/reforged-ts/src/handles/handle.ts`).
- **Links.** Name another symbol with `{@link Init.onGlobals}`, which the site checks resolves. A link to a community page is fine where it is the source of a fact.
- **Nothing is copied from jassdoc.** The community's Native reference has no licence, so its prose cannot ship in an MIT package. Facts stay, links to their sources too; the phrasing is ours.

A comment that meets the matrix and these rules:

```ts
/**
 * Creates a unit for `owner` at the given point, facing `face`.
 * @param owner - The player who owns the unit.
 * @param unitId - The unit type's rawcode, such as `FourCC("hfoo")`.
 * @param x - The x-coordinate, in world units.
 * @param y - The y-coordinate, in world units.
 * @param face - The facing, in degrees; 270 (`bj_UNIT_FACING`) when left out.
 * @param skinId - The skin's rawcode; the unit type's own model when left out.
 * @returns The new unit.
 * @throws When the game returns no handle, for example an unknown rawcode:
 * `reforged-ts: failed to create Unit (<rawcode>)`, at the calling line.
 * @native CreateUnit
 * @native BlzCreateUnitWithSkin
 */
```

## Examples

An `@example` is never written inline: it includes a TypeScript file from `packages/reforged-ts/examples/`, which is compiled on every pull request and, when it does not need the game, run.

- **Two folders.** `examples/harness/` holds the examples that run on the Lua harness with the Native stubs of `reforged-test`. `examples/game/` holds those that need the game, such as one calling a Native with no stub; they are only compiled. Write a new one in `harness/` first, and move it to `game/` only when its run fails on `Native X is not stubbed`. Only the files directly in `harness/` run, not its subfolders.
- **One file per concept or class**, named in kebab-case (`destructable-create.ts`). It reads like Map project code: it imports from `"reforged-ts"`, which the examples' `tsconfig.json` maps to the library sources.
- **Regions.** A file shown in parts marks each with `// #region name` and `// #endregion name`; the name is required on both markers. The markers are not shown and the content is dedented.
- **The include.** `@example`, a title on the same line if any, then the include on the next line and nothing else. The path is relative to the source file holding the comment. For instance, a class comment including one region:

  ```ts
  /**
   * A rectangular area of the map, aligned with its axes.
   * @remarks
   * Named `Rectangle` because the Native type name, `rect`, collides with the Native function `Rect`.
   * @example Enumerating the units inside
   * {@includeCode ../../examples/harness/rectangle.ts#enum}
   * @native rect
   */
  ```

  Without `#name` it includes the whole file; `#a,b` joins two regions, and `file.ts:3-6` includes lines instead. A file that has regions is included by region: a whole-file include shows its markers.

- **Nothing to register.** A new file in either folder is compiled, and a new file in `harness/` is run, without any other change.

What checks them:

- `pnpm examples:build` compiles every example of both folders with typescript-to-lua and writes nothing: a type or transpile error fails it. `pnpm typecheck` type-checks them too. CI runs both on both legs.
- `pnpm test` runs each example of `harness/` in a fresh Lua state through the library's vitest project, as `examples/harness/<name>.test.ts > runs without error`. It loads the file, so its top level runs, then runs `config()`, `main()` and `MarkGameStarted()`, so every `Init.on*` callback runs; a Timer or a Trigger never fires. It passes when no error is raised and no `reforged-ts: ... failed: ...` line is printed. What the example prints is not checked: an example is documentation, not a test. On its own: `pnpm vitest run --project reforged-ts packages/reforged-ts/test/harness/examples.spec.ts`.
- `pnpm docs:check` resolves every `{@includeCode}`: a missing file or region fails it.
