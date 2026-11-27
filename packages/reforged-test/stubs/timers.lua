-- reforged-test stubs for the timers family, and the Game clock under it. A
-- timer never expires on its own: TimerStart stores the timeout, the
-- periodic flag and the handler and arms an expiry on the Game clock, which
-- only a test moves, with __stub_advance_time. A test also runs one handler
-- by hand with __stub_fire_timer, which moves no clock.

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

-- Arms an expiry on the Game clock: `expire` runs when an advance reaches
-- `timeout` seconds from now, once, or once per `timeout` when `periodic`,
-- counted from now without drift. A timeout of 0 expires on the next
-- advance when one-shot, every 0.0001 s when periodic. Nothing runs
-- `expire` but __stub_advance_time. Returns a function that cancels what is
-- still to expire. Not a Native, so it adds no call-log line.
function __stub_schedule(timeout, periodic, expire)
  armed = armed + 1
  local expiry = { order = armed, expire = expire }
  -- A timeout that is no number, or below 0, counts as 0.
  timeout = type(timeout) == "number" and math.max(timeout, 0.0) or 0.0
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

-- Cancels the pending expiry of the timer, if it has one.
local function disarm(whichTimer)
  if whichTimer.disarm ~= nil then
    whichTimer.disarm()
    whichTimer.disarm = nil
  end
end

-- A new start cancels the pending expiry and counts from now. The expiry
-- runs the handler of this start with the timer as GetExpiredTimer's answer.
function TimerStart(whichTimer, timeout, periodic, handlerFunc)
  __stub_record("TimerStart", whichTimer, timeout, periodic, handlerFunc)
  whichTimer.timeout = timeout
  whichTimer.periodic = periodic
  whichTimer.handler = handlerFunc
  disarm(whichTimer)
  if whichTimer.destroyed then
    return
  end
  whichTimer.disarm = __stub_schedule(timeout, periodic, function()
    if handlerFunc ~= nil then
      __stub_with_context({ GetExpiredTimer = whichTimer }, handlerFunc)
    end
  end)
end

-- A timer that was never started has a zero timeout, as in the game.
function TimerGetTimeout(whichTimer)
  __stub_record("TimerGetTimeout", whichTimer)
  return whichTimer.timeout or 0.0
end

-- The readings do not follow the Game clock yet: a timer has neither
-- elapsed nor remaining time.
function TimerGetElapsed(whichTimer)
  __stub_record("TimerGetElapsed", whichTimer)
  return 0.0
end

function TimerGetRemaining(whichTimer)
  __stub_record("TimerGetRemaining", whichTimer)
  return 0.0
end

-- A paused timer does not expire: an advance skips it silently.
function PauseTimer(whichTimer)
  __stub_record("PauseTimer", whichTimer)
  disarm(whichTimer)
end

-- Records its call and arms nothing: a timer paused stays out of the
-- advances until its next TimerStart.
function ResumeTimer(whichTimer)
  __stub_record("ResumeTimer", whichTimer)
end

-- A destroyed timer does not expire: an advance skips it silently.
function DestroyTimer(whichTimer)
  __stub_record("DestroyTimer", whichTimer)
  whichTimer.destroyed = true
  disarm(whichTimer)
end

-- The expired timer: the timer while an advance or __stub_fire_timer runs
-- its handler, nil outside it.
__stub_response("GetExpiredTimer")

-- Runs the handler TimerStart stored, once, as one expiry would, with the
-- timer as GetExpiredTimer's answer. It moves no clock and arms nothing: the
-- pending expiry of the timer stays as it was. Firing a timer that was never
-- started or was destroyed is an error. Not a Native, so it adds no call-log
-- line.
function __stub_fire_timer(whichTimer)
  local handler = whichTimer.handler
  if handler == nil then
    error("__stub_fire_timer: " .. __stub_format(whichTimer) .. " was never started with a handler", 2)
  end
  if whichTimer.destroyed then
    error("__stub_fire_timer: " .. __stub_format(whichTimer) .. " was destroyed", 2)
  end
  __stub_with_context({ GetExpiredTimer = whichTimer }, handler)
end
