-- Hand-written stand-in for a compiled shared.test.ts on reforged-test/lua
-- alone: no Test game, so no Caught error hook. The library then reports as
-- in the game, and nothing fails a test for it.
local lua = require("lua_modules.reforged-test.lua.index")
local it, expect = lua.it, lua.expect

it("defines no __reforged_caught_error", function()
  expect(rawget(_G, "__reforged_caught_error")).toBeUndefined()
end)
