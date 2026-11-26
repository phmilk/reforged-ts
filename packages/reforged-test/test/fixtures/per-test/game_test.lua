-- Hand-written stand-in for a compiled game.test.ts on reforged-test/map.
-- Each load writes a line to the process's standard output, which Vitest
-- reports with the test, or the file, that was running when it came.
local map = require("lua_modules.reforged-test.map.index")
local describe, it = map.describe, map.it

io.write("loaded\n")

describe("game", function()
  it("first", function() io.write("first ran\n") end)
  it("second", function() io.write("second ran\n") end)
end)
