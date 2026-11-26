-- Hand-written stand-in for a compiled skip.test.ts on reforged-test/map.
-- When the extra stub file names __fixture_loads_path, each load adds one
-- to a counter in a file of the VM's in-memory file system, which outlives
-- a Lua state: the first load lists the tests, and only the tests that run
-- open a load of their own. A skipped test or hook raises if it runs.
local map = require("lua_modules.reforged-test.map.index")
local describe, it, expect, beforeEach = map.describe, map.it, map.expect, map.beforeEach

local loads
if __fixture_loads_path ~= nil then
  local file = io.open(__fixture_loads_path, "r")
  loads = (file and tonumber(file:read("a")) or 0) + 1
  if file then file:close() end
  file = assert(io.open(__fixture_loads_path, "w"))
  file:write(tostring(loads))
  file:close()
end

local function inLoad(n)
  return function()
    if loads ~= nil then expect(loads).toEqual(n) end
  end
end

it("runs in the second load", inLoad(2))
it.skip("opens no game", function() error("a skipped test ran") end)
it.todo("is still to write")

describe.skip("a skipped describe", function()
  beforeEach(function() error("a hook of a skipped describe ran") end)
  it("opens no game either", function() error("a test of a skipped describe ran") end)
end)

describe("a describe", function()
  it("runs in the third load", inLoad(3))
end)
