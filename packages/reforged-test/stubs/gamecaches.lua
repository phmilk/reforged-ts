-- reforged-test stubs for the game caches family. A game cache stores the
-- campaign file name InitGameCache was given.

function InitGameCache(campaignFile)
  __stub_record("InitGameCache", campaignFile)
  local cache = __stub_new_handle("gamecache")
  cache.campaignFile = campaignFile
  return cache
end
