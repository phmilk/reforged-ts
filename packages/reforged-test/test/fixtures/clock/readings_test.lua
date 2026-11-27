-- Hand-written stand-in for a compiled readings.test.ts on reforged-test/map:
-- what a timer reads and what ResumeTimer does under the Game clock, each
-- case one the Probes measured in the game. The findings:
-- docs/research/timer-answers.md, docs/research/timer-resume-cases.md,
-- docs/research/timer-resume.md and docs/research/timer-expire-event.md.
local map = require("lua_modules.reforged-test.map.index")
local it, describe, expect, startGame = map.it, map.describe, map.expect, map.startGame

-- Rounds to the millionth: what adding the advances up loses in a float is
-- no part of a reading.
local function round(value)
  local rounded = math.floor(value * 1000000 + 0.5) / 1000000
  if rounded == 0 then
    return 0.0
  end
  return rounded
end

-- What the timer reads: { elapsed, remaining, timeout }.
local function read(timer)
  return {
    round(TimerGetElapsed(timer)),
    round(TimerGetRemaining(timer)),
    round(TimerGetTimeout(timer)),
  }
end

-- The Test game of the test, started on the first call, with a way to tell
-- the time since this call, as the Probes do: the elapsed time of a
-- reference timer started now. Returns the game and `now`. A test of several
-- cases calls it once per case, since one test is one game.
local started

local function clockedGame()
  started = started or startGame()
  local game = started
  local reference = CreateTimer()
  TimerStart(reference, 1000, false, function() end)
  return game, function()
    return round(TimerGetElapsed(reference))
  end
end

