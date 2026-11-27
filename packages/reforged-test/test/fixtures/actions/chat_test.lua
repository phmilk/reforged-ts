-- Hand-written stand-in for a compiled chat.test.ts on reforged-test/map:
-- game.chat. The matching cases copy the Probe of chat matching,
-- docs/research/chat-event-matching.md: its registrations ("The
-- registrations"), its messages and the fires of each, in order ("What each
-- message fired"), what a handler reads, and the event of id 96.
local map = require("lua_modules.reforged-test.map.index")
local it, describe, expect, startGame = map.it, map.describe, map.expect, map.startGame

-- A trigger that appends its name and what GetEventPlayerChatStringMatched
-- answers, as `name(matched)`, to `log` each time its action runs.
local function bare(log, name)
  local trigger = CreateTrigger()
  TriggerAddAction(trigger, function()
    log[#log + 1] = name .. "(" .. GetEventPlayerChatStringMatched() .. ")"
  end)
  return trigger
end

-- A trigger of the given name, with one chat registration per filter, each
-- { text, exactMatchOnly }.
local function listen(log, name, player, filters)
  local trigger = bare(log, name)
  for _, filter in ipairs(filters) do
    TriggerRegisterPlayerChatEvent(trigger, player, filter[1], filter[2])
  end
  return trigger
end

-- The first fourteen Triggers of the Probe, in its order: all Player(0)'s
-- but `other-player`.
local function probeTriggers()
  local log = {}
  local typist = Player(0)
  listen(log, "exact-lower", typist, { { "-hello", true } })
  listen(log, "exact-upper", typist, { { "-HELLO", true } })
  listen(log, "sub-lower", typist, { { "-hello", false } })
  listen(log, "sub-upper", typist, { { "-HELLO", false } })
  listen(log, "sub-middle", typist, { { "ell", false } })
  listen(log, "sub-tail", typist, { { "world", false } })
  listen(log, "exact-two-words", typist, { { "-hello world", true } })
  listen(log, "empty-exact", typist, { { "", true } })
  listen(log, "empty-sub", typist, { { "", false } })
  listen(log, "other-player", Player(1), { { "", false } })
  listen(log, "double-same", typist, { { "-hello", false }, { "-hello", false } })
  listen(log, "double-different", typist, { { "-hello", false }, { "ell", false } })
  listen(log, "double-exact-and-sub", typist, { { "-hello", true }, { "-hello", false } })
  listen(log, "double-empty-and-sub", typist, { { "", false }, { "ell", false } })
  return log
end

-- What the Probe saw the message `-hello` fire, in order: 15 fires.
local HELLO = {
  "exact-lower(-hello)", "exact-upper(-hello)", "sub-lower(-hello)", "sub-upper(-hello)",
  "sub-middle(ell)", "empty-exact()", "empty-sub()",
  "double-same(-hello)", "double-same(-hello)",
  "double-different(-hello)", "double-different(ell)",
  "double-exact-and-sub(-hello)", "double-exact-and-sub(-hello)",
  "double-empty-and-sub()", "double-empty-and-sub(ell)",
}

-- What it saw `-Hello World` fire: 14 fires.
local HELLO_WORLD = {
  "sub-lower(-hello)", "sub-upper(-hello)", "sub-middle(ell)", "sub-tail(world)",
  "exact-two-words(-hello world)", "empty-exact()", "empty-sub()",
  "double-same(-hello)", "double-same(-hello)",
  "double-different(-hello)", "double-different(ell)",
  "double-exact-and-sub(-hello)",
  "double-empty-and-sub()", "double-empty-and-sub(ell)",
}

-- What it saw `say -hello now` fire: 12 fires, no exact registration.
local INSIDE = {
  "sub-lower(-hello)", "sub-upper(-hello)", "sub-middle(ell)", "empty-exact()", "empty-sub()",
  "double-same(-hello)", "double-same(-hello)",
  "double-different(-hello)", "double-different(ell)",
  "double-exact-and-sub(-hello)",
  "double-empty-and-sub()", "double-empty-and-sub(ell)",
}

local THREE_EMPTY = { "empty-exact()", "empty-sub()", "double-empty-and-sub()" }

-- What it saw `ELL` fire.
local ELL = {
  "sub-middle(ell)", "empty-exact()", "empty-sub()", "double-different(ell)",
  "double-empty-and-sub()", "double-empty-and-sub(ell)",
}

-- The messages of the Probe, each with its fires: the three cases of
-- `-hello`, which ignore case; a filter of two words; a message that
-- matches no filter but the empty ones; `-hello` inside a message and
-- between two spaces, which no exact filter matches since nothing is
-- trimmed; and a message all in upper case.
local MESSAGES = {
  { "-hello", HELLO },
  { "-HELLO", HELLO },
  { "-HeLLo", HELLO },
  { "-Hello World", HELLO_WORLD },
  { "-hello world", HELLO_WORLD },
  { "x", THREE_EMPTY },
  { "say -hello now", INSIDE },
  { " -hello ", INSIDE },
  { "ELL", ELL },
}

describe("game.chat matches as the game does", function()
  for _, case in ipairs(MESSAGES) do
    it("fires what the Probe saw the message [" .. case[1] .. "] fire, in its order", function()
      local game = startGame()
      local log = probeTriggers()
      game.chat(Player(0), case[1])
      expect(log).toEqual(case[2])
    end)
  end

  it("runs a Trigger once per matching registration, each reading its own filter", function()
    local game = startGame()
    local log = {}
    listen(log, "double-different", Player(0), { { "-hello", false }, { "ell", false } })
    game.chat(Player(0), "-hello")
    expect(log).toEqual({ "double-different(-hello)", "double-different(ell)" })
  end)

  it("runs the registrations in the order they were made, over every Trigger", function()
    local game = startGame()
    local log = {}
    local typist = Player(0)
    -- The four last Triggers of the Probe's second run.
    local createdFirst = bare(log, "created-first-registered-second")
    local createdSecond = bare(log, "created-second-registered-first")
    TriggerRegisterPlayerChatEvent(createdSecond, typist, "zz", false)
    TriggerRegisterPlayerChatEvent(createdFirst, typist, "zz", false)
    local alternateA = bare(log, "alternate-a")
    local alternateB = bare(log, "alternate-b")
    TriggerRegisterPlayerChatEvent(alternateA, typist, "qq", false)
    TriggerRegisterPlayerChatEvent(alternateB, typist, "qq", false)
    TriggerRegisterPlayerChatEvent(alternateA, typist, "q", false)
    game.chat(typist, "zz")
    expect(log).toEqual({ "created-second-registered-first(zz)", "created-first-registered-second(zz)" })
    for i = #log, 1, -1 do
      log[i] = nil
    end
    game.chat(typist, "qq")
    expect(log).toEqual({ "alternate-a(qq)", "alternate-b(qq)", "alternate-a(q)" })
  end)

  it("reaches the typing player's registrations only", function()
    local game = startGame()
    local log = {}
    listen(log, "of player 0", Player(0), { { "", false } })
    listen(log, "of player 1", Player(1), { { "", false } })
    game.chat(Player(1), "-go")
    expect(log).toEqual({ "of player 1()" })
  end)
end)

describe("game.chat", function()
  it("answers the message as given, the filter in lower case and the typing player", function()
    local game = startGame()
    local readings = {}
    local trigger = CreateTrigger()
    TriggerRegisterPlayerChatEvent(trigger, Player(1), "-HELLO", false)
    TriggerAddAction(trigger, function()
      readings[#readings + 1] = {
        message = GetEventPlayerChatString(),
        matched = GetEventPlayerChatStringMatched(),
        player = GetTriggerPlayer(),
        trigger = GetTriggeringTrigger(),
      }
    end)
    game.chat(Player(1), "  Say -HeLLo Now ")
    expect(readings).toEqual({
      { message = "  Say -HeLLo Now ", matched = "-hello", player = Player(1), trigger = trigger },
    })
    expect(GetEventPlayerChatString()).toBeUndefined()
    expect(GetEventPlayerChatStringMatched()).toBeUndefined()
  end)

  it("answers the event of id 96 as GetTriggerEventId, not EVENT_PLAYER_CHAT", function()
    local game = startGame()
    local event = nil
    local trigger = CreateTrigger()
    TriggerRegisterPlayerChatEvent(trigger, Player(0), "", false)
    TriggerAddAction(trigger, function()
      event = GetTriggerEventId()
    end)
    game.chat(Player(0), "-go")
    expect(GetHandleId(event)).toBe(96)
    expect(event == EVENT_PLAYER_CHAT).toBe(false)
  end)

  it("runs a condition before its action, and skips a disabled or destroyed Trigger", function()
    local game = startGame()
    local log = {}
    local function watch(name, passes)
      local trigger = CreateTrigger()
      TriggerRegisterPlayerChatEvent(trigger, Player(0), "-go", true)
      TriggerAddCondition(trigger, Condition(function()
        log[#log + 1] = name .. " condition"
        return passes
      end))
      TriggerAddAction(trigger, function()
        log[#log + 1] = name .. " action"
      end)
      return trigger
    end
    watch("first", true)
    DisableTrigger(watch("disabled", true))
    DestroyTrigger(watch("destroyed", true))
    watch("refusing", false)
    watch("last", true)
    game.chat(Player(0), "-go")
    expect(log).toEqual({
      "first condition", "first action", "refusing condition", "last condition", "last action",
    })
  end)

  it("takes anything with .handle, writes no state and returns nothing", function()
    local game = startGame()
    local log = {}
    listen(log, "go", Player(0), { { "-go", true } })
    expect(game.chat({ handle = Player(0) }, "-go")).toBeUndefined()
    expect(log).toEqual({ "go(-go)" })
    expect(GetPlayerSlotState(Player(0))).toBe(PLAYER_SLOT_STATE_PLAYING)
    expect(game.displayed).toEqual({})
    expect(game.printed).toEqual({})
  end)

  it("is no error with no Trigger registered", function()
    local game = startGame()
    game.chat(Player(0), "-go")
  end)

  it("throws a handler's error out of the action", function()
    local game = startGame()
    local trigger = CreateTrigger()
    TriggerRegisterPlayerChatEvent(trigger, Player(0), "", false)
    TriggerAddAction(trigger, function()
      error("the command broke", 0)
    end)
    expect(function() game.chat(Player(0), "-go") end).toThrow("the command broke")
    expect(GetEventPlayerChatString()).toBeUndefined()
  end)
end)

describe("game.chat refuses what the game refuses", function()
  local NOT_A_PLAYER =
    "game.chat: expected a player of the Test game, its Handle or anything with .handle, such as Player(0)"

  it("a player who is not playing: an empty slot", function()
    local game = startGame()
    local log = {}
    listen(log, "of player 2", Player(2), { { "", false } })
    expect(function() game.chat(Player(2), "-go") end).toThrow(
      "game.chat: Player(2) is not playing: its slot is empty")
    expect(log).toEqual({})
  end)

  it("what is not a player: a bare number, nothing, a unit, a Handle of newHandle", function()
    local game = startGame()
    expect(function() game.chat(0, "-go") end).toThrow(NOT_A_PLAYER)
    expect(function() game.chat(nil, "-go") end).toThrow(NOT_A_PLAYER)
    expect(function() game.chat(CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0), "-go") end).toThrow(NOT_A_PLAYER)
    expect(function() game.chat(map.newHandle("player"), "-go") end).toThrow(NOT_A_PLAYER)
  end)

  it("a message that is not a string", function()
    local game = startGame()
    expect(function() game.chat(Player(0), nil) end).toThrow(
      "game.chat: expected the message, a string")
    expect(function() game.chat(Player(0), 7) end).toThrow(
      "game.chat: expected the message, a string")
  end)

  it("names the test's line, not the harness's", function()
    local game = startGame()
    local ok, message = pcall(function() game.chat(Player(2), "-go") end)
    expect(ok).toBe(false)
    expect(message).toMatch("chat_test.lua:")
  end)
end)
