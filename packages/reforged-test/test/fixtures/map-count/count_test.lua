-- Hand-written stand-in for a compiled count.test.ts on reforged-test/map:
-- each load adds one to a counter in a file of the VM's in-memory file
-- system, which outlives a Lua state. The extra stub file the test passes
-- names that file (__fixture_loads_path), fresh for each run.
local map = require("lua_modules.reforged-test.map.index")
local it, expect = map.it, map.expect

local file = io.open(__fixture_loads_path, "r")
local loads = file and tonumber(file:read("a")) or 0
if file then file:close() end
loads = loads + 1
file = assert(io.open(__fixture_loads_path, "w"))
file:write(tostring(loads))
file:close()

-- The first load lists the tests; the test at position k runs in load k + 1.
it("runs in the second load", function() expect(loads).toEqual(2) end)
it("runs in the third load", function() expect(loads).toEqual(3) end)
it("runs in the fourth load", function() expect(loads).toEqual(4) end)