-- Starts a new timer whose handler appends the instant to the list it
-- returns second, then calls `inHandler(timer, fire)` if given, `fire` being
-- how many times the handler ran.
local function watched(now, timeout, periodic, inHandler)
  local timer = CreateTimer()
  local fires = {}
  TimerStart(timer, timeout, periodic, function()
    fires[#fires + 1] = now()
    if inHandler ~= nil then
      inHandler(timer, #fires)
    end
  end)
  return timer, fires
end

-- A timer of timeout 2, paused at 0.5 and resumed at 1, the control of the
-- Probes: alone, it fires at 2.5 and at 4.5. The clock is left at 1.
local function resumed(game, now, periodic, inHandler)
  local timer, fires = watched(now, 2, periodic, inHandler)
  game.advanceTime(0.5)
  PauseTimer(timer)
  game.advanceTime(0.5)
  ResumeTimer(timer)
  return timer, fires
end

-- A trigger of the timer's expire event that appends `name` to `log`.
local function expireEvent(log, name, timer)
  local trigger = CreateTrigger()
  TriggerRegisterTimerExpireEvent(trigger, timer)
  TriggerAddAction(trigger, function() log[#log + 1] = name end)
  return trigger
end

-- docs/research/timer-answers.md, the table of the TL;DR, "A paused timer"
-- and "A one-shot timer that expired".
describe("the readings of a timer", function()
  it("reads 0, 0 and a timeout of 0 on a timer never started", function()
    startGame()
    expect(read(CreateTimer())).toEqual({ 0, 0, 0 })
  end)

  it("reads a running timer by the time since TimerStart", function()
    local game = startGame()
    local timer = CreateTimer()
    TimerStart(timer, 4, false, function() end)
    expect(read(timer)).toEqual({ 0, 4, 4 })
    game.advanceTime(1.5)
    expect(read(timer)).toEqual({ 1.5, 2.5, 4 })
  end)

  it("freezes a paused timer at the pause, and never fires it", function()
    local game, now = clockedGame()
    local timer, fires = watched(now, 4, false)
    game.advanceTime(1.5)
    PauseTimer(timer)
    expect(read(timer)).toEqual({ 1.5, 2.5, 4 })
    game.advanceTime(1)
    expect(read(timer)).toEqual({ 1.5, 2.5, 4 })
    game.advanceTime(5.5)
    expect(read(timer)).toEqual({ 1.5, 2.5, 4 })
    expect(fires).toEqual({})
  end)

  it("reads the timeout and 0 on a one-shot timer, in its handler and ever after", function()
    local game = startGame()
    local timer = CreateTimer()
    local inHandler
    TimerStart(timer, 1, false, function() inHandler = read(timer) end)
    game.advanceTime(1)
    expect(inHandler).toEqual({ 1, 0, 1 })
    expect(read(timer)).toEqual({ 1, 0, 1 })
    game.advanceTime(3)
    expect(read(timer)).toEqual({ 1, 0, 1 })
  end)

  it("reads the timeout and 0 in a periodic timer's handler, and counts again after it", function()
    local game = startGame()
    local timer = CreateTimer()
    local inHandler = {}
    TimerStart(timer, 1, true, function() inHandler[#inHandler + 1] = read(timer) end)
    game.advanceTime(1)
    expect(inHandler).toEqual({ { 1, 0, 1 } })
    expect(read(timer)).toEqual({ 0, 1, 1 })
    game.advanceTime(0.5)
    expect(read(timer)).toEqual({ 0.5, 0.5, 1 })
    game.advanceTime(1)
    expect(inHandler).toEqual({ { 1, 0, 1 }, { 1, 0, 1 } })
    expect(read(timer)).toEqual({ 0.5, 0.5, 1 })
  end)

  -- "A timer of timeout 0": 0.0001 s is left right after TimerStart, while
  -- TimerGetTimeout answers 0; the handler reads 0, 0 and 0.
  it("reads 0.0001 left on a timer of timeout 0 right after its start, and 0 in its handler", function()
    local game = startGame()
    local timer = CreateTimer()
    local inHandler
    TimerStart(timer, 0, false, function() inHandler = read(timer) end)
    expect(read(timer)).toEqual({ 0, 0.0001, 0 })
    game.advanceTime(0)
    expect(inHandler).toEqual({ 0, 0, 0 })
    local periodic = CreateTimer()
    local ticks = {}
    TimerStart(periodic, 0, true, function() ticks[#ticks + 1] = read(periodic) end)
    expect(read(periodic)).toEqual({ 0, 0.0001, 0 })
    game.advanceTime(0.0001)
    expect(ticks).toEqual({ { 0, 0, 0 } })
  end)

  -- docs/research/timer-resume-cases.md, "The doubled calls" and "A timer
  -- never started": a PauseTimer on a timer that is not running writes
  -- nothing.
  it("changes no reading with PauseTimer on a timer that is not running", function()
    local game = startGame()
    local never = CreateTimer()
    PauseTimer(never)
    expect(read(never)).toEqual({ 0, 0, 0 })
    local expired = CreateTimer()
    TimerStart(expired, 1, false, function() end)
    game.advanceTime(1.5)
    PauseTimer(expired)
    expect(read(expired)).toEqual({ 1, 0, 1 })
    local paused = CreateTimer()
    TimerStart(paused, 2, false, function() end)
    game.advanceTime(0.5)
    PauseTimer(paused)
    game.advanceTime(1)
    PauseTimer(paused)
    expect(read(paused)).toEqual({ 0.5, 1.5, 2 })
  end)

  -- docs/research/timer-resume-cases.md, "TimerStart on a timer that was
  -- resumed", and docs/research/timer-resume.md: the remaining a pause
  -- stored survives a TimerStart. A one-shot timer started so reads it once
  -- it expired, with an elapsed of the new timeout minus it; a periodic one
  -- reads as any periodic timer.
  it("keeps the remaining of a pause across TimerStart, read once the timer is not running", function()
    local game = startGame()
    local oneShot = CreateTimer()
    TimerStart(oneShot, 2, false, function() end)
    game.advanceTime(0.5)
    PauseTimer(oneShot)
    local inHandler
    TimerStart(oneShot, 0.75, false, function() inHandler = read(oneShot) end)
    expect(read(oneShot)).toEqual({ 0, 0.75, 0.75 })
    game.advanceTime(0.25)
    expect(read(oneShot)).toEqual({ 0.25, 0.5, 0.75 })
    game.advanceTime(0.5)
    expect(inHandler).toEqual({ -0.75, 1.5, 0.75 })
    game.advanceTime(5)
    expect(read(oneShot)).toEqual({ -0.75, 1.5, 0.75 })

    local periodic = CreateTimer()
    TimerStart(periodic, 2, false, function() end)
    game.advanceTime(0.5)
    PauseTimer(periodic)
    TimerStart(periodic, 0.75, true, function() inHandler = read(periodic) end)
    game.advanceTime(0.75)
    expect(inHandler).toEqual({ 0.75, 0, 0.75 })
    game.advanceTime(0.25)
    expect(read(periodic)).toEqual({ 0.25, 0.5, 0.75 })
  end)

  -- No finding of the game: __stub_fire_timer moves no clock, so its
  -- handler reads the timer as the handler of an expiry would, and the
  -- countdown is where it was once it returns.
  it("reads a timer in a handler __stub_fire_timer runs as in the handler of an expiry", function()
    local game = startGame()
    local inHandler = {}
    local oneShot = CreateTimer()
    TimerStart(oneShot, 2, false, function() inHandler[#inHandler + 1] = read(oneShot) end)
    local periodic = CreateTimer()
    TimerStart(periodic, 2, true, function() inHandler[#inHandler + 1] = read(periodic) end)
    game.advanceTime(0.5)
    __stub_fire_timer(oneShot)
    __stub_fire_timer(periodic)
    expect(inHandler).toEqual({ { 2, 0, 2 }, { 2, 0, 2 } })
    expect(read(oneShot)).toEqual({ 0.5, 1.5, 2 })
    expect(read(periodic)).toEqual({ 0.5, 1.5, 2 })
  end)
end)

-- docs/research/timer-answers.md, "What ResumeTimer leaves behind", and
-- docs/research/timer-resume-cases.md: a resumed timer fires when what was
-- left runs out, once more a full timeout later, then stops.
describe("ResumeTimer", function()
  it("fires when what was left runs out, a full timeout later, then stops, one-shot or periodic alike", function()
    for _, periodic in ipairs({ false, true }) do
      local game, now = clockedGame()
      local _, fires = resumed(game, now, periodic)
      game.advanceTime(11)
      expect(fires).toEqual({ 2.5, 4.5 })
    end
  end)

  -- "The control": the elapsed time counts from the resume, the handlers
  -- read the values of the pause, and so does the timer once it stopped.
  it("reads what was left, then a full timeout, and the values of the pause in its handlers and after", function()
    local game, now = clockedGame()
    local inHandlers = {}
    local timer = resumed(game, now, false, function(timer)
      inHandlers[#inHandlers + 1] = read(timer)
    end)
    expect(read(timer)).toEqual({ 0, 1.5, 2 })
    game.advanceTime(0.25)
    expect(read(timer)).toEqual({ 0.25, 1.25, 2 })
    game.advanceTime(1.5)
    expect(inHandlers).toEqual({ { 0.5, 1.5, 2 } })
    expect(read(timer)).toEqual({ 0.25, 1.75, 2 })
    game.advanceTime(1.5)
    expect(read(timer)).toEqual({ 1.75, 0.25, 2 })
    game.advanceTime(0.5)
    expect(inHandlers).toEqual({ { 0.5, 1.5, 2 }, { 0.5, 1.5, 2 } })
    expect(read(timer)).toEqual({ 0.5, 1.5, 2 })
    game.advanceTime(7)
    expect(read(timer)).toEqual({ 0.5, 1.5, 2 })
  end)

  it("fires the timer's expire event at both fires, each time before the handler", function()
    local game, now = clockedGame()
    local log = {}
    local timer = CreateTimer()
    expireEvent(log, "event", timer)
    TimerStart(timer, 2, false, function() log[#log + 1] = "handler at " .. now() end)
    game.advanceTime(0.5)
    PauseTimer(timer)
    game.advanceTime(0.5)
    ResumeTimer(timer)
    game.advanceTime(11)
    expect(log).toEqual({ "event", "handler at 2.5", "event", "handler at 4.5" })
  end)

  -- timer-answers.md: a one-shot timer of 4, never paused, ResumeTimer at
  -- 1.25, fires at 4. timer-resume-cases.md, "The doubled calls": ResumeTimer
  -- again at 1.5, in the first countdown, changes no reading and no fire.
  it("does nothing on a running timer, resumed or not", function()
    local game, now = clockedGame()
    local running, runningFires = watched(now, 4, false)
    game.advanceTime(1.25)
    ResumeTimer(running)
    expect(read(running)).toEqual({ 1.25, 2.75, 4 })
    game.advanceTime(10)
    expect(runningFires).toEqual({ 4 })

    game, now = clockedGame()
    local counting, countingFires = resumed(game, now, false)
    game.advanceTime(0.5)
    expect(read(counting)).toEqual({ 0.5, 1, 2 })
    ResumeTimer(counting)
    expect(read(counting)).toEqual({ 0.5, 1, 2 })
    game.advanceTime(10)
    expect(countingFires).toEqual({ 2.5, 4.5 })
  end)

  it("is one resume when called twice in a row on a paused timer", function()
    local game, now = clockedGame()
    local timer, fires = watched(now, 2, true)
    game.advanceTime(0.5)
    PauseTimer(timer)
    game.advanceTime(0.5)
    ResumeTimer(timer)
    ResumeTimer(timer)
    game.advanceTime(11)
    expect(fires).toEqual({ 2.5, 4.5 })
  end)

  -- "The doubled calls": an expired one-shot timer of timeout 1, resumed at
  -- 2, reads 0 and 0.0001 after the call, the fire still to come; in the
  -- game it fires 0.0001 s later and at 3. A PauseTimer before the resume
  -- changes nothing.
  it("fires an expired one-shot timer on the next advance, never inside the call, then a timeout later", function()
    for _, pauseFirst in ipairs({ false, true }) do
      local game, now = clockedGame()
      local timer, fires = watched(now, 1, false)
      game.advanceTime(2)
      expect(fires).toEqual({ 1 })
      if pauseFirst then
        PauseTimer(timer)
      end
      ResumeTimer(timer)
      expect(fires).toEqual({ 1 })
      expect(read(timer)).toEqual({ 0, 0.0001, 1 })
      game.advanceTime(0)
      expect(fires).toEqual({ 1, 2 })
      game.advanceTime(10)
      expect(fires).toEqual({ 1, 2, 3 })
      expect(read(timer)).toEqual({ 1, 0, 1 })
    end
  end)

  -- "The doubled calls": an expired one-shot timer of timeout 0, resumed,
  -- fires twice and never again, 0.0001 s and 0.0002 s later in the game.
  -- Here a countdown of 0 ends on the next advance, as a one-shot timer of
  -- timeout 0 does.
  it("fires an expired timer of timeout 0 twice on the next advance", function()
    local game, now = clockedGame()
    local timer, fires = watched(now, 0, false)
    game.advanceTime(2)
    expect(fires).toEqual({ 0 })
    ResumeTimer(timer)
    expect(fires).toEqual({ 0 })
    game.advanceTime(0)
    expect(fires).toEqual({ 0, 2, 2 })
    game.advanceTime(5)
    expect(fires).toEqual({ 0, 2, 2 })
  end)

  -- "A second pause and resume", in the first countdown: PauseTimer at 1.5,
  -- ResumeTimer at 2.
  it("counts what was left at a second pause in the first countdown: two fires in all", function()
    for _, periodic in ipairs({ false, true }) do
      local game, now = clockedGame()
      local timer, fires = resumed(game, now, periodic)
      game.advanceTime(0.5)
      expect(read(timer)).toEqual({ 0.5, 1, 2 })
      PauseTimer(timer)
      expect(read(timer)).toEqual({ 1, 1, 2 })
      game.advanceTime(0.5)
      ResumeTimer(timer)
      expect(read(timer)).toEqual({ 0, 1, 2 })
      game.advanceTime(10)
      expect(fires).toEqual({ 3, 5 })
      expect(read(timer)).toEqual({ 1, 1, 2 })
    end
  end)

  -- "A second pause and resume", in the second countdown: PauseTimer at
  -- 3.1, ResumeTimer at 3.6.
  it("counts what was left of the second countdown at a pause in it: three fires in all", function()
    for _, periodic in ipairs({ false, true }) do
      local game, now = clockedGame()
      local timer, fires = resumed(game, now, periodic)
      game.advanceTime(2.1)
      expect(fires).toEqual({ 2.5 })
      expect(read(timer)).toEqual({ 0.6, 1.4, 2 })
      PauseTimer(timer)
      expect(read(timer)).toEqual({ 0.6, 1.4, 2 })
      game.advanceTime(0.5)
      ResumeTimer(timer)
      expect(read(timer)).toEqual({ 0, 1.4, 2 })
      game.advanceTime(10)
      expect(fires).toEqual({ 2.5, 5, 7 })
      expect(read(timer)).toEqual({ 0.6, 1.4, 2 })
    end
  end)

  -- "The doubled calls": ResumeTimer again at 5.5, after the timer stopped,
  -- fires at 7 and at 9.
  it("starts the rule over on a resumed timer that stopped, with the remaining of the same pause", function()
    local game, now = clockedGame()
    local timer, fires = resumed(game, now, false)
    game.advanceTime(4.5)
    expect(fires).toEqual({ 2.5, 4.5 })
    ResumeTimer(timer)
    expect(read(timer)).toEqual({ 0, 1.5, 2 })
    game.advanceTime(10)
    expect(fires).toEqual({ 2.5, 4.5, 7, 9 })
  end)

  -- "TimerStart on a timer that was resumed": TimerStart(timer, 0.75, …)
  -- with a new handler and the other flag, at 1.5, at 3 and at 5.5. The
  -- clock is read at 12.25.
  it("is dropped by TimerStart, an ordinary start: in the first countdown, in the second and after the stop", function()
    local every = { 2.25, 3, 3.75, 4.5, 5.25, 6, 6.75, 7.5, 8.25, 9, 9.75, 10.5, 11.25, 12 }
    local cases = {
      { at = 1.5, first = {}, periodic = every, oneShot = { 2.25 } },
      { at = 3, first = { 2.5 }, periodic = { table.unpack(every, 3) }, oneShot = { 3.75 } },
      { at = 5.5, first = { 2.5, 4.5 },
        periodic = { 6.25, 7, 7.75, 8.5, 9.25, 10, 10.75, 11.5, 12.25 }, oneShot = { 6.25 } },
    }
    for _, case in ipairs(cases) do
      for _, periodic in ipairs({ true, false }) do
        local game, now = clockedGame()
        local timer, first = resumed(game, now, not periodic)
        game.advanceTime(case.at - 1)
        local second = {}
        TimerStart(timer, 0.75, periodic, function() second[#second + 1] = now() end)
        expect(read(timer)).toEqual({ 0, 0.75, 0.75 })
        game.advanceTime(12.25 - case.at)
        expect(first).toEqual(case.first)
        expect(second).toEqual(periodic and case.periodic or case.oneShot)
      end
    end
  end)

  -- "TimerStart on a timer that was resumed", its last table: the timer
  -- started again one-shot at 5.5, which fired at 6.25, then ResumeTimer at
  -- 7, counts the 1.5 of the pause at 0.5, then the new timeout, 0.75.
  it("counts the remaining of an old pause on a timer that expired after a TimerStart", function()
    local game, now = clockedGame()
    local timer = resumed(game, now, false)
    game.advanceTime(4.5)
    local fires = {}
    TimerStart(timer, 0.75, false, function() fires[#fires + 1] = now() end)
    game.advanceTime(1.5)
    expect(fires).toEqual({ 6.25 })
    expect(read(timer)).toEqual({ -0.75, 1.5, 0.75 })
    ResumeTimer(timer)
    expect(read(timer)).toEqual({ 0, 1.5, 0.75 })
    game.advanceTime(5)
    expect(fires).toEqual({ 6.25, 8.5, 9.25 })
    expect(read(timer)).toEqual({ -0.75, 1.5, 0.75 })
  end)

  -- "A timer never started": one expire event, 0.0001 s later in the game
  -- and never inside the call, no second one, and 0, 0 and 0 read before
  -- and after. A PauseTimer first changes nothing. A TimerStart afterwards
  -- is an ordinary start.
  it("fires the expire-event Triggers of a timer never started once, on the next advance", function()
    for _, pauseFirst in ipairs({ false, true }) do
      local game = clockedGame()
      local log = {}
      local timer = CreateTimer()
      expireEvent(log, "event", timer)
      if pauseFirst then
        PauseTimer(timer)
      end
      ResumeTimer(timer)
      expect(log).toEqual({})
      expect(read(timer)).toEqual({ 0, 0.0001, 0 })
      game.advanceTime(0)
      expect(log).toEqual({ "event" })
      expect(read(timer)).toEqual({ 0, 0, 0 })
      game.advanceTime(2)
      expect(log).toEqual({ "event" })
      TimerStart(timer, 1, false, function() log[#log + 1] = "handler" end)
      expect(read(timer)).toEqual({ 0, 1, 1 })
      game.advanceTime(5)
      expect(log).toEqual({ "event", "event", "handler" })
      expect(read(timer)).toEqual({ 1, 0, 1 })
    end
  end)

  it("does nothing on a destroyed timer", function()
    local game, now = clockedGame()
    local timer, fires = watched(now, 2, false)
    game.advanceTime(0.5)
    PauseTimer(timer)
    DestroyTimer(timer)
    ResumeTimer(timer)
    game.advanceTime(10)
    expect(fires).toEqual({})
  end)
end)

-- docs/research/timer-expire-event.md, "The expire event": a Trigger of
-- TriggerRegisterTimerExpireEvent fires at each expiry of its timer, before
-- the handler, reading EVENT_GAME_TIMER_EXPIRED and the timer as the
-- expired one.
describe("a timer's expire event", function()
  it("fires before the handler, with the timer as GetExpiredTimer's answer, one-shot or periodic", function()
    for _, periodic in ipairs({ false, true }) do
      local game = clockedGame()
      local log = {}
      local timer = CreateTimer()
      local trigger = CreateTrigger()
      local seen = {}
      TriggerRegisterTimerExpireEvent(trigger, timer)
      TriggerAddCondition(trigger, Condition(function()
        log[#log + 1] = "condition"
        seen[#seen + 1] = { GetTriggerEventId(), GetTriggeringTrigger(), GetExpiredTimer(), read(timer) }
        return true
      end))
      TriggerAddAction(trigger, function()
        log[#log + 1] = "action"
        seen[#seen + 1] = { GetTriggerEventId(), GetTriggeringTrigger(), GetExpiredTimer(), read(timer) }
      end)
      TimerStart(timer, 1, periodic, function() log[#log + 1] = "handler" end)
      game.advanceTime(1)
      expect(log).toEqual({ "condition", "action", "handler" })
      for _, answers in ipairs(seen) do
        expect(answers[1]).toBe(EVENT_GAME_TIMER_EXPIRED)
        expect(answers[2]).toBe(trigger)
        expect(answers[3]).toBe(timer)
        expect(answers[4]).toEqual({ 1, 0, 1 })
      end
      expect(GetExpiredTimer()).toBeUndefined()
      game.advanceTime(2)
      expect(#log).toEqual(periodic and 9 or 3)
    end
  end)

  it("fires the Triggers of one timer in registration order, one registered twice twice", function()
    local game = startGame()
    local log = {}
    local timer = CreateTimer()
    expireEvent(log, "first", timer)
    local second = expireEvent(log, "second", timer)
    TriggerRegisterTimerExpireEvent(second, timer)
    TimerStart(timer, 1.5, false, function() log[#log + 1] = "handler" end)
    game.advanceTime(1.5)
    expect(log).toEqual({ "first", "second", "second", "handler" })
  end)

  it("skips a disabled or destroyed Trigger silently, and fires it again once enabled", function()
    local game = startGame()
    local log = {}
    local timer = CreateTimer()
    local disabled = expireEvent(log, "disabled until 2.25", timer)
    DisableTrigger(disabled)
    DestroyTrigger(expireEvent(log, "destroyed", timer))
    TimerStart(timer, 1, true, function() end)
    game.advanceTime(2.25)
    expect(log).toEqual({})
    EnableTrigger(disabled)
    expect(log).toEqual({})
    game.advanceTime(2)
    expect(log).toEqual({ "disabled until 2.25", "disabled until 2.25" })
  end)

  it("takes its timer's turn among the timers of one instant", function()
    local game = startGame()
    local log = {}
    local middle = CreateTimer()
    expireEvent(log, "event of timer 2", middle)
    TimerStart(CreateTimer(), 3, false, function() log[#log + 1] = "timer 1" end)
    TimerStart(middle, 3, false, function() log[#log + 1] = "timer 2" end)
    TimerStart(CreateTimer(), 3, false, function() log[#log + 1] = "timer 3" end)
    game.advanceTime(3)
    expect(log).toEqual({ "timer 1", "event of timer 2", "timer 2", "timer 3" })
  end)

  it("is not reached by an event the test fires, nor by a Trigger of TriggerRegisterTimerEvent", function()
    local game = startGame()
    local log = {}
    local timer = CreateTimer()
    expireEvent(log, "expire event", timer)
    TimerStart(timer, 5, false, function() end)
    local timed = CreateTrigger()
    TriggerRegisterTimerEvent(timed, 1, false)
    game.fire(EVENT_GAME_TIMER_EXPIRED, {})
    game.advanceTime(1)
    expect(log).toEqual({})
  end)

  it("is left alone by __stub_fire_timer, which runs the handler only", function()
    startGame()
    local log = {}
    local timer = CreateTimer()
    expireEvent(log, "event", timer)
    TimerStart(timer, 1, false, function() log[#log + 1] = "handler" end)
    __stub_fire_timer(timer)
    expect(log).toEqual({ "handler" })
  end)
end)

-- docs/research/timer-expire-event.md, "A call a handler makes on its own
-- timer".
describe("a call a handler makes on its own timer", function()
  -- In its first fire a resumed timer is not running, and its second
  -- countdown starts when the handler returns, whatever ResumeTimer or
  -- PauseTimer did in it: both leave the fires at 2.5 and 4.5.
  it("keeps the second countdown of a resumed timer after ResumeTimer or PauseTimer in its first fire", function()
    local game, now = clockedGame()
    local afterCall = {}
    local resumedInFire, resumedFires = resumed(game, now, false, function(timer, fire)
      if fire == 1 then
        ResumeTimer(timer)
        afterCall.resume = read(timer)
      end
    end)
    game.advanceTime(1.75)
    expect(afterCall.resume).toEqual({ 0, 1.5, 2 })
    expect(read(resumedInFire)).toEqual({ 0.25, 1.75, 2 })
    game.advanceTime(10)
    expect(resumedFires).toEqual({ 2.5, 4.5 })
    expect(read(resumedInFire)).toEqual({ 0.5, 1.5, 2 })

    game, now = clockedGame()
    local pausedInFire, pausedFires = resumed(game, now, false, function(timer, fire)
      if fire == 1 then
        PauseTimer(timer)
        afterCall.pause = read(timer)
      end
    end)
    game.advanceTime(1.75)
    expect(afterCall.pause).toEqual({ 0.5, 1.5, 2 })
    expect(read(pausedInFire)).toEqual({ 0.25, 1.75, 2 })
    game.advanceTime(10)
    expect(pausedFires).toEqual({ 2.5, 4.5 })
  end)

  it("starts the rule over with ResumeTimer in the second fire of a resumed timer, and nothing with PauseTimer", function()
    local game, now = clockedGame()
    local _, resumedFires = resumed(game, now, false, function(timer, fire)
      if fire == 2 then
        ResumeTimer(timer)
      end
    end)
    game.advanceTime(11)
    expect(resumedFires).toEqual({ 2.5, 4.5, 6, 8 })

    game, now = clockedGame()
    local paused, pausedFires = resumed(game, now, false, function(timer, fire)
      if fire == 2 then
        PauseTimer(timer)
      end
    end)
    game.advanceTime(11)
    expect(pausedFires).toEqual({ 2.5, 4.5 })
    expect(read(paused)).toEqual({ 0.5, 1.5, 2 })
  end)

  it("starts ordinarily with TimerStart in the first fire of a resumed timer: no second countdown", function()
    local game, now = clockedGame()
    local second = {}
    local afterCall
    local timer, first = resumed(game, now, false, function(timer)
      TimerStart(timer, 0.75, false, function() second[#second + 1] = now() end)
      afterCall = read(timer)
    end)
    game.advanceTime(11)
    expect(afterCall).toEqual({ 0, 0.75, 0.75 })
    expect(first).toEqual({ 2.5 })
    expect(second).toEqual({ 3.25 })
    expect(read(timer)).toEqual({ -0.75, 1.5, 0.75 })
  end)

  it("changes nothing with ResumeTimer in a periodic timer's handler", function()
    local game, now = clockedGame()
    local afterCall
    local _, fires = watched(now, 1, true, function(timer, fire)
      if fire == 1 then
        ResumeTimer(timer)
        afterCall = read(timer)
      end
    end)
    game.advanceTime(4.5)
    expect(afterCall).toEqual({ 1, 0, 1 })
    expect(fires).toEqual({ 1, 2, 3, 4 })
  end)

  -- In the game the second fire comes 0.0001 s after the first; here the
  -- countdown of 0 ends in the same advance, at the same instant.
  it("fires a one-shot timer again with ResumeTimer in its handler, then a timeout later, and stops", function()
    local game, now = clockedGame()
    local afterCall
    local timer, fires = watched(now, 1, false, function(timer, fire)
      if fire == 1 then
        ResumeTimer(timer)
        afterCall = read(timer)
      end
    end)
    game.advanceTime(1)
    expect(afterCall).toEqual({ 0, 0.0001, 1 })
    expect(fires).toEqual({ 1, 1 })
    game.advanceTime(10)
    expect(fires).toEqual({ 1, 1, 2 })
    expect(read(timer)).toEqual({ 1, 0, 1 })
  end)

  -- docs/research/timer-resume.md, "PauseTimer inside a periodic timer's
  -- handler stops it", reading the timeout and 0; resumed at 2.5, it fires
  -- 0.0001 s later in the game, at 3.5, and stops.
  it("stops a periodic timer paused in its handler, which a resume fires on the next advance", function()
    local game, now = clockedGame()
    local timer, fires = watched(now, 1, true, function(timer, fire)
      if fire == 1 then
        PauseTimer(timer)
      end
    end)
    game.advanceTime(2.5)
    expect(fires).toEqual({ 1 })
    expect(read(timer)).toEqual({ 1, 0, 1 })
    ResumeTimer(timer)
    expect(read(timer)).toEqual({ 0, 0.0001, 1 })
    game.advanceTime(10)
    expect(fires).toEqual({ 1, 2.5, 3.5 })
    expect(read(timer)).toEqual({ 1, 0, 1 })
  end)
end)
