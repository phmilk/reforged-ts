-- reforged-test stubs for the terrain family: the pathing types, in the
-- order the Patch declares them, opaque values a test compares by identity,
-- rendered by name.

for _, name in ipairs({
  "PATHING_TYPE_ANY", "PATHING_TYPE_WALKABILITY", "PATHING_TYPE_FLYABILITY",
  "PATHING_TYPE_BUILDABILITY", "PATHING_TYPE_PEONHARVESTPATHING", "PATHING_TYPE_BLIGHTPATHING",
  "PATHING_TYPE_FLOATABILITY", "PATHING_TYPE_AMPHIBIOUSPATHING",
}) do
  _G[name] = __stub_constant("pathingtype", name)
end
