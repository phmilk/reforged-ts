local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect

it("calls a Native no stub defines", function()
  PauseGame(true)
end)
