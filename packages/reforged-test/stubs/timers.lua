-- reforged-test stubs for the timers family, and the Game clock under it. A
-- timer never expires on its own: TimerStart stores the timeout, the
-- periodic flag and the handler and arms an expiry on the Game clock, which
-- only a test moves, with __stub_advance_time. Under it a timer reads,
-- pauses and resumes as the Probes measured in the game. A test also runs
-- one handler by hand with __stub_fire_timer, which moves no clock.

-- The Game clock: the game time of the Lua state, in seconds. It starts at
-- 0 and only __stub_advance_time moves it. It is not os.clock, which
-- __stub_set_clock sets (base.lua).
local clock = 0.0

-- The armed expiries, in no order: each { at, order, expire } with, for a
-- periodic one, { from, period, count }. A cancelled one is dropped the next
-- time the advance looks for the next expiry.
local pending = {}

-- How many expiries were ever armed: the order of an expiry among those of
-- its instant.
local armed = 0

-- Whether an advance is running.
local advancing = false

-- The period the game runs a timeout of 0 at
-- (docs/research/timer-answers.md, "A timer of timeout 0").
local SHORTEST_PERIOD = 0.0001

-- Two instants closer than this are one instant: what adding timeouts up
-- loses in a float (0.1 three times is past 0.3) decides neither whether an
-- expiry is inside the window nor a tie.
local SAME_INSTANT = 1e-9

-- A handler that starts a timer of timeout 0 every time it runs never lets
-- an advance end: past this many expiries without the clock moving, the
-- advance is an error.
local MOST_EXPIRIES_AT_ONE_INSTANT = 100000

-- The seconds a timeout counts: one that is no number, or below 0, counts
-- as 0.
local function counted(timeout)
  return type(timeout) == "number" and math.max(timeout, 0.0) or 0.0
end

