-- reforged-test stubs for the Preload family: what a file write was given.
-- The stubs write no file and run none: PreloadGenEnd keeps the strings
-- Preload was given since the last PreloadGenClear under the file's name,
-- for a test to read with __stub_preload_file, and Preloader only records.
-- A test that emulates a read overrides Preloader for its length.

-- The strings Preload was given since the last PreloadGenClear.
local strings = {}

-- The strings each file was written with, by file name.
local files = {}

function PreloadGenClear()
  __stub_record("PreloadGenClear")
  strings = {}
end

function PreloadGenStart()
  __stub_record("PreloadGenStart")
end

function Preload(filename)
  __stub_record("Preload", filename)
  strings[#strings + 1] = filename
end

function PreloadGenEnd(filename)
  __stub_record("PreloadGenEnd", filename)
  files[filename] = table.move(strings, 1, #strings, 1, {})
end

function Preloader(filename)
  __stub_record("Preloader", filename)
end

-- The strings the last PreloadGenEnd of `filename` wrote, in order, in a new
-- list; nil for a file never written. Not a Native, so it adds no call-log
-- line.
function __stub_preload_file(filename)
  local written = files[filename]
  if written == nil then
    return nil
  end
  return table.move(written, 1, #written, 1, {})
end
