local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect

it("calls a Native no stub defines", function()
  CreateUnit(Player(0), 1751543663, 0, 0, 270)
end)
