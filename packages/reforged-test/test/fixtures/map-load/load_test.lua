-- Hand-written stand-in for a compiled load.test.ts on reforged-test/map that
-- calls an unstubbed Native at module load.
local map = require("lua_modules.reforged-test.map.index")
local it = map.it

BlzGetLocale()

it("never runs", function() end)
