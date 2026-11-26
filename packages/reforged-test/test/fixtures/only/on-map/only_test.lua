-- Hand-written stand-in for a compiled only.test.ts on reforged-test/map.
-- Each load writes a line, which Vitest reports with the test, or the file,
-- that was running when it came: a test out of focus opens no Test game.
local map = require("lua_modules.reforged-test.map.index")
local describe, it = map.describe, map.it

io.write("loaded\n")

it("is out of focus", function() end)
it.only("is focused", function() end)

describe.only("a focused describe", function()
  it("is focused with its describe", function() end)
end)
