-- reforged-test stubs for the abilities family: an icon per ability id,
-- the one BlzSetAbilityIcon was given, handed back by BlzGetAbilityIcon.

-- The icon of an ability id never set: the game's placeholder icon.
local DEFAULT_ICON = "ReplaceableTextures\\CommandButtons\\BTNTemp.blp"

local icons = {}

function BlzGetAbilityIcon(abilCode)
  __stub_record("BlzGetAbilityIcon", abilCode)
  return icons[abilCode] or DEFAULT_ICON
end

function BlzSetAbilityIcon(abilCode, iconPath)
  __stub_record("BlzSetAbilityIcon", abilCode, iconPath)
  icons[abilCode] = iconPath
end
