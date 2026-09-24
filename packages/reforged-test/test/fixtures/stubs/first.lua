-- An extra stub file, as a Map project lists in the stubs option: runs after
-- the shipped stubs, so their machinery and globals exist, and may override them.
first_saw_shipped_record = __stub_record ~= nil
first_saw_max_players = bj_MAX_PLAYERS
bj_MAX_PLAYERS = 12

function BlzGetLocale()
  __stub_record("BlzGetLocale")
  return "enUS"
end
