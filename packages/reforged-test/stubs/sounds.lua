-- reforged-test stubs for the sounds family.

function CreateSound(fileName, looping, is3D, stopWhenOutOfRange, fadeInRate,
                     fadeOutRate, eaxSetting)
  __stub_record("CreateSound", fileName, looping, is3D, stopWhenOutOfRange,
    fadeInRate, fadeOutRate, eaxSetting)
  return __stub_new_handle("sound")
end
