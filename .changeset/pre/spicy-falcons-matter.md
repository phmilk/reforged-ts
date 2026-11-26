---
"reforged-test": minor
---

The `expect` of `reforged-test/lua` gains Vitest's `.not`, `toBeDefined`, `toContain`, `toContainEqual`, `toHaveLength`, `toMatchObject`, `toBeGreaterThan`, `toBeGreaterThanOrEqual`, `toBeLessThan`, `toBeLessThanOrEqual`, `toBeCloseTo`, `toBeInstanceOf` and `toMatch`, and the asymmetric matchers `expect.anything()`, `expect.any(kind)`, `expect.objectContaining()`, `expect.arrayContaining()` and `expect.stringContaining()` inside `toEqual`, `toMatchObject` and `toContainEqual`. Every text a matcher takes is plain text and means "contains"; `expect.any` takes a Lua type name or a class.
