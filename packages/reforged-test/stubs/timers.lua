-- reforged-test stubs for the timers family. A timer never expires on its
-- own: TimerStart stores the timeout, the periodic flag and the handler, and
-- a test runs the handler with __stub_fire_timer.

function CreateTimer()
  __stub_record("CreateTimer")
  return __stub_new_handle("timer")
end

function TimerStart(whichTimer, timeout, periodic, handlerFunc)
  __stub_record("TimerStart", whichTimer, timeout, periodic, handlerFunc)
  whichTimer.timeout = timeout
  whichTimer.periodic = periodic
  whichTimer.handler = handlerFunc
end

-- A timer that was never started has a zero timeout, as in the game.
function TimerGetTimeout(whichTimer)
  __stub_record("TimerGetTimeout", whichTimer)
  return whichTimer.timeout or 0.0
end

function DestroyTimer(whichTimer)
  __stub_record("DestroyTimer", whichTimer)
end

-- Runs the handler TimerStart stored, once, as one expiry would. Not a
-- Native, so it adds no call-log line.
function __stub_fire_timer(whichTimer)
  local handler = whichTimer.handler
  if handler == nil then
    error("__stub_fire_timer: " .. __stub_format(whichTimer) .. " was never started with a handler", 2)
  end
  handler()
end
