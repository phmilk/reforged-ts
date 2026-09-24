-- Calls a Native at module load time, before any test is registered.
local runner = require("lua_modules.reforged-test.lua.index")
local locale = BlzGetLocale()
runner.it("never registered", function() end)
