-- Hand-written stand-in for a compiled order.test.ts on reforged-test/map.
-- Every hook and body adds a line to the log, and the file's one afterEach,
-- which runs last, checks the log against the order the test expects.
local map = require("lua_modules.reforged-test.map.index")
local describe, it, expect = map.describe, map.it, map.expect
local beforeEach, afterEach = map.beforeEach, map.afterEach

local log, expected = {}, nil
local function record(line)
  return function() table.insert(log, line) end
end

afterEach(function() expect(log).toEqual(expected) end)
beforeEach(record("root before"))

it("runs the file's hooks around a test at the top", function()
  record("body")()
  expected = { "root before", "body" }
end)

describe("outer", function()
  beforeEach(record("outer before 1"))
  afterEach(record("outer after 1"))

  describe("inner", function()
    beforeEach(record("inner before"))
    afterEach(record("inner after"))

    it("runs beforeEach outer to inner and afterEach inner to outer", function()
      record("body")()
      expected = {
        "root before",
        "outer before 1",
        "outer before 2",
        "inner before",
        "body",
        "inner after",
        "outer after 2",
        "outer after 1",
      }
    end)
  end)

  -- Registered after the tests of the describe, and still theirs.
  beforeEach(record("outer before 2"))
  afterEach(record("outer after 2"))
end)

describe("sibling", function()
  it("runs no hook of another describe", function()
    record("body")()
    expected = { "root before", "body" }
  end)
end)
