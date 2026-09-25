-- reforged-test stubs for the text display family: the Natives that show a
-- message on a player's screen. Each is recorded, and what it showed is kept
-- with the player it was shown to, so a test reads what reached the screen
-- through __stub_displayed. No Native reads a shown message back in the game.

-- Every message shown, oldest first: the Native, the player, the position,
-- the duration (nil for DisplayTextToPlayer) and the text as given.
local displayed = {}

local function show(native, toPlayer, x, y, duration, message)
  displayed[#displayed + 1] = {
    native = native,
    player = toPlayer,
    x = x,
    y = y,
    duration = duration,
    text = message,
  }
end

function DisplayTextToPlayer(toPlayer, x, y, message)
  __stub_record("DisplayTextToPlayer", toPlayer, x, y, message)
  show("DisplayTextToPlayer", toPlayer, x, y, nil, message)
end

function DisplayTimedTextToPlayer(toPlayer, x, y, duration, message)
  __stub_record("DisplayTimedTextToPlayer", toPlayer, x, y, duration, message)
  show("DisplayTimedTextToPlayer", toPlayer, x, y, duration, message)
end

-- The game substitutes the sender's name for %s; the stub keeps the text as
-- it was given.
function DisplayTimedTextFromPlayer(toPlayer, x, y, duration, message)
  __stub_record("DisplayTimedTextFromPlayer", toPlayer, x, y, duration, message)
  show("DisplayTimedTextFromPlayer", toPlayer, x, y, duration, message)
end

-- Only recorded: the capture is what was shown, and stays as it was.
function ClearTextMessages()
  __stub_record("ClearTextMessages")
end

-- The messages shown so far, oldest first, each
-- { native, player, x, y, duration, text }. Not a Native, so it adds no
-- call-log line.
function __stub_displayed()
  return table.move(displayed, 1, #displayed, 1, {})
end
