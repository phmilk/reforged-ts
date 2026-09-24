-- reforged-test stubs for the frames family. A created frame stores the
-- owner it was given as its parent and is appended to that owner's children;
-- a name lookup finds a frame created under that name and context. Where the
-- game finds nothing, it hands back a frame whose handle id is 0, which
-- __stub_frame_not_found returns.

-- The game's "not found" frame: one handle, id 0, never allocated.
local notFound = { __kind = "framehandle", __handleId = 0 }

-- Frames by name and create context, for BlzGetFrameByName.
local byName = {}

-- Origin frames by type and index, one handle each, made on first use.
local origins = {}

local function newFrame(name, owner, createContext)
  local frame = __stub_new_handle("framehandle")
  frame.name = name
  frame.parent = owner
  frame.children = {}
  if owner ~= nil and owner.children ~= nil then
    owner.children[#owner.children + 1] = frame
  end
  byName[name .. "#" .. tostring(createContext)] = frame
  return frame
end

function BlzCreateFrame(name, owner, priority, createContext)
  __stub_record("BlzCreateFrame", name, owner, priority, createContext)
  return newFrame(name, owner, createContext)
end

function BlzCreateSimpleFrame(name, owner, createContext)
  __stub_record("BlzCreateSimpleFrame", name, owner, createContext)
  return newFrame(name, owner, createContext)
end

function BlzCreateFrameByType(typeName, name, owner, inherits, createContext)
  __stub_record("BlzCreateFrameByType", typeName, name, owner, inherits, createContext)
  return newFrame(name, owner, createContext)
end

function BlzGetFrameByName(name, createContext)
  __stub_record("BlzGetFrameByName", name, createContext)
  return byName[name .. "#" .. tostring(createContext)] or notFound
end

function BlzGetOriginFrame(frameType, index)
  __stub_record("BlzGetOriginFrame", frameType, index)
  local key = __stub_format(frameType) .. "#" .. tostring(index)
  local frame = origins[key]
  if frame == nil then
    frame = __stub_new_handle("framehandle")
    frame.children = {}
    origins[key] = frame
  end
  return frame
end

-- No frame event fires in a stub, so there is no triggering frame.
function BlzGetTriggerFrame()
  __stub_record("BlzGetTriggerFrame")
  return nil
end

-- An origin frame was given no owner, so it has no parent.
function BlzFrameGetParent(frame)
  __stub_record("BlzFrameGetParent", frame)
  return frame.parent
end

-- The children in creation order; index 0 is the first.
function BlzFrameGetChild(frame, index)
  __stub_record("BlzFrameGetChild", frame, index)
  return frame.children[index + 1]
end

-- The frame the game returns when it finds none (handle id 0), for a test to
-- hand back through a Native override. Not a Native, so no call-log line.
function __stub_frame_not_found()
  return notFound
end
