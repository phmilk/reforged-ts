-- Hand-written stand-in for a compiled start.test.ts on reforged-test/map.
-- The editor functions print their names, so a test reads the order
-- startGame runs them in; config and main stay undefined.
local map = require("lua_modules.reforged-test.map.index")
local it, expect, startGame = map.it, map.expect, map.startGame

function InitGlobals() print("InitGlobals") end
function InitCustomTriggers() print("InitCustomTriggers") end
function RunInitializationTriggers() print("RunInitializationTriggers") end
function MarkGameStarted() print("MarkGameStarted") end

it("runs the map's initialization through the Init stages", function()
  local game = startGame()
  expect(game.printed).toEqual({
    "InitGlobals",
    "InitCustomTriggers",
    "RunInitializationTriggers",
    "MarkGameStarted",
  })
  expect(type(config)).toEqual("function")
  expect(type(main)).toEqual("function")
end)

it("throws on a second call in the same test", function()
  startGame()
  expect(startGame).toThrow("startGame: the game already started")
end)

it("fails a test that starts the game twice", function()
  startGame()
  startGame()
end)
