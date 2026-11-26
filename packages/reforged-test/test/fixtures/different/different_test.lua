-- Hand-written stand-in for a compiled different.test.ts on reforged-test/map
-- whose test names change from one load to the next: a counter kept in a
-- file of the VM's in-memory file system, which outlives a Lua state.
local map = require("lua_modules.reforged-test.map.index")
local it = map.it

local path = "/reforged-test-different-loads"
local file = io.open(path, "r")
local loads = file and tonumber(file:read("a")) or 0
if file then file:close() end
file = assert(io.open(path, "w"))
file:write(tostring(loads + 1))
file:close()

it("registered on load " .. tostring(loads), function() end)
