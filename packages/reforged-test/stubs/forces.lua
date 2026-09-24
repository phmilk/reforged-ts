-- reforged-test stubs for the forces family. A force stores the players
-- ForceAddPlayer was given, in added order.

function CreateForce()
  __stub_record("CreateForce")
  local force = __stub_new_handle("force")
  force.players = {}
  return force
end

function ForceAddPlayer(whichForce, whichPlayer)
  __stub_record("ForceAddPlayer", whichForce, whichPlayer)
  whichForce.players[#whichForce.players + 1] = whichPlayer
end
