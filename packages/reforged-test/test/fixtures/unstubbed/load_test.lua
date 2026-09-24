-- Calls a Native at module load time, before any test is registered.
local runner = require("lua_modules.reforged-test.lua.index")
local localPlayer = GetLocalPlayer()
runner.it("never registered", function() end)
