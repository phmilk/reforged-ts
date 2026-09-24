local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect

it("loads consumer stubs after the shipped ones, in the listed order", function()
  expect(first_saw_shipped_record).toEqual(true)
  expect(first_saw_max_players).toEqual(24)
  expect(bj_MAX_PLAYERS).toEqual(12)
  expect(second_saw_first).toEqual(true)
end)

it("calls a Native a consumer stub defines", function()
  expect(GetLocalPlayer()).toBe(Player(0))
  expect(runner.stubCalls()).toContainCall("GetLocalPlayer()")
end)
