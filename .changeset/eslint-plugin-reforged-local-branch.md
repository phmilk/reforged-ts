---
"eslint-plugin-reforged": minor
---

**`no-game-state-in-local-branch`** (error). Reports game state changed inside a branch that runs for the local player only: the consequent of an `if`, a conditional or `&&`/`||` whose test reads `GetLocalPlayer()`, `MapPlayer.fromLocal()` or `player.isLocal()` (directly, in an equality, or through one `const`), the `else` branch of a negated test, the function passed to `MapPlayer.runLocal`, and functions defined there. Inside it, the rule reports a Native or Wrapper member that `data/local-safe.json` does not list, a creation, `Filter`/`Condition`, `ForGroup`/`ForForce`, `GetRandomInt`/`GetRandomReal`/`SetRandomSeed` and `Math.random`. Visual calls (frames, camera, sound, vertex colours) and text displays pass; pure computation and calls to project functions are not reported. The `allow` option adds names treated as visual. No fix and no suggestion.