-- Arms an expiry on the Game clock: `expire` runs when an advance reaches
-- `timeout` seconds from now, once, or once per `timeout` when `periodic`,
-- counted from now without drift. A timeout of 0 expires on the next
-- advance when one-shot, every 0.0001 s when periodic. Nothing runs
-- `expire` but __stub_advance_time. Returns a function that cancels what is
-- still to expire. Not a Native, so it adds no call-log line.
function __stub_schedule(timeout, periodic, expire)
  armed = armed + 1
  local expiry = { order = armed, expire = expire }
  timeout = counted(timeout)
  if periodic then
    expiry.from = clock
    expiry.period = math.max(timeout, SHORTEST_PERIOD)
    expiry.count = 1
    expiry.at = clock + expiry.period
  else
    expiry.at = clock + timeout
  end
  pending[#pending + 1] = expiry
  return function()
    expiry.cancelled = true
  end
end

-- Whether expiry `a` runs before expiry `b`: the earlier instant, then the
-- one armed first.
local function before(a, b)
  if math.abs(a.at - b.at) <= SAME_INSTANT then
    return a.order < b.order
  end
  return a.at < b.at
end

-- The next expiry at or before `finish`, nil when there is none. Drops the
-- cancelled ones on the way.
local function nextExpiry(finish)
  local kept, found = {}, nil
  for i = 1, #pending do
    local expiry = pending[i]
    if not expiry.cancelled then
      kept[#kept + 1] = expiry
      if expiry.at <= finish + SAME_INSTANT and (found == nil or before(expiry, found)) then
        found = expiry
      end
    end
  end
  pending = kept
  return found
end

-- Runs every expiry up to `finish`, the clock at each one's instant while
-- it runs. An expiry is armed again, or cancelled, before it runs, so that
-- what its handler does to its own timer stands.
local function runExpiries(finish)
  local atThisInstant = 0
  while true do
    local expiry = nextExpiry(finish)
    if expiry == nil then
      return
    end
    local instant = math.min(expiry.at, finish)
    if instant > clock then
      clock = instant
      atThisInstant = 0
    end
    atThisInstant = atThisInstant + 1
    if atThisInstant > MOST_EXPIRIES_AT_ONE_INSTANT then
      error("the Game clock ran more than " .. MOST_EXPIRIES_AT_ONE_INSTANT
        .. " expiries at one instant, " .. clock .. " s: a handler that starts a timer of"
        .. " timeout 0 every time it runs never lets the advance end", 0)
    end
    if expiry.period ~= nil then
      expiry.count = expiry.count + 1
      expiry.at = expiry.from + expiry.count * expiry.period
    else
      expiry.cancelled = true
    end
    expiry.expire()
  end
end

-- Moves the Game clock `seconds` forward, running every expiry inside the
-- window: in the order of their instants, ties in the order they were
-- armed, the clock standing at each instant while its handler runs. An
-- expiry a handler arms runs in the same advance when it falls inside the
-- window. The clock ends at its start plus `seconds`; when a handler
-- throws, the error leaves the advance and the clock stays at that instant.
-- A negative or an endless advance is an error, and so is an advance inside
-- a handler.
-- Not a Native, so it adds no call-log line.
function __stub_advance_time(seconds)
  if type(seconds) ~= "number" or seconds ~= seconds or seconds < 0 or seconds == math.huge then
    error("__stub_advance_time: expected a number of seconds, 0 or more, and got "
      .. tostring(seconds), 2)
  end
  if advancing then
    error("an advance is running: a handler cannot move the Game clock", 2)
  end
  local finish = clock + seconds
  advancing = true
  local ok, err = pcall(runExpiries, finish)
  advancing = false
  if not ok then
    error(err, 0)
  end
  clock = finish
end

function CreateTimer()
  __stub_record("CreateTimer")
  return __stub_new_handle("timer")
end

-- What a timer keeps, on its handle: `timeout`, `periodic` and `handler` of
-- the last TimerStart, `starts`, how many there were, `stored`, the one
-- stored remaining, and `run`, its countdown while it is running:
-- { from, length, cancel }, counted from the instant `from` for `length`
-- seconds. As measured in the game
-- (docs/research/timer-resume-cases.md, "One rule that fits every case"):
--
-- - The stored remaining is 0 at first and written only when PauseTimer
--   stops a running timer; TimerStart keeps it.
-- - A timer that is not running (never started, paused, expired, stopped
--   after a resume) reads it as its remaining, and its timeout minus it as
--   its elapsed time.
-- - A one-shot timer stops running when it expires, before its handler; a
--   periodic one is still running in its handler, its countdown at its end,
--   and counts again from there once the handler returns.
--
-- `firedByHand` is the countdown __stub_fire_timer runs the handler on,
-- while it runs it: until the handler starts the timer again, the timer
-- reads and answers as in the handler of an expiry.

-- Whether __stub_fire_timer is running the handler on the countdown the
-- timer has now.
local function atHandFire(whichTimer)
  return whichTimer.run ~= nil and whichTimer.firedByHand == whichTimer.run
end

-- Whether the timer is running. A one-shot timer __stub_fire_timer fires is
-- not, inside its handler, as in the handler of an expiry.
local function running(whichTimer)
  return whichTimer.run ~= nil and not (atHandFire(whichTimer) and not whichTimer.periodic)
end

-- The elapsed and the remaining time of the timer.
local function reading(whichTimer)
  local timeout = whichTimer.timeout or 0.0
  if not running(whichTimer) then
    local stored = whichTimer.stored or 0.0
    return timeout - stored, stored
  end
  local run = whichTimer.run
  if run.ended or atHandFire(whichTimer) then
    return timeout, 0.0
  end
  local elapsed = clock - run.from
  -- The game counts 0.0001 s at the least, and reads it right after the
  -- call (docs/research/timer-answers.md, "A timer of timeout 0").
  return elapsed, math.max(run.length, SHORTEST_PERIOD) - elapsed
end

-- Cancels the countdown of the timer, if it is running.
local function disarm(whichTimer)
  local run = whichTimer.run
  if run ~= nil then
    run.cancel()
    whichTimer.run = nil
  end
end

-- One expiry of the timer: the Triggers of its expire event through the
-- Event dispatch, then its handler, each with the timer as GetExpiredTimer's
-- answer (docs/research/timer-expire-event.md, "The expire event"). The
-- handler is the one the timer has once the Triggers ran, and it runs even
-- when one of them destroyed the timer ("A call a Trigger of the expire
-- event makes on its timer").
local function expire(whichTimer)
  __stub_dispatch(EVENT_GAME_TIMER_EXPIRED, whichTimer, { GetExpiredTimer = whichTimer })
  local handler = whichTimer.handler
  if handler ~= nil then
    __stub_with_context({ GetExpiredTimer = whichTimer }, handler)
  end
end

-- Starts a countdown of the timer, of `length` seconds from now: `ended`
-- runs when an advance reaches its end, once, or once per `length` when
-- `periodic`. Returns the countdown.
local function arm(whichTimer, length, periodic, ended)
  local run = { from = clock, length = length }
  run.cancel = __stub_schedule(length, periodic, function()
    ended(run)
  end)
  whichTimer.run = run
  return run
end

-- Runs `body`, then `after`, also when `body` throws: an error a handler
-- throws leaves the advance, and the timer goes on as in the game.
local function thenAlways(body, after)
  local ok, err = pcall(body)
  after()
  if not ok then
    error(err, 0)
  end
end

-- Starts a countdown of `length` seconds at whose end the timer stops
-- running, then expires: the countdown of a one-shot timer, and the last
-- one of a resumed timer.
local function armLast(whichTimer, length)
  arm(whichTimer, length, false, function()
    whichTimer.run = nil
    expire(whichTimer)
  end)
end

-- A new start cancels the countdown, whatever a resume had left to do, and
-- counts from now. A one-shot timer is no longer running in its handler; a
-- periodic one counts again once its handler returns, unless the handler
-- paused, started or destroyed it.
function TimerStart(whichTimer, timeout, periodic, handlerFunc)
  __stub_record("TimerStart", whichTimer, timeout, periodic, handlerFunc)
  whichTimer.timeout = timeout
  whichTimer.periodic = periodic
  whichTimer.handler = handlerFunc
  whichTimer.starts = (whichTimer.starts or 0) + 1
  disarm(whichTimer)
  if whichTimer.destroyed then
    return
  end
  if not periodic then
    armLast(whichTimer, counted(timeout))
    return
  end
  arm(whichTimer, math.max(counted(timeout), SHORTEST_PERIOD), true, function(run)
    run.ended = true
    thenAlways(function()
      expire(whichTimer)
    end, function()
      run.ended = nil
      run.from = clock
    end)
  end)
end

-- A timer that was never started has a zero timeout, as in the game.
function TimerGetTimeout(whichTimer)
  __stub_record("TimerGetTimeout", whichTimer)
  return whichTimer.timeout or 0.0
end

-- The time since TimerStart, or since the last periodic expiry, of a
-- running timer, and since ResumeTimer of a resumed one; the timeout minus
-- the stored remaining of a timer that is not running, below 0 where the
-- game gives it so.
function TimerGetElapsed(whichTimer)
  __stub_record("TimerGetElapsed", whichTimer)
  local elapsed = reading(whichTimer)
  return elapsed
end

-- What is left of the countdown of a running timer; the stored remaining of
-- a timer that is not running.
function TimerGetRemaining(whichTimer)
  __stub_record("TimerGetRemaining", whichTimer)
  local _, remaining = reading(whichTimer)
  return remaining
end

-- Stops a running timer and stores what was left: it does not expire, and
-- an advance skips it silently. On a timer that is not running it writes
-- nothing.
function PauseTimer(whichTimer)
  __stub_record("PauseTimer", whichTimer)
  if running(whichTimer) then
    local _, remaining = reading(whichTimer)
    whichTimer.stored = remaining
    disarm(whichTimer)
  end
end

-- Copies the game (docs/research/timer-resume-cases.md): on a timer that is
-- not running it counts the stored remaining, fires, counts the timeout,
-- fires once more and stops, one-shot or periodic alike, with the handler
-- of the last TimerStart. On a running timer it does nothing. A countdown
-- of 0 ends on the next advance, never inside the call. A timer never
-- started fires the Triggers of its expire event once, on the next
-- advance, and stops.
--
-- In its first fire the timer is not running, and its second countdown
-- starts when the handler returns, over what a ResumeTimer in the handler
-- started; only a TimerStart or a DestroyTimer in the handler ends it
-- (docs/research/timer-expire-event.md, "A call a handler makes on its own
-- timer").
function ResumeTimer(whichTimer)
  __stub_record("ResumeTimer", whichTimer)
  if running(whichTimer) or whichTimer.destroyed then
    return
  end
  -- The countdown of a one-shot timer __stub_fire_timer fired, if any.
  disarm(whichTimer)
  local starts = whichTimer.starts
  if starts == nil then
    armLast(whichTimer, 0.0)
    return
  end
  arm(whichTimer, whichTimer.stored or 0.0, false, function()
    whichTimer.run = nil
    thenAlways(function()
      expire(whichTimer)
    end, function()
      if whichTimer.destroyed or whichTimer.starts ~= starts then
        return
      end
      disarm(whichTimer)
      armLast(whichTimer, counted(whichTimer.timeout))
    end)
  end)
end

-- A destroyed timer does not expire: an advance skips it silently.
function DestroyTimer(whichTimer)
  __stub_record("DestroyTimer", whichTimer)
  whichTimer.destroyed = true
  disarm(whichTimer)
end

-- The expired timer: the timer while an advance runs the Triggers of its
-- expire event and its handler, or __stub_fire_timer its handler, nil
-- outside them.
__stub_response("GetExpiredTimer")

-- Runs the handler TimerStart stored, once, with the timer as
-- GetExpiredTimer's answer. It moves no clock, arms nothing and fires no
-- expire event: the countdown of the timer stays as it was. Inside the
-- handler the timer reads and answers as in the handler of an expiry,
-- until the handler starts it again: the timeout and nothing left, and a
-- one-shot timer is not running, so a PauseTimer writes nothing and stops
-- nothing, and a ResumeTimer resumes it, in place of its countdown. Firing a timer that was never started or was
-- destroyed is an error. Not a Native, so it adds no call-log line.
function __stub_fire_timer(whichTimer)
  local handler = whichTimer.handler
  if handler == nil then
    error("__stub_fire_timer: " .. __stub_format(whichTimer) .. " was never started with a handler", 2)
  end
  if whichTimer.destroyed then
    error("__stub_fire_timer: " .. __stub_format(whichTimer) .. " was destroyed", 2)
  end
  local firedByHand = whichTimer.firedByHand
  whichTimer.firedByHand = whichTimer.run
  thenAlways(function()
    __stub_with_context({ GetExpiredTimer = whichTimer }, handler)
  end, function()
    whichTimer.firedByHand = firedByHand
  end)
end
