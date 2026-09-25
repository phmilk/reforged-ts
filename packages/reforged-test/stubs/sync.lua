-- reforged-test stubs for the sync family. A sent packet never reaches
-- anyone on its own: BlzSendSyncData records it, and a test delivers it (or
-- a packet it built) with __stub_deliver_sync, in triggers.lua, which fires
-- the sync registrations as the game would.

-- Every packet sent, in order: its prefix, its data and the local player
-- that sent it, the shape __stub_deliver_sync takes.
local packets = {}

-- Records the packet and returns true: the network never fails on the
-- harness. A test that needs a failure overrides the Native for its length.
function BlzSendSyncData(prefix, data)
  __stub_record("BlzSendSyncData", prefix, data)
  packets[#packets + 1] = { prefix = prefix, data = data, from = __stub_local_player() }
  return true
end

-- The packets sent so far, oldest first, in a new list. Not a Native, so it
-- adds no call-log line.
function __stub_sync_packets()
  return table.move(packets, 1, #packets, 1, {})
end
