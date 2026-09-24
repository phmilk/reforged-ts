-- Hand-written stand-in for a compiled handles/unit.test.ts.
local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect
local unit = require("handles.unit")

describe("unit", function()
  it("requires a sibling module by its dotted name", function()
    expect(unit.double(21)).toEqual(42)
  end)
end)
