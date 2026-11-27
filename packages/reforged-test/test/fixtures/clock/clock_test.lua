-- Hand-written stand-in for a compiled clock.test.ts on reforged-test/map:
-- the Game clock and game.advanceTime.
local map = require("lua_modules.reforged-test.map.index")
local it, describe, expect, startGame = map.it, map.describe, map.expect, map.startGame

-- Starts a new timer whose handler appends `name` to `log`.
local function logging(log, name, timeout, periodic)
  local timer = CreateTimer()
  TimerStart(timer, timeout, periodic or false, function()
    log[#log + 1] = name
  end)
  return timer
end

describe("the Game clock", function()
  it("fires nothing until the test advances it", function()
    local game = startGame()
    local log = {}
    logging(log, "one", 1)
    expect(log).toEqual({})
    game.advanceTime(0.5)
    expect(log).toEqual({})
    game.advanceTime(0.5)
    expect(log).toEqual({ "one" })
    game.advanceTime(10)
    expect(log).toEqual({ "one" })
  end)

  it("runs the expiries in the order of their instants, ties in the order of TimerStart", function()
    local game = startGame()
    local log = {}
    logging(log, "a at 2", 2)
    logging(log, "b at 1", 1)
    logging(log, "c at 2", 2)
    logging(log, "d at 1", 1)
    game.advanceTime(2)
    expect(log).toEqual({ "b at 1", "d at 1", "a at 2", "c at 2" })
  end)

  it("stands at each instant inside its handler, and ends at its start plus the seconds", function()
    local game = startGame()
    local log = {}
    TimerStart(CreateTimer(), 3, false, function()
      -- Started at 3: these expire at 5 and at 5.5.
      logging(log, "at 5", 2)
      logging(log, "at 5.5", 2.5)
    end)
    game.advanceTime(5)
    expect(log).toEqual({ "at 5" })
    -- The advance ended at 5, not at its last expiry: a timer started now
    -- expires at 5.25, before the one of 5.5.
    logging(log, "at 5.25", 0.25)
    game.advanceTime(0.5)
    expect(log).toEqual({ "at 5", "at 5.25", "at 5.5" })
  end)

  it("fires a periodic timer once per period, without drift", function()
    local game = startGame()
    local log = {}
    logging(log, "tick", 0.1, true)
    game.advanceTime(120)
    expect(#log).toEqual(1200)
    game.advanceTime(0.1)
    game.advanceTime(0.1)
    game.advanceTime(0.1)
    expect(#log).toEqual(1203)
  end)

  it("fires a timer started in a handler in the same advance when it expires inside the window", function()
    local game = startGame()
    local log = {}
    local chain = CreateTimer()
    local links = 0
    local function link()
      links = links + 1
      log[#log + 1] = "link " .. links
      if links < 4 then
        TimerStart(chain, 1, false, link)
      end
    end
    TimerStart(chain, 1, false, link)
    game.advanceTime(3)
    expect(log).toEqual({ "link 1", "link 2", "link 3" })
    game.advanceTime(1)
    expect(log).toEqual({ "link 1", "link 2", "link 3", "link 4" })
  end)

  it("answers GetExpiredTimer with the expired timer inside the handler and nil after", function()
    local game = startGame()
    local timer = CreateTimer()
    local seen
    TimerStart(timer, 1, false, function() seen = GetExpiredTimer() end)
    game.advanceTime(1)
    expect(seen).toBe(timer)
    expect(GetExpiredTimer()).toBeUndefined()
  end)

  it("refuses a negative advance and what is not a number", function()
    local game = startGame()
    expect(function() game.advanceTime(-1) end).toThrow(
      "game.advanceTime: expected a number of seconds, 0 or more, and got -1")
    expect(function() game.advanceTime("soon") end).toThrow(
      "game.advanceTime: expected a number of seconds, 0 or more, and got soon")
    expect(function() game.advanceTime() end).toThrow(
      "game.advanceTime: expected a number of seconds, 0 or more, and got nil")
    expect(function() game.advanceTime(math.huge) end).toThrow(
      "game.advanceTime: expected a number of seconds, 0 or more, and got inf")
  end)

  it("refuses an advance inside a handler", function()
    local game = startGame()
    TimerStart(CreateTimer(), 1, false, function() game.advanceTime(1) end)
    expect(function() game.advanceTime(1) end).toThrow(
      "a handler cannot move the Game clock")
  end)

  it("gives the game no runAllTimers and no advanceToNextTimer", function()
    local game = startGame()
    expect(game.runAllTimers).toBeUndefined()
    expect(game.advanceToNextTimer).toBeUndefined()
  end)

  it("leaves os.clock where the test set it", function()
    local game = startGame()
    expect(os.clock()).toEqual(0.0)
    game.advanceTime(30)
    expect(os.clock()).toEqual(0.0)
    local log = {}
    logging(log, "one", 1)
    __stub_set_clock(50)
    expect(os.clock()).toEqual(50)
    expect(log).toEqual({})
  end)
end)

-- docs/research/timer-answers.md, "A timer of timeout 0": a one-shot timer
-- of timeout 0 never fires inside TimerStart and fires with the clock of the
-- game where it was; a periodic one fires as one of timeout 0.0001 does,
-- and TimerGetTimeout still answers 0.
describe("a timeout of 0", function()
  it("fires a one-shot timer on the next advance, advanceTime(0) included, never inside TimerStart", function()
    local game = startGame()
    local log = {}
    logging(log, "zero", 0)
    log[#log + 1] = "after TimerStart"
    expect(log).toEqual({ "after TimerStart" })
    game.advanceTime(0)
    expect(log).toEqual({ "after TimerStart", "zero" })
    game.advanceTime(0)
    game.advanceTime(1)
    expect(log).toEqual({ "after TimerStart", "zero" })
  end)

  it("fires nothing at the end of a Game action", function()
    local game = startGame()
    local log = {}
    local footman = CreateUnit(Player(0), FourCC("hfoo"), 0, 0, 0)
    local trigger = CreateTrigger()
    TriggerRegisterUnitEvent(trigger, footman, EVENT_UNIT_DEATH)
    TriggerAddAction(trigger, function() logging(log, "deferred", 0) end)
    game.kill(footman)
    expect(log).toEqual({})
    game.advanceTime(0)
    expect(log).toEqual({ "deferred" })
  end)

  it("fires nothing at the end of game.fire", function()
    local game = startGame()
    local log = {}
    local trigger = CreateTrigger()
    TriggerRegisterPlayerEvent(trigger, Player(0), EVENT_PLAYER_END_CINEMATIC)
    TriggerAddAction(trigger, function() logging(log, "deferred", 0) end)
    game.fire(EVENT_PLAYER_END_CINEMATIC, { GetTriggerPlayer = Player(0) })
    expect(log).toEqual({})
    game.advanceTime(0)
    expect(log).toEqual({ "deferred" })
  end)

  it("fires a one-shot timer started in a handler in the same advance, at the same instant", function()
    local game = startGame()
    local log = {}
    TimerStart(CreateTimer(), 1, false, function()
      log[#log + 1] = "first"
      logging(log, "deferred", 0)
    end)
    logging(log, "second", 1)
    logging(log, "later", 1.5)
    game.advanceTime(2)
    expect(log).toEqual({ "first", "second", "deferred", "later" })
  end)

  it("fires a periodic timer every 0.0001 s, its timeout still read as 0", function()
    local game = startGame()
    local log = {}
    local timer = logging(log, "tick", 0, true)
    expect(TimerGetTimeout(timer)).toEqual(0)
    game.advanceTime(0)
    expect(#log).toEqual(0)
    game.advanceTime(0.001)
    expect(#log).toEqual(10)
    game.advanceTime(1)
    expect(#log).toEqual(10010)
  end)

  it("names a handler that starts a timer of timeout 0 every time it runs", function()
    local game = startGame()
    local timer = CreateTimer()
    local function again()
      TimerStart(timer, 0, false, again)
    end
    again()
    expect(function() game.advanceTime(1) end).toThrow(
      "more than 100000 expiries at one instant")
  end)
end)

describe("an error in a handler", function()
  it("leaves the advance, the clock stopped at that instant", function()
    local game = startGame()
    local log = {}
    TimerStart(CreateTimer(), 1, false, function() error("the handler broke", 0) end)
    logging(log, "at 2", 2)
    expect(function() game.advanceTime(5) end).toThrow("the handler broke")
    expect(log).toEqual({})
    -- The clock stands at 1: a timer started now expires at 2.5.
    logging(log, "at 2.5", 1.5)
    game.advanceTime(1)
    expect(log).toEqual({ "at 2" })
    game.advanceTime(0.5)
    expect(log).toEqual({ "at 2", "at 2.5" })
  end)

  it("keeps a periodic timer armed for the next advance", function()
    local game = startGame()
    local fires = 0
    TimerStart(CreateTimer(), 1, true, function()
      fires = fires + 1
      if fires == 1 then error("the first tick broke", 0) end
    end)
    expect(function() game.advanceTime(3) end).toThrow("the first tick broke")
    game.advanceTime(2)
    expect(fires).toEqual(3)
  end)
end)

describe("an error no test catches", function()
  it("fails the test", function()
    local game = startGame()
    TimerStart(CreateTimer(), 1, false, function() error("the countdown broke", 0) end)
    game.advanceTime(1)
  end)
end)

describe("a cancelled expiry", function()
  it("is dropped by DestroyTimer", function()
    local game = startGame()
    local log = {}
    DestroyTimer(logging(log, "destroyed", 1))
    local periodic = logging(log, "tick", 1, true)
    game.advanceTime(2)
    DestroyTimer(periodic)
    game.advanceTime(5)
    expect(log).toEqual({ "tick", "tick" })
  end)

  it("is dropped by a new TimerStart, which counts from its own instant", function()
    local game = startGame()
    local log = {}
    local timer = logging(log, "first", 2)
    game.advanceTime(1)
    TimerStart(timer, 3, false, function() log[#log + 1] = "second" end)
    game.advanceTime(2)
    expect(log).toEqual({})
    game.advanceTime(1)
    expect(log).toEqual({ "second" })
  end)

  it("skips a paused timer silently", function()
    local game = startGame()
    local log = {}
    PauseTimer(logging(log, "paused", 1))
    PauseTimer(logging(log, "paused tick", 1, true))
    logging(log, "running", 1)
    game.advanceTime(10)
    expect(log).toEqual({ "running" })
  end)

  it("skips a timer a handler of the same instant destroys or pauses", function()
    local game = startGame()
    local log = {}
    local destroyed, paused
    TimerStart(CreateTimer(), 1, false, function()
      DestroyTimer(destroyed)
      PauseTimer(paused)
    end)
    destroyed = logging(log, "destroyed", 1)
    paused = logging(log, "paused", 1)
    game.advanceTime(1)
    expect(log).toEqual({})
  end)

  it("lets a periodic timer destroy or restart itself in its handler", function()
    local game = startGame()
    local log = {}
    local once = CreateTimer()
    TimerStart(once, 1, true, function()
      log[#log + 1] = "once"
      DestroyTimer(once)
    end)
    local slower = CreateTimer()
    TimerStart(slower, 1, true, function()
      log[#log + 1] = "fast"
      TimerStart(slower, 4, false, function() log[#log + 1] = "slow" end)
    end)
    game.advanceTime(10)
    expect(log).toEqual({ "once", "fast", "slow" })
  end)
end)

-- docs/research/timer-event.md: a Trigger of TriggerRegisterTimerEvent
-- reads EVENT_GAME_TIMER_EXPIRED and no expired timer, fires its condition
-- before its action, is skipped while disabled or destroyed, and takes its
-- turn among the timers of its instant in the order they were started.
describe("the Triggers of TriggerRegisterTimerEvent", function()
  -- A trigger that appends `name .. " condition"` and `name .. " action"`
  -- to `log` when it runs.
  local function logged(log, name)
    local trigger = CreateTrigger()
    TriggerAddCondition(trigger, Condition(function()
      log[#log + 1] = name .. " condition"
      return true
    end))
    TriggerAddAction(trigger, function()
      log[#log + 1] = name .. " action"
    end)
    return trigger
  end

  it("fire through the Event dispatch, once or once per period", function()
    local game = startGame()
    local log = {}
    TriggerRegisterTimerEvent(logged(log, "once"), 1, false)
    TriggerRegisterTimerEvent(logged(log, "every"), 2, true)
    expect(log).toEqual({})
    game.advanceTime(4)
    expect(log).toEqual({
      "once condition", "once action",
      "every condition", "every action",
      "every condition", "every action",
    })
  end)

  -- The case "TriggerRegisterTimerEvent, one timeout" of
  -- docs/research/trigger-registered-twice.md: a Trigger registered twice
  -- with one timeout runs twice at that instant, each run in the turn of
  -- its registration.
  it("fire a Trigger registered twice with one timeout twice at that instant", function()
    local game = startGame()
    local log = {}
    local twice = logged(log, "twice")
    TriggerRegisterTimerEvent(twice, 1, false)
    TriggerRegisterTimerEvent(logged(log, "between"), 1, false)
    TriggerRegisterTimerEvent(twice, 1, false)
    game.advanceTime(1)
    expect(log).toEqual({
      "twice condition", "twice action",
      "between condition", "between action",
      "twice condition", "twice action",
    })
  end)

  it("take their turn among the timers, in the order of their instants", function()
    local game = startGame()
    local log = {}
    logging(log, "timer at 2", 2)
    TriggerRegisterTimerEvent(logged(log, "event at 1"), 1, false)
    TriggerRegisterTimerEvent(logged(log, "event at 2"), 2, false)
    logging(log, "timer at 1", 1)
    game.advanceTime(2)
    expect(log).toEqual({
      "event at 1 condition", "event at 1 action",
      "timer at 1",
      "timer at 2",
      "event at 2 condition", "event at 2 action",
    })
  end)

  it("skip a disabled or destroyed Trigger silently, and fire again once enabled", function()
    local game = startGame()
    local log = {}
    local disabled = logged(log, "disabled")
    TriggerRegisterTimerEvent(disabled, 1, true)
    DisableTrigger(disabled)
    local destroyed = logged(log, "destroyed")
    TriggerRegisterTimerEvent(destroyed, 1, true)
    DestroyTrigger(destroyed)
    game.advanceTime(2)
    expect(log).toEqual({})
    EnableTrigger(disabled)
    game.advanceTime(1)
    expect(log).toEqual({ "disabled condition", "disabled action" })
  end)

  it("answer GetTriggeringTrigger and the timer event, and each registration fires its own Trigger only", function()
    local game = startGame()
    local seen = {}
    local first, second = CreateTrigger(), CreateTrigger()
    local eventId, expired
    TriggerAddAction(first, function()
      seen[#seen + 1] = GetTriggeringTrigger()
      eventId, expired = GetTriggerEventId(), GetExpiredTimer()
    end)
    TriggerAddAction(second, function() seen[#seen + 1] = GetTriggeringTrigger() end)
    TriggerRegisterTimerEvent(first, 1, false)
    TriggerRegisterTimerEvent(second, 2, false)
    game.advanceTime(2)
    expect(#seen).toEqual(2)
    expect(seen[1]).toBe(first)
    expect(seen[2]).toBe(second)
    expect(eventId).toBe(EVENT_GAME_TIMER_EXPIRED)
    expect(expired).toBeUndefined()
  end)

  it("are not reached by an event the test fires", function()
    local game = startGame()
    local log = {}
    TriggerRegisterTimerEvent(logged(log, "timed"), 1, false)
    game.fire(EVENT_GAME_TIMER_EXPIRED, {})
    expect(log).toEqual({})
  end)

  it("record the registration as before, and no timer", function()
    startGame()
    local trigger = CreateTrigger()
    TriggerRegisterTimerEvent(trigger, 1.5, true)
    expect(map.calls(TriggerRegisterTimerEvent)).toEqual({ { trigger, 1.5, true } })
    expect(map.calls(TimerStart)).toEqual({})
    expect(map.calls(CreateTimer)).toEqual({})
  end)
end)

describe("__stub_fire_timer", function()
  it("still runs the handler once, moves no clock and arms nothing again", function()
    local game = startGame()
    local log = {}
    local timer = logging(log, "one-shot", 5)
    __stub_fire_timer(timer)
    expect(log).toEqual({ "one-shot" })
    -- No clock moved and the expiry is still pending, at 5.
    game.advanceTime(4.5)
    expect(log).toEqual({ "one-shot" })
    game.advanceTime(0.5)
    expect(log).toEqual({ "one-shot", "one-shot" })
    -- An expired one-shot timer fired by hand stays expired.
    __stub_fire_timer(timer)
    game.advanceTime(100)
    expect(log).toEqual({ "one-shot", "one-shot", "one-shot" })
  end)
end)
