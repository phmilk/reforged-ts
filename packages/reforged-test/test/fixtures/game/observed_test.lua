-- Hand-written stand-in for a compiled observed.test.ts on reforged-test/map:
-- what the map printed and displayed.
local map = require("lua_modules.reforged-test.map.index")
local it, expect, startGame = map.it, map.expect, map.startGame

print("at load")

it("keeps one line per print call, its arguments joined by a tab", function()
  local game = startGame()
  print("score", 3, true)
  print()
  expect(game.printed).toEqual({ "at load", "score\t3\ttrue", "" })
end)

it("gives a copy of the lines at each read", function()
  local game = startGame()
  local printed = game.printed
  printed[#printed + 1] = "written by the test"
  print("later")
  expect(printed).toEqual({ "at load", "written by the test" })
  expect(game.printed).toEqual({ "at load", "later" })
end)

it("keeps each message displayed with its player and duration", function()
  local game = startGame()
  DisplayTextToPlayer(Player(0), 0, 0, "welcome")
  DisplayTimedTextToPlayer(Player(1), 0.5, 0.5, 5, "wave 1")
  DisplayTimedTextFromPlayer(Player(0), 0, 0, 2, "%s joined")
  expect(game.displayed).toEqual({
    { text = "welcome", player = Player(0) },
    { text = "wave 1", player = Player(1), duration = 5 },
    { text = "%s joined", player = Player(0), duration = 2 },
  })
  expect(game.displayed[2].player).toBe(Player(1))
end)

it("gives a copy of the messages at each read", function()
  local game = startGame()
  local displayed = game.displayed
  DisplayTextToPlayer(Player(0), 0, 0, "later")
  expect(displayed).toEqual({})
  expect(#game.displayed).toEqual(1)
end)
