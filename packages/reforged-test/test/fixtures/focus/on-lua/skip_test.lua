-- Hand-written stand-in for a compiled skip.test.ts on reforged-test/lua:
-- every hook and body that runs adds a line to the log, and the last test
-- checks that no skip or todo test, nor one of a skipped describe, ran its
-- body or a hook.
local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect
local beforeEach, afterEach = runner.beforeEach, runner.afterEach

local log = {}
beforeEach(function() table.insert(log, "before") end)
afterEach(function() table.insert(log, "after") end)

it("runs", function() table.insert(log, "runs") end)
it.skip("is skipped", function() table.insert(log, "skipped body") end)
it.todo("is still to write")

describe.skip("a skipped describe", function()
  beforeEach(function() table.insert(log, "skipped hook") end)
  it("is skipped with its describe", function() table.insert(log, "group body") end)
end)

it("ran no skipped body and no hook for one", function()
  expect(log).toEqual({ "before", "runs", "after", "before" })
end)

-- A plain describe of a skipped one's name runs: it is a group of its own.
describe("a skipped describe", function()
  it("runs in a plain describe of the same name", function() end)
end)
