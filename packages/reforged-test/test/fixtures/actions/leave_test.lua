-- Hand-written stand-in for a compiled leave.test.ts on reforged-test/map:
-- game.leave. No Probe run measured a player leaving, which takes a second
-- client (probe/README.md, "What stays for a human"): the cases state what
-- the Spec decided, the slot written as PLAYER_SLOT_STATE_LEFT, then
-- EVENT_PLAYER_LEAVE, and nothing derived.
local map = require("lua_modules.reforged-test.map.index")
local it, describe, expect, startGame = map.it, map.describe, map.expect, map.startGame

-- Registers `event` for Player(0) and Player(1), each on a trigger that
-- appends `name of <slot>` to `log` when its condition runs and again when
-- its action runs, and reads the responses in its action.
local function watchPlayers(log, readings, name, event)
  for slot = 0, 1 do
    local label = name .. " of " .. slot
    local trigger = CreateTrigger()
    TriggerRegisterPlayerEvent(trigger, Player(slot), event)
    TriggerAddCondition(trigger, Condition(function()
      log[#log + 1] = label .. " condition"
      return true
    end))
    TriggerAddAction(trigger, function()
      log[#log + 1] = label .. " action"
      readings[label] = {
        triggerPlayer = GetTriggerPlayer(),
        eventId = GetTriggerEventId(),
        slotState = GetPlayerSlotState(GetTriggerPlayer()),
      }
    end)
  end
end

describe("game.leave", function()
  it("writes PLAYER_SLOT_STATE_LEFT, then dispatches EVENT_PLAYER_LEAVE of that player", function()
    local game = startGame()
    local log, readings = {}, {}
    watchPlayers(log, readings, "EVENT_PLAYER_LEAVE", EVENT_PLAYER_LEAVE)
    expect(GetPlayerSlotState(Player(1))).toBe(PLAYER_SLOT_STATE_PLAYING)
    expect(game.leave(Player(1))).toBeUndefined()
    expect(log).toEqual({ "EVENT_PLAYER_LEAVE of 1 condition", "EVENT_PLAYER_LEAVE of 1 action" })
    expect(readings["EVENT_PLAYER_LEAVE of 1"]).toEqual({
      triggerPlayer = Player(1), eventId = EVENT_PLAYER_LEAVE, slotState = PLAYER_SLOT_STATE_LEFT,
    })
    expect(GetPlayerSlotState(Player(1))).toBe(PLAYER_SLOT_STATE_LEFT)
    expect(GetPlayerSlotState(Player(0))).toBe(PLAYER_SLOT_STATE_PLAYING)
    expect(GetTriggerPlayer()).toBeUndefined()
  end)

  it("fires no defeat and no victory, and keeps the player's units", function()
    local game = startGame()
    local log = {}
    watchPlayers(log, {}, "EVENT_PLAYER_DEFEAT", EVENT_PLAYER_DEFEAT)
    watchPlayers(log, {}, "EVENT_PLAYER_VICTORY", EVENT_PLAYER_VICTORY)
    local unit = CreateUnit(Player(1), FourCC("hfoo"), 0, 0, 0)
    local deaths = CreateTrigger()
    TriggerRegisterPlayerUnitEvent(deaths, Player(1), EVENT_PLAYER_UNIT_DEATH, nil)
    TriggerAddAction(deaths, function()
      log[#log + 1] = "a death"
    end)
    game.leave(Player(1))
    expect(log).toEqual({})
    expect(UnitAlive(unit)).toBe(true)
    expect(GetOwningPlayer(unit)).toBe(Player(1))
  end)

  it("takes anything with .handle", function()
    local game = startGame()
    game.leave({ handle = Player(0) })
    expect(GetPlayerSlotState(Player(0))).toBe(PLAYER_SLOT_STATE_LEFT)
  end)

  it("throws a handler's error out of the action, the player gone", function()
    local game = startGame()
    local trigger = CreateTrigger()
    TriggerRegisterPlayerEvent(trigger, Player(1), EVENT_PLAYER_LEAVE)
    TriggerAddAction(trigger, function()
      error("the handler broke", 0)
    end)
    expect(function() game.leave(Player(1)) end).toThrow("the handler broke")
    expect(GetPlayerSlotState(Player(1))).toBe(PLAYER_SLOT_STATE_LEFT)
  end)
end)

describe("game.leave refuses what the game refuses", function()
  it("a player who is not playing: an empty slot", function()
    local game = startGame()
    expect(function() game.leave(Player(2)) end).toThrow(
      "game.leave: Player(2) is not playing: its slot is empty")
    expect(GetPlayerSlotState(Player(2))).toBe(PLAYER_SLOT_STATE_EMPTY)
  end)

  it("a player who already left", function()
    local game = startGame()
    game.leave(Player(1))
    local log = {}
    watchPlayers(log, {}, "EVENT_PLAYER_LEAVE", EVENT_PLAYER_LEAVE)
    expect(function() game.leave(Player(1)) end).toThrow(
      "game.leave: Player(1) is not playing: it left the game")
    expect(log).toEqual({})
  end)

  it("after leaving, that player's chat and select, its selection kept", function()
    local game = startGame()
    local unit = CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0)
    local selected = CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0)
    game.select(Player(1), selected)
    game.leave(Player(1))
    expect(function() game.chat(Player(1), "-go") end).toThrow(
      "game.chat: Player(1) is not playing: it left the game")
    expect(function() game.select(Player(1), unit) end).toThrow(
      "game.select: Player(1) is not playing: it left the game")
    -- The selection it had is kept, and a unit can still leave it.
    expect(IsUnitSelected(selected, Player(1))).toBe(true)
    game.deselect(Player(1), selected)
    expect(IsUnitSelected(selected, Player(1))).toBe(false)
    -- The other player goes on.
    game.chat(Player(0), "-go")
    game.select(Player(0), unit)
  end)

  it("what is not a player: a bare number, nothing, a unit, a Handle of newHandle", function()
    local game = startGame()
    local NOT_A_PLAYER =
      "game.leave: expected a player of the Test game, its Handle or anything with .handle, such as Player(0)"
    expect(function() game.leave(1) end).toThrow(NOT_A_PLAYER)
    expect(function() game.leave(nil) end).toThrow(NOT_A_PLAYER)
    expect(function() game.leave(CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0)) end).toThrow(NOT_A_PLAYER)
    expect(function() game.leave(map.newHandle("player")) end).toThrow(NOT_A_PLAYER)
  end)

  it("names the test's line, not the harness's", function()
    local game = startGame()
    local ok, message = pcall(function() game.leave(Player(2)) end)
    expect(ok).toBe(false)
    expect(message).toMatch("leave_test.lua:")
  end)
end)
