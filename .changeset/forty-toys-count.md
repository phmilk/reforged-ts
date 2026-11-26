---
"reforged-test": minor
---

Every Native is a Spy on `reforged-test/map` and `reforged-test/lua`: `expect(TimerStart).toHaveBeenCalledWith(expect.anything(), 60, true, expect.anything())` reads the calls the Native's Stub recorded, typed from its parameters, with nothing replaced and nothing to restore. `fn(impl?)` makes a Spy for a callback and `calls(spy)` returns the arguments of each call of a Spy or a Native. The five spy matchers are `toHaveBeenCalled`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith`, `toHaveBeenLastCalledWith` and `toHaveBeenNthCalledWith`. A spy matcher's failure lists the calls received, and `toEqual`, `toBe`, `toMatchObject` and the spy matchers comparing arguments now show Vitest's diff. A constant of the game is shown by its name in a failure, and compared by identity. The guide "Testing your map" gains its section "Assertions".
