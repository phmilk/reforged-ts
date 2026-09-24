local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect

it("sees no global from a_test", function()
  expect(leaked).toBeUndefined()
end)

it("starts a new call log and handle ids from the base", function()
  expect(#__stub_calls).toEqual(0)
  expect(GetHandleId(CreateTrigger())).toEqual(1048577)
end)
