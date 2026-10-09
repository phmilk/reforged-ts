-- Runs the bundle of the lua fixture on the reforged-test harness: the
-- constant holds the integer FourCC gives for its Rawcode.
local t = require("lua_modules.reforged-test.lua.index")
local main = require("bundle")

t.describe("the units' module", function()
  t.it("holds the Footman's Rawcode as FourCC gives it", function()
    t.expect(math.type(main.footman)).toBe("integer")
    t.expect(main.footman).toBe(FourCC("hfoo"))
    t.expect(main.literal).toBe(main.footman)
  end)
end)
