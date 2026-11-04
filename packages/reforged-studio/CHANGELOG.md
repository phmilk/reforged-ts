# reforged-studio

## 1.0.0-alpha.1

### Patch Changes

- [#862](https://github.com/phmilk/reforged-ts/pull/862) [`624034f`](https://github.com/phmilk/reforged-ts/commit/624034f04a4a562f61b647df06798ec7cb91abc7) Thanks [@wyller](https://github.com/wyller)! - The art layer is SD when the World Editor's Asset Mode is Default (`assetMode=-1`), as the editor runs then, and no longer follows the preferences' `hd`, which previewed in HD.

## 1.0.0-alpha.0

### Major Changes

- [#858](https://github.com/phmilk/reforged-ts/pull/858) [`7e56386`](https://github.com/phmilk/reforged-ts/commit/7e563862411bd73cda60981d38b58b975cc3ebd7) Thanks [@wyller](https://github.com/wyller)! - First release of `reforged-studio`, the Studio: a local app that edits a Map project's Object data through `reforged-map`, taking turns with the World Editor. `startStudio(...)`, or the `reforged-studio` command, serves on the loopback interface a page that finds, edits, creates and deletes objects, saves with undo across the session, keeps unsaved edits on top of a change on disk, shows Object definitions read-only and adopts objects into code, with icons and model previews read from the developer's own install. It writes `.reforged-studio.json` while it runs, which the hover of `reforged-map`'s TypeScript plugin links from. It needs `reforged-map` as a peer and the game installed. Install it with `pnpm add -D reforged-studio@next`.

### Patch Changes

- Updated dependencies [[`602cb2e`](https://github.com/phmilk/reforged-ts/commit/602cb2ed8299f186623c19726f965d6eba180501), [`28563b5`](https://github.com/phmilk/reforged-ts/commit/28563b5d5a7c61ec15ac367cfa8d7d92915b8e41), [`58495a5`](https://github.com/phmilk/reforged-ts/commit/58495a558138a031d7e12fdea9f06451663d04ba), [`6224cab`](https://github.com/phmilk/reforged-ts/commit/6224cabbcdf4e57fa4834bd07b7358bbae128337)]:
  - reforged-map@1.0.0-alpha.9
