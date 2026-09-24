-- Hand-written stand-in for a compiled results.test.ts.
local runner = require("lua_modules.reforged-test.lua.index")
local describe, it, expect = runner.describe, runner.it, runner.expect

it("runs at the top level", function()
  expect(true).toBeTruthy()
end)

describe("arithmetic", function()
  it("adds", function()
    expect(1 + 1).toEqual(2)
  end)

  it("fails an expectation", function()
    expect(1 + 1).toEqual(3)
  end)

  it("errors", function()
    error("boom")
  end)

  describe("nested", function()
    it("passes inside a nested describe", function()
      expect("a" .. "b").toEqual("ab")
    end)
  end)

  it("wraps around at 2^31 [32-bit]", function()
    expect(math.tointeger(2147483647 + 1)).toEqual(-2147483648)
  end)
end)
