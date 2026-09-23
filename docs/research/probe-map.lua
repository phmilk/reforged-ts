-- reforged-ts probe map script (wayfinder ticket #9).
-- Paste this whole file into the map's Custom Script Code (World Editor 3.0,
-- map script language set to Lua), save, Test Map. It writes
--   Documents\Warcraft III\CustomMapData\reforged-probe.txt
-- and prints the same lines on screen. Every check runs under pcall, so a
-- missing library reports "ERROR: ..." instead of killing the script.
-- Run it twice: the "pairs order" and "tostring({})" lines are compared
-- between runs to see whether table iteration order is stable per process.

do
  local lines = {}

  local function add(fmt, ...)
    local ok, s = pcall(string.format, fmt, ...)
    lines[#lines + 1] = ok and s or ("format error: " .. tostring(s))
  end

  local function try(label, fn)
    local ok, res = pcall(fn)
    add("%s = %s", label, ok and tostring(res) or ("ERROR: " .. tostring(res)))
  end

  local function typeOf(name)
    return type(_G[name])
  end

  -------------------------------------------------------------------- root
  local function collectRoot()
    add("== reforged-ts probe, root chunk ==")
    add("_VERSION = %s", tostring(_VERSION))
    for _, n in ipairs({
      "debug", "require", "package", "load", "loadstring", "dofile", "loadfile",
      "os", "io", "collectgarbage", "utf8", "coroutine", "warn", "rawlen",
      "setmetatable", "getmetatable", "select", "next", "pairs", "ipairs",
      "math", "string", "table", "print", "FourCC", "__jarray", "TypeDefine",
    }) do
      add("type(%s) = %s", n, typeOf(n))
    end

    -- Lua 5.3 vs 5.4 fingerprints
    try("type(string.pack)", function() return type(string.pack) end)
    try("type(string.unpack)", function() return type(string.unpack) end)
    try("math.type(1)", function() return math.type(1) end)
    try("math.type(1.0)", function() return math.type(1.0) end)
    try("7 // 2", function() return 7 // 2 end)
    try("7 / 2", function() return 7 / 2 end)
    try("math.maxinteger", function() return math.maxinteger end)
    try("math.maxinteger + 1", function() return math.maxinteger + 1 end)
    try("math.tointeger(3.0)", function() return math.tointeger(3.0) end)
    try("type(math.ult)", function() return type(math.ult) end)
    try("utf8.char(0x263A)", function() return utf8.char(0x263A) end)
    try("string.format('%d', 1.5)", function() return string.format("%d", 1.5) end)
    try("type(coroutine.close) [5.4 only]", function() return type(coroutine.close) end)
    try("<const> syntax [5.4 only]", function()
      local f, err = load("local x <const> = 1 return x")
      if f then return "parses, returns " .. tostring(f()) end
      return "does not parse: " .. tostring(err)
    end)
    -- No integer for-loop overflow test: on Lua 5.3 such a loop never terminates.

    -- host libraries
    try("type(os.clock)", function() return type(os.clock) end)
    try("os.clock()", function() return os.clock() end)
    try("type(os.time)", function() return type(os.time) end)
    try("type(os.date)", function() return type(os.date) end)
    try("type(os.getenv)", function() return type(os.getenv) end)
    try("type(io.open)", function() return type(io.open) end)
    try("type(debug.traceback)", function() return type(debug.traceback) end)
    try("type(debug.getinfo)", function() return type(debug.getinfo) end)
    try("collectgarbage('count')", function() return collectgarbage("count") end)
    try("type(package.loaded)", function() return type(package.loaded) end)
    try("package.path", function() return package.path end)
    try("require('nonexistent')", function() return require("nonexistent") end)
    try("load('return 1+1')()", function() return load("return 1+1")() end)

    -- iteration order
    try("pairs order, first table", function()
      local t = { a = 1, b = 2, c = 3, d = 4, e = 5, f = 6, g = 7, h = 8 }
      local s = {}
      for k in pairs(t) do s[#s + 1] = k end
      return table.concat(s)
    end)
    try("pairs order, second identical table", function()
      local t = { a = 1, b = 2, c = 3, d = 4, e = 5, f = 6, g = 7, h = 8 }
      local s = {}
      for k in pairs(t) do s[#s + 1] = k end
      return table.concat(s)
    end)
    try("tostring({})", function() return tostring({}) end)

    -- map script entry points as seen from the custom-code position
    for _, n in ipairs({
      "main", "config", "InitGlobals", "InitCustomTriggers",
      "RunInitializationTriggers", "MarkGameStarted", "InitBlizzard",
    }) do
      try("type(" .. n .. ") at root", function() return type(_G[n]) end)
    end
  end

  -------------------------------------------------------------------- main
  local roundTrip = "not fired"

  local function writeFile()
    add("== end of probe ==")
    local ok, err = pcall(function()
      PreloadGenClear()
      PreloadGenStart()
      for _, l in ipairs(lines) do
        Preload((l:gsub('"', "'")))
      end
      PreloadGenEnd("reforged-probe.txt")
    end)
    print(ok and "reforged-probe.txt written to CustomMapData" or ("Preload failed: " .. tostring(err)))
    for _, l in ipairs(lines) do print(l) end
  end

  local function collectMain()
    add("== probe, after main ==")
    for _, n in ipairs({
      "main", "config", "InitGlobals", "InitCustomTriggers",
      "RunInitializationTriggers", "MarkGameStarted", "InitBlizzard",
    }) do
      try("type(" .. n .. ") after main", function() return type(_G[n]) end)
    end
    try("tostring(GetLocalPlayer())", function() return tostring(GetLocalPlayer()) end)
    try("tostring(CreateTimer())", function() return tostring(CreateTimer()) end)
    try("GetHandleId recycle: create, destroy, create", function()
      local a = CreateTimer(); local ida = GetHandleId(a); DestroyTimer(a)
      local b = CreateTimer(); local idb = GetHandleId(b)
      return string.format("first=%d second=%d same=%s", ida, idb, tostring(ida == idb))
    end)
    try("same handle from two natives compares equal", function()
      local t = CreateTimer()
      local tbl = {}
      tbl[t] = "yes"
      TimerStart(t, 0.0, false, function()
        local e = GetExpiredTimer()
        roundTrip = string.format("tbl[GetExpiredTimer()]=%s, e==t is %s", tostring(tbl[e]), tostring(e == t))
      end)
      return "scheduled"
    end)
    try("string.format('%.2f', os.clock())", function() return string.format("%.2f", os.clock()) end)

    -- give the 0-second timer time to fire, then write everything
    TimerStart(CreateTimer(), 0.5, false, function()
      add("handle as table key across natives = %s", roundTrip)
      writeFile()
    end)
  end

  -------------------------------------------------------------------- hooks
  -- main and config are defined later in war3map.lua; intercept their
  -- assignment the way Lua init frameworks do, so the probe runs after them.
  local configRan = "no"
  collectRoot()
  setmetatable(_G, {
    __newindex = function(t, k, v)
      if k == "main" and type(v) == "function" then
        rawset(t, k, function()
          v()
          add("config ran before main = %s", configRan)
          collectMain()
        end)
      elseif k == "config" and type(v) == "function" then
        rawset(t, k, function()
          configRan = "yes"
          v()
        end)
      else
        rawset(t, k, v)
      end
    end,
  })
end
