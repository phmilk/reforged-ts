-- Hand-written stand-in for a compiled only.test.ts on reforged-test/lua:
-- its tests run at load, in its one Lua state, focused or not; the line
-- the test out of focus writes shows its body ran, and Vitest hides its
-- report only.
local runner = require("lua_modules.reforged-test.lua.index")
local it = runner.it

it("is out of focus", function() io.write("out of focus ran\n") end)
it.only("is focused", function() end)
