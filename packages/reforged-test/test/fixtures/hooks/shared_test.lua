-- Hand-written stand-in for a compiled shared.test.ts on reforged-test/lua
-- alone: the tests share one Lua state, and the hooks run around each.
local lua = require("lua_modules.reforged-test.lua.index")
local it, expect, beforeEach, afterEach = lua.it, lua.expect, lua.beforeEach, lua.afterEach

local before, after = 0, 0
beforeEach(function() before = before + 1 end)
afterEach(function() after = after + 1 end)

it("runs the hooks around the first test", function()
  expect({ before, after }).toEqual({ 1, 0 })
end)

it("runs them again around the second, in the same state", function()
  expect({ before, after }).toEqual({ 2, 1 })
end)
