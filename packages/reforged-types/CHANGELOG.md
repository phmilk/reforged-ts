# reforged-types

## 1.0.0-alpha.0

### Major Changes

- [#159](https://github.com/phmilk/reforged-ts/pull/159) [`05eda1a`](https://github.com/phmilk/reforged-ts/commit/05eda1a99bce016ef10483143216260bd706e482) Thanks [@phmilk](https://github.com/phmilk)! - First release under this name, for Warcraft III 3.0.0 and later. `reforged-ts` is the fork of w3ts 3.0.2; `reforged-types`, `reforged-test` and `eslint-plugin-reforged` are new packages.

### Patch Changes

- [#133](https://github.com/phmilk/reforged-ts/pull/133) [`8c2a87a`](https://github.com/phmilk/reforged-ts/commit/8c2a87a88822a03abba648aa6f0f22b143146151) Thanks [@wyller](https://github.com/wyller)! - Mark the 3.0.0 Natives that return a per-client value `@async` and list them in `async-natives.json`: the keyboard and mouse polls `BlzIsKeyPressed`, `BlzIsMetaKeyPressed`, `BlzIsMouseButtonPressed`, `BlzGetMouseScreenPosX` and `BlzGetMouseScreenPosY`; the local camera's `GetCameraFieldControlledByInput` and `BlzCameraGetCameraType`; and the resolution-dependent conversions `BlzPixelToFrameX`, `BlzPixelToFrameY`, `BlzFrameToPixelX` and `BlzFrameToPixelY`.
