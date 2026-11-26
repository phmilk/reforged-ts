-- Hand-written stand-in for a compiled game.test.ts on reforged-test/map:
-- the file starts each test's game in a beforeEach.
local map = require("lua_modules.reforged-test.map.index")
local it, expect, startGame = map.it, map.expect, map.startGame
local beforeEach = map.beforeEach

function MarkGameStarted() print("game started") end

local game
beforeEach(function() game = startGame() end)

it("starts the game in a beforeEach", function()
  print("first test")
  expect(game.printed).toEqual({ "game started", "first test" })
end)

it("starts a game of its own for each test", function()
  expect(game.printed).toEqual({ "game started" })
end)

it("throws on startGame in a test whose beforeEach started the game", function()
  expect(startGame).toThrow("startGame: the game already started")
end)
