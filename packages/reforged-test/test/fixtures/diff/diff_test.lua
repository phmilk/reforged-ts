-- Hand-written stand-in for a compiled diff.test.ts on reforged-test/map:
-- two failures whose matcher compared two values, which Vitest draws the
-- diff of.
local map = require("lua_modules.reforged-test.map.index")
local it, expect, fn = map.it, map.expect, map.fn

it("a deep difference", function()
  expect({ wave = 2, units = { "hfoo" } }).toEqual({ wave = 3, units = { "hfoo" } })
end)

it("a call with other arguments", function()
  local spy = fn()
  spy(1, "a")
  expect(spy).toHaveBeenCalledWith(1, "b")
end)
