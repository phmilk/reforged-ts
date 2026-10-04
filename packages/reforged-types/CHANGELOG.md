# reforged-types

## 1.0.0-alpha.4

### Patch Changes

- [#374](https://github.com/phmilk/reforged-ts/pull/374) [`728953d`](https://github.com/phmilk/reforged-ts/commit/728953ddfb6f3b7ef683f7c49e62a82379986f8a) Thanks [@phmilk](https://github.com/phmilk)! - Every handle-returning Native of `common.j` names its Nullability family in the Overlay, and the generator enforces the curation rule: a Native of a nullable family (an event response, a callback getter, a lookup, an optional property) is never typed non-null. The README says when a handle return is typed non-null. No type changes.

## 1.0.0-alpha.3

### Minor Changes

- [#352](https://github.com/phmilk/reforged-ts/pull/352) [`34afe2c`](https://github.com/phmilk/reforged-ts/commit/34afe2cace1a87a9b827952fa3c52ee29a0f49ba) Thanks [@wyller](https://github.com/wyller)! - `BlzFrameGetParent` now returns `framehandle | undefined`: the Nullability sweep saw it return nothing for a destroyed frame on 3.0.0.24268. Check its result before you use it, as `Frame.getParent()` already does. Sixteen more Natives keep their non-null return, now backed by the sweep: `CreateTimer`, `CreateTrigger`, `CreateRegion`, `CreateCameraSetup`, `GetLocalPlayer`, `Location`, `Rect`, `Condition`, `Filter`, `And`, `Or`, `Not`, `GetOwningPlayer`, `GetUnitLoc`, `CameraSetupGetDestPositionLoc` and `TriggerAddAction`. Each carries a `@remarks` with the cases measured. `Trigger.addAction` drops a check for a `nil` the game never returned.

## 1.0.0-alpha.2

### Patch Changes

- [#310](https://github.com/phmilk/reforged-ts/pull/310) [`0640604`](https://github.com/phmilk/reforged-ts/commit/064060406607068564994b44bdec8b63f3b6402e) Thanks [@wyller](https://github.com/wyller)! - `GameCache.restoreUnit` returns the restored unit as a `Unit`, and throws `reforged-ts: failed to create Unit (<key>)` when the game creates none, instead of returning the raw `unit` handle or `undefined`. `GameCache.store` takes a `Unit` instead of the raw `unit` handle. `GetStoredString` is typed `string`, not `string | undefined`: the game returns `""` for a missing key.

## 1.0.0-alpha.1

### Patch Changes

- [#209](https://github.com/phmilk/reforged-ts/pull/209) [`7aa0ede`](https://github.com/phmilk/reforged-ts/commit/7aa0edeb5ec49bb767985ef5d42abb709281c0ce) Thanks [@phmilk](https://github.com/phmilk)! - The README's "For AI agents" line links the documentation of this version as Markdown for a language model: `llms.txt`, one link per page, and `llms-full.txt`, every page in one file. A prerelease links the working tree's docs, `https://phmilk.github.io/reforged-ts/docs/next/llms.txt`; a stable release links the docs version of its library minor, `/docs/<major.minor>/llms.txt`.

## 1.0.0-alpha.0

### Major Changes

- [#159](https://github.com/phmilk/reforged-ts/pull/159) [`05eda1a`](https://github.com/phmilk/reforged-ts/commit/05eda1a99bce016ef10483143216260bd706e482) Thanks [@phmilk](https://github.com/phmilk)! - First release under this name, for Warcraft III 3.0.0 and later. `reforged-ts` is the fork of w3ts 3.0.2; `reforged-types`, `reforged-test` and `eslint-plugin-reforged` are new packages.

### Patch Changes

- [#133](https://github.com/phmilk/reforged-ts/pull/133) [`8c2a87a`](https://github.com/phmilk/reforged-ts/commit/8c2a87a88822a03abba648aa6f0f22b143146151) Thanks [@wyller](https://github.com/wyller)! - Mark the 3.0.0 Natives that return a per-client value `@async` and list them in `async-natives.json`: the keyboard and mouse polls `BlzIsKeyPressed`, `BlzIsMetaKeyPressed`, `BlzIsMouseButtonPressed`, `BlzGetMouseScreenPosX` and `BlzGetMouseScreenPosY`; the local camera's `GetCameraFieldControlledByInput` and `BlzCameraGetCameraType`; and the resolution-dependent conversions `BlzPixelToFrameX`, `BlzPixelToFrameY`, `BlzFrameToPixelX` and `BlzFrameToPixelY`.
