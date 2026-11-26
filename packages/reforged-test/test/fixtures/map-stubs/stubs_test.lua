-- Hand-written stand-in for a compiled stubs.test.ts on reforged-test/map,
-- run with the stub file ../stubs/first.lua listed in the stubs option.
local map = require("lua_modules.reforged-test.map.index")
local it, expect, stubNative = map.it, map.expect, map.stubNative

it("calls a Native a listed stub file defines", function()
  expect(BlzGetLocale()).toEqual("enUS")
  expect(bj_MAX_PLAYERS).toEqual(12)
end)

it("replaces it with stubNative", function()
  stubNative("BlzGetLocale", function() return "ptBR" end)
  expect(BlzGetLocale()).toEqual("ptBR")
end)
