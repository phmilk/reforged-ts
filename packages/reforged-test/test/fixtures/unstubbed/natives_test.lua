local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect

it("calls a Native no stub defines", function()
  PauseGame(true)
end)

it("throws for every Native of common.j no Shipped stub covers", function()
  expect(function() GetUnitName(nil) end).toThrow(
    'GetUnitName is a Native reforged-test does not stub: give it an answer with stubNative("GetUnitName", …)'
  )
  expect(function() BlzGetLocale() end).toThrow(
    'BlzGetLocale is a Native reforged-test does not stub: give it an answer with stubNative("BlzGetLocale", …)'
  )
end)

it("keeps the Native a Shipped stub covers", function()
  expect(GetPlayerId(Player(3))).toEqual(3)
end)

it("leaves the functions of blizzard.j and common.ai undefined", function()
  expect(BJDebugMsg).toBeUndefined()
  expect(StartThread).toBeUndefined()
end)

it("gives _G no metatable", function()
  expect(getmetatable(_G)).toBeUndefined()
end)

it("reports a function that is no Native as the VM does", function()
  expect(function() BJDebugMsg("hello") end).toThrow("attempt to call a nil value (global 'BJDebugMsg')")
end)
