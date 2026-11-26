-- Hand-written stand-in for a compiled top.test.ts on reforged-test/map,
-- which starts the game at the top of the file, as a beforeEach would.
local map = require("lua_modules.reforged-test.map.index")
local it, expect, startGame = map.it, map.expect, map.startGame

function MarkGameStarted() print("MarkGameStarted") end

local game = startGame()

it("starts the game at the top of the file", function()
  expect(game.printed).toEqual({ "MarkGameStarted" })
end)

it("starts it again for the next test, which cannot start it twice", function()
  expect(game.printed).toEqual({ "MarkGameStarted" })
  expect(startGame).toThrow("the game already started")
end)
