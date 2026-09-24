-- reforged-test stubs for the images family.

function CreateImage(file, sizeX, sizeY, sizeZ, posX, posY, posZ, originX,
                     originY, originZ, imageType)
  __stub_record("CreateImage", file, sizeX, sizeY, sizeZ, posX, posY, posZ,
    originX, originY, originZ, imageType)
  return __stub_new_handle("image")
end
