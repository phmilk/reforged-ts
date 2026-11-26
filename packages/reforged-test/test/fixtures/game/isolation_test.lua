-- Hand-written stand-in for a compiled isolation.test.ts on reforged-test/map
-- that imports reforged-test/lua too: each test runs in a Test game of its
-- own all the same.
local map = require("lua_modules.reforged-test.map.index")
local lua = require("lua_modules.reforged-test.lua.index")
local describe, it, expect, startGame = map.describe, map.it, map.expect, map.startGame

-- Module-level code: it runs once per test, so each test counts one load.
loads = (loads or 0) + 1
print("module loaded")

local function hasCreateUnit()
  for _, line in ipairs(lua.stubCalls()) do
    if line:find("CreateUnit(", 1, true) == 1 then
      return true
    end
  end
  return false
end

describe("a Test game per test", function()
  it("makes a unit, a call, a global and a line", function()
    local game = startGame()
    leaked = "from the first test"
    local unit = CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0)
    print("the first test")
    expect(GetHandleId(unit)).toEqual(1048578)
    expect(hasCreateUnit()).toBe(true)
    expect(game.printed).toEqual({ "module loaded", "the first test" })
  end)

  it("sees none of them, and loaded the file once", function()
    local game = startGame()
    expect(leaked).toBeUndefined()
    expect(hasCreateUnit()).toBe(false)
    expect(GetHandleId(CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0))).toEqual(1048578)
    expect(game.printed).toEqual({ "module loaded" })
    expect(loads).toEqual(1)
  end)

  it("runs a test of a repeated name", function()
    expect(loads).toEqual(1)
  end)

  it("runs a test of a repeated name", function()
    expect(loads).toEqual(1)
  end)
end)
