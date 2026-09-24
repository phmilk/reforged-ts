-- reforged-test stubs for the players family. Player, GetPlayerId and
-- GetHandleId are in base.lua because the library calls them at module load.

-- The local player is the player in slot 0, the same handle Player(0)
-- returns.
function GetLocalPlayer()
  __stub_record("GetLocalPlayer")
  return __stub_player(0)
end
