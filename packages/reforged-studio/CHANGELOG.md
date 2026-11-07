# reforged-studio

## 1.0.0-alpha.3

### Minor Changes

- [#879](https://github.com/phmilk/reforged-ts/pull/879) [`671cd9b`](https://github.com/phmilk/reforged-ts/commit/671cd9b59d45e65ca0f6ad619d41f2deb7a4710a) Thanks [@wyller](https://github.com/wyller)! - The World Editor executable defaults to `World Editor.exe` beside the game's (`<install>/_retail_/x86_64`), so the reload after a save works with no `--world-editor`; `findWorldEditor` finds it. When the install holds none and none is given, the page disables "Reload the World Editor after a save" with the reason beside it, and `GET /api/session` names the executable as `worldEditorExecutable`.

- [#882](https://github.com/phmilk/reforged-ts/pull/882) [`ebf8187`](https://github.com/phmilk/reforged-ts/commit/ebf8187ab074b8a086b69091ea49859031a233a9) Thanks [@wyller](https://github.com/wyller)! - The Studio's small fixes from its walk beside the World Editor: the header wraps instead of cutting off Diff and the reload box at a half-screen width; "New object" stands out beside Search; the Save button's `Ctrl+S` hint reads on its blue; the Table mode counts "1 object"; a list of requirements (`ureq`, `areq`, `greq`) shows linked chips, as the other Rawcode lists do; the Diff's tabs look like tabs; the banner of a change on disk read quietly, and the toast after "Reload and keep my edits on top", offer "Show what changed", a new Diff tab (`GET /api/diff?against=reload`) of what the change on disk brought; and the watch reports a World Editor save once its files settle, so that the "changed on disk" banner no longer comes back after its merge.

### Patch Changes

- [#878](https://github.com/phmilk/reforged-ts/pull/878) [`1ea85d5`](https://github.com/phmilk/reforged-ts/commit/1ea85d56dc98647c1166288d69d78562ed9d1ae9) Thanks [@wyller](https://github.com/wyller)! - An Object definition's field table shows its fields as Object sync wrote them to the map folder, highlighted as modified and read-only, with its "Differs from" section, and the Table mode counts them: it no longer shows its base's values.

## 1.0.0-alpha.2

### Patch Changes

- [#870](https://github.com/phmilk/reforged-ts/pull/870) [`5e92fad`](https://github.com/phmilk/reforged-ts/commit/5e92fad7049c00b323f41189a904f1dc9fd7ed01) Thanks [@wyller](https://github.com/wyller)! - In DE, the map folder's imports are read from `_de.w3mod/`, where the World Editor writes an import marked DE, instead of `_hd.w3mod/`. The model picker lists an import under `_de.w3mod/` by the path beneath it.

- [#867](https://github.com/phmilk/reforged-ts/pull/867) [`35ae60c`](https://github.com/phmilk/reforged-ts/commit/35ae60cce2cd7911cb06cde6af83f7a89b7c84c2) Thanks [@wyller](https://github.com/wyller)! - A map's Supported Modes are read as the bit mask the World Editor writes, 1 SD, 2 HD and 4 DE. `allowedArtLayers` offers the layers whose bit is set, so a new map's default, 3, offers SD and HD without DE, and 5, 6 and 7 now limit the switch. `SUPPORTED_MODES` becomes `SUPPORTED_MODE_BITS`, the bit of each art layer. `readSupportedModes`'s docs say the bit mask.

- [#869](https://github.com/phmilk/reforged-ts/pull/869) [`fd20ab7`](https://github.com/phmilk/reforged-ts/commit/fd20ab7b0e953296b194fd6015946e646e88bc5c) Thanks [@wyller](https://github.com/wyller)! - The README no longer leaves the reading of the install's models to [#842](https://github.com/phmilk/reforged-ts/issues/842), and links what [#842](https://github.com/phmilk/reforged-ts/issues/842) checked in the game.
- Updated dependencies [[`35ae60c`](https://github.com/phmilk/reforged-ts/commit/35ae60cce2cd7911cb06cde6af83f7a89b7c84c2)]:
  - reforged-map@1.0.0-alpha.10

## 1.0.0-alpha.1

### Patch Changes

- [#862](https://github.com/phmilk/reforged-ts/pull/862) [`624034f`](https://github.com/phmilk/reforged-ts/commit/624034f04a4a562f61b647df06798ec7cb91abc7) Thanks [@wyller](https://github.com/wyller)! - The art layer is SD when the World Editor's Asset Mode is Default (`assetMode=-1`), as the editor runs then, and no longer follows the preferences' `hd`, which previewed in HD.

## 1.0.0-alpha.0

### Major Changes

- [#858](https://github.com/phmilk/reforged-ts/pull/858) [`7e56386`](https://github.com/phmilk/reforged-ts/commit/7e563862411bd73cda60981d38b58b975cc3ebd7) Thanks [@wyller](https://github.com/wyller)! - First release of `reforged-studio`, the Studio: a local app that edits a Map project's Object data through `reforged-map`, taking turns with the World Editor. `startStudio(...)`, or the `reforged-studio` command, serves on the loopback interface a page that finds, edits, creates and deletes objects, saves with undo across the session, keeps unsaved edits on top of a change on disk, shows Object definitions read-only and adopts objects into code, with icons and model previews read from the developer's own install. It writes `.reforged-studio.json` while it runs, which the hover of `reforged-map`'s TypeScript plugin links from. It needs `reforged-map` as a peer and the game installed. Install it with `pnpm add -D reforged-studio@next`.

### Patch Changes

- Updated dependencies [[`602cb2e`](https://github.com/phmilk/reforged-ts/commit/602cb2ed8299f186623c19726f965d6eba180501), [`28563b5`](https://github.com/phmilk/reforged-ts/commit/28563b5d5a7c61ec15ac367cfa8d7d92915b8e41), [`58495a5`](https://github.com/phmilk/reforged-ts/commit/58495a558138a031d7e12fdea9f06451663d04ba), [`6224cab`](https://github.com/phmilk/reforged-ts/commit/6224cabbcdf4e57fa4834bd07b7358bbae128337)]:
  - reforged-map@1.0.0-alpha.9
