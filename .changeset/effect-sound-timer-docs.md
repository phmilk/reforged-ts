---
"reforged-ts": patch
---

Every public member of `Effect`, `Sound`, `Image`, `Ubersplat`, `FogModifier`, `WeatherEffect`, `Timer` and `GameCache` has a doc comment: what it does, its parameters with their units and ranges, what it returns, the error each `create` raises and the Natives behind it. Each class has an example: `examples/harness/effect-create.ts`, `sound-create.ts` and `timer-every.ts` run on the harness; `examples/game/image-create.ts`, `ubersplat-create.ts`, `fogmodifier-create.ts`, `weathereffect-create.ts` and `gamecache-campaign.ts` need the game.
