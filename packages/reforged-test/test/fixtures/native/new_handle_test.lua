-- Hand-written stand-in for a compiled new-handle.test.ts on
-- reforged-test/map: a Handle a test's own answer creates.
local map = require("lua_modules.reforged-test.map.index")
local runner = require("lua_modules.reforged-test.lua.index")
local it, expect = map.it, map.expect
local newHandle, stubNative = map.newHandle, map.stubNative

it("returns a Handle of the kind, as the Shipped stubs make one", function()
  local unit = newHandle("unit")
  expect(tostring(unit)).toEqual("unit: " .. GetHandleId(unit))
  expect(newHandle("unit"))["not"].toBe(unit)
end)

it("follows the Test game's handle id sequence", function()
  local before = GetHandleId(CreateTrigger())
  local unit = newHandle("unit")
  local after = GetHandleId(CreateTrigger())
  expect(GetHandleId(unit)).toEqual(before + 1)
  expect(after).toEqual(before + 2)
end)

it("records no call, so an answer that creates one records the Native's alone", function()
  stubNative("CreateCorpse", function() return newHandle("unit") end)
  local mark = #runner.stubCalls()
  newHandle("timer")
  expect(#runner.stubCalls()).toEqual(mark)
  local corpse = CreateCorpse(nil, 1, 0, 0, 270)
  expect(#runner.stubCalls()).toEqual(mark + 1)
  expect(tostring(corpse)).toEqual("unit: " .. corpse.__handleId)
end)
