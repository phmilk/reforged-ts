-- Hand-written stand-in for a compiled caught.test.ts on reforged-test/map:
-- the Caught errors. The library reports each through the global
-- __reforged_caught_error(origin, message) (ADR 0028), on every failure, the
-- repeats it only counts included, and goes on: the tests call that global
-- as the library calls it.
local map = require("lua_modules.reforged-test.map.index")
local describe, it, expect, startGame = map.describe, map.it, map.expect, map.startGame
local beforeEach, afterEach = map.beforeEach, map.afterEach

local function caught(origin, message)
  rawget(_G, "__reforged_caught_error")(origin, message)
end

-- The editor function startGame runs first: a test sets the flag to raise a
-- Caught error inside startGame, as a broken Init callback does.
function InitGlobals()
  if __fixture_break_init then caught('globals callback "spawn"', "init broke") end
end

describe("a Caught error left unexpected", function()
  it("fails the test at its end, the game going on", function()
    local game = startGame()
    caught("Timer#1048577 Timer.start", "war3map.lua:12: boom")
    print("went on")
    expect(game.printed).toContain("went on")
  end)

  it("lists each, a repeat counted on the line of its first", function()
    startGame()
    caught("Timer#1048577 Timer.start", "boom")
    caught("Trigger#1048578 Trigger.addAction", "bang")
    caught("Timer#1048577 Timer.start", "boom")
    caught("Timer#1048577 Timer.start", "boom")
  end)

  it("lists them before a failed assertion", function()
    startGame()
    caught("Timer#1048577 Timer.start", "boom")
    expect(1).toEqual(2)
  end)

  it("lists them before an error", function()
    startGame()
    caught("Timer#1048577 Timer.start", "boom")
    error("body broke", 0)
  end)

  it("does not fail for a warning the library prints", function()
    startGame()
    print("reforged-ts: Reforged.configure({ devMode: true }) called after a callback was registered")
  end)
end)

describe("game.expectError", function()
  it("expects every Caught error so far whose message contains the text, repeats included", function()
    local game = startGame()
    caught("Timer#1048577 Timer.start", "war3map.lua:12: attempt to index a nil value (local 'wave')")
    caught("Timer#1048577 Timer.start", "war3map.lua:12: attempt to index a nil value (local 'wave')")
    caught("Trigger#1048578 Trigger.addAction", "war3map.lua:40: attempt to index a nil value (field 'hero')")
    expect(select("#", game.expectError("attempt to index a nil value"))).toBe(0)
  end)

  it("leaves unexpected the ones whose message does not contain it", function()
    local game = startGame()
    caught("Timer#1048577 Timer.start", "boom")
    caught("Trigger#1048578 Trigger.addAction", "bang")
    game.expectError("boom")
  end)

  it("throws at once when none contains the text", function()
    local game = startGame()
    caught("Timer#1048577 Timer.start", "bang")
    expect(function() game.expectError("boom") end)
      .toThrow('game.expectError: no Caught error not yet expected contains "boom"')
    game.expectError("bang")
  end)

  it("throws for a Caught error already expected", function()
    local game = startGame()
    caught("Timer#1048577 Timer.start", "boom")
    game.expectError("boom")
    expect(function() game.expectError("boom") end).toThrow("no Caught error not yet expected")
  end)

  it("needs another call for a later Caught error", function()
    local game = startGame()
    caught("Timer#1048577 Timer.start", "boom")
    game.expectError("boom")
    caught("Timer#1048577 Timer.start", "boom")
  end)

  it("takes the text as plain text, not a pattern", function()
    local game = startGame()
    caught("Timer#1048577 Timer.start", "50% (done)")
    expect(function() game.expectError("5.%") end).toThrow("no Caught error")
    game.expectError("% (d")
  end)

  it("refuses a text that is not a string", function()
    local game = startGame()
    expect(function() game.expectError(nil) end)
      .toThrow("game.expectError: expected a part of a Caught error's message, a string")
  end)

  it("has no errors on game", function()
    local game = startGame()
    caught("Timer#1048577 Timer.start", "boom")
    expect(game.errors).toBeUndefined()
    game.expectError("boom")
  end)
end)

describe("for the whole test", function()
  it("counts one raised during startGame", function()
    __fixture_break_init = true
    startGame()
  end)

  it("expects one raised during startGame", function()
    __fixture_break_init = true
    startGame().expectError("init broke")
  end)

  describe("in a beforeEach, before the game started", function()
    beforeEach(function() caught("Timer#1048577 Timer.start", "before broke") end)
    it("counts it", function() startGame() end)
    it("expects it in the test", function() startGame().expectError("before broke") end)
  end)

  describe("in an afterEach", function()
    local game
    beforeEach(function() game = startGame() end)
    afterEach(function() caught("Timer#1048577 Timer.start", "after broke") end)
    it("counts it, failing a test that had passed", function() end)
  end)

  describe("expected in an afterEach", function()
    local game
    beforeEach(function() game = startGame() end)
    afterEach(function() game.expectError("boom") end)
    it("passes: the check comes after the last afterEach", function()
      caught("Timer#1048577 Timer.start", "boom")
    end)
  end)

  describe("expected in a cleanup a beforeEach returned", function()
    local game
    beforeEach(function()
      game = startGame()
      return function() game.expectError("boom") end
    end)
    it("passes: the check comes after the cleanups", function()
      caught("Timer#1048577 Timer.start", "boom")
    end)
  end)
end)
