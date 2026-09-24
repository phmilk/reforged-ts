local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect

it("sets a global and makes a handle", function()
  leaked = "from a_test"
  expect(Player(0)).toBeTruthy()
  expect(GetHandleId(CreateTrigger())).toEqual(1048578)
end)
