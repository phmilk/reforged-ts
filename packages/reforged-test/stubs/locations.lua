-- reforged-test stubs for the locations family. A location handle stores the
-- coordinates Location was given.

function Location(x, y)
  __stub_record("Location", x, y)
  local location = __stub_new_handle("location")
  location.x = x
  location.y = y
  return location
end
