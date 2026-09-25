-- reforged-test stubs for the timers family. A timer never expires on its
-- own: TimerStart stores the timeout, the periodic flag and the handler, and
-- a test runs the handler with __stub_fire_timer. The stubs keep no clock.

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

-- No time passes on the harness, so a timer has neither elapsed nor remaining
-- time, and pausing or resuming it changes nothing a helper reads.
function TimerGetElapsed(whichTimer)
  __stub_record("TimerGetElapsed", whichTimer)
  return 0.0
end

function TimerGetRemaining(whichTimer)
  __stub_record("TimerGetRemaining", whichTimer)
  return 0.0
end

function PauseTimer(whichTimer)
  __stub_record("PauseTimer", whichTimer)
end

function ResumeTimer(whichTimer)
  __stub_record("ResumeTimer", whichTimer)
end

function DestroyTimer(whichTimer)
  __stub_record("DestroyTimer", whichTimer)
  whichTimer.destroyed = true
end

-- The expired timer: the fired timer while __stub_fire_timer runs its
-- handler, nil outside it.
__stub_response("GetExpiredTimer")

-- Runs the handler TimerStart stored, once, as one expiry would, with the
-- timer as GetExpiredTimer's answer. Firing a timer that was never started or
-- was destroyed is an error. Not a Native, so it adds no call-log line.
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
