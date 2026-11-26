-- Hand-written stand-in for a compiled failures.test.ts on reforged-test/map.
-- Each test runs in a Lua state of its own, so the hooks note what ran in a
-- file of the VM's in-memory file system, which outlives a state: the extra
-- stub file the test passes names it (__fixture_log_path), fresh for each
-- run. The tests run in registration order, so each "notes" test reads what
-- the test before it noted, then empties the file.
local map = require("lua_modules.reforged-test.map.index")
local describe, it, expect = map.describe, map.it, map.expect
local beforeEach, afterEach = map.beforeEach, map.afterEach

local function note(line)
  return function()
    local file = assert(io.open(__fixture_log_path, "a"))
    file:write(line, "\n")
    file:close()
  end
end

local function notes()
  local lines = {}
  local file = io.open(__fixture_log_path, "r")
  if file then
    for line in file:lines() do table.insert(lines, line) end
    file:close()
  end
  assert(io.open(__fixture_log_path, "w")):close()
  return lines
end

describe("a beforeEach that throws", function()
  beforeEach(function()
    note("before 1")()
    error("before broke", 0)
  end)
  beforeEach(note("before 2"))
  afterEach(note("after"))
  it("fails the test and skips its body", note("body"))
end)

it("notes the afterEach hooks, run after a failing beforeEach", function()
  expect(notes()).toEqual({ "before 1", "after" })
end)

describe("a body that throws", function()
  afterEach(note("outer after"))
  describe("inner", function()
    afterEach(note("inner after"))
    it("fails the test", function() error("body broke", 0) end)
  end)
end)

it("notes the afterEach hooks, run after a failing body", function()
  expect(notes()).toEqual({ "inner after", "outer after" })
end)

describe("an afterEach that throws", function()
  beforeEach(function() return note("cleanup") end)
  afterEach(note("outer after"))
  afterEach(function() error("after broke", 0) end)
  afterEach(note("first after"))
  it("fails a test that had passed", note("body"))
end)

it("notes the afterEach hooks, the ones after the failing one and the cleanup skipped", function()
  expect(notes()).toEqual({ "body", "first after" })
end)

describe("a beforeEach that returns a function", function()
  beforeEach(function() return note("cleanup 1") end)
  beforeEach(function() return note("cleanup 2") end)
  afterEach(note("after"))
  it("runs it after the afterEach hooks", note("body"))
end)

it("notes the cleanups after the afterEach hooks, the last returned first", function()
  expect(notes()).toEqual({ "body", "after", "cleanup 2", "cleanup 1" })
end)

describe("an afterEach whose expectation fails", function()
  afterEach(function() expect(1).toEqual(2) end)
  it("fails the test with the expectation's message", function() end)
end)

describe("two failures", function()
  describe("in a beforeEach and an afterEach", function()
    beforeEach(function() error("before broke", 0) end)
    afterEach(function() error("after broke", 0) end)
    it("reports the beforeEach's", function() end)
  end)

  describe("in the body and an afterEach", function()
    afterEach(function() error("after broke", 0) end)
    it("reports the body's", function() expect(1).toEqual(3) end)
  end)
end)

describe("a hook registered inside a test", function()
  it("throws", function()
    expect(function() beforeEach(function() end) end).toThrow(
      "beforeEach: called inside a test; register it in a describe or at the top of the file"
    )
    expect(function() afterEach(function() end) end).toThrow(
      "afterEach: called inside a test; register it in a describe or at the top of the file"
    )
  end)
end)
