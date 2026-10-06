udg_UnitType = 0
udg_UnitTypeInit = 0
udg_UnitTypeArray = __jarray(0)
udg_UnitTypeArrayInit = __jarray(0)
udg_ItemType = 0
udg_ItemTypeInit = 0
udg_ItemTypeArray = __jarray(0)
udg_ItemTypeArrayInit = __jarray(0)
udg_AbilityCode = 0
udg_AbilityCodeInit = 0
udg_AbilityCodeArray = __jarray(0)
udg_AbilityCodeArrayInit = __jarray(0)
udg_Buff = 0
udg_BuffInit = 0
udg_BuffArray = __jarray(0)
udg_BuffArrayInit = __jarray(0)
udg_DestructibleType = 0
udg_DestructibleTypeInit = 0
udg_DestructibleTypeArray = __jarray(0)
udg_DestructibleTypeArrayInit = __jarray(0)
udg_TechType = 0
udg_TechTypeInit = 0
udg_TechTypeArray = __jarray(0)
udg_TechTypeArrayInit = __jarray(0)
udg_Order = 0
udg_OrderArray = __jarray(0)
udg_Integer = 0
udg_IntegerInit = 0
udg_IntegerArray = __jarray(0)
udg_IntegerArrayInit = __jarray(0)
gg_trg_Melee_Initialization = nil
function InitGlobals()
local i = 0

udg_UnitTypeInit = FourCC("hfoo")
i = 0
while (true) do
if ((i > 3)) then break end
udg_UnitTypeArrayInit[i] = FourCC("hfoo")
i = i + 1
end
udg_ItemTypeInit = FourCC("ratc")
i = 0
while (true) do
if ((i > 3)) then break end
udg_ItemTypeArrayInit[i] = FourCC("ratc")
i = i + 1
end
udg_AbilityCodeInit = FourCC("AHbz")
i = 0
while (true) do
if ((i > 3)) then break end
udg_AbilityCodeArrayInit[i] = FourCC("AHbz")
i = i + 1
end
udg_BuffInit = FourCC("Binv")
i = 0
while (true) do
if ((i > 3)) then break end
udg_BuffArrayInit[i] = FourCC("Binv")
i = i + 1
end
udg_DestructibleTypeInit = FourCC("LTlt")
i = 0
while (true) do
if ((i > 3)) then break end
udg_DestructibleTypeArrayInit[i] = FourCC("LTlt")
i = i + 1
end
udg_TechTypeInit = FourCC("Rhme")
i = 0
while (true) do
if ((i > 3)) then break end
udg_TechTypeArrayInit[i] = FourCC("Rhme")
i = i + 1
end
udg_Integer = 0
udg_IntegerInit = 7
i = 0
while (true) do
if ((i > 3)) then break end
udg_IntegerArray[i] = 0
i = i + 1
end
i = 0
while (true) do
if ((i > 3)) then break end
udg_IntegerArrayInit[i] = 7
i = i + 1
end
end

function Trig_Melee_Initialization_Actions()
MeleeStartingVisibility()
MeleeStartingHeroLimit()
MeleeGrantHeroItems()
MeleeStartingResources()
MeleeClearExcessUnits()
MeleeStartingUnits()
MeleeStartingAI()
MeleeInitVictoryDefeat()
end

function InitTrig_Melee_Initialization()
gg_trg_Melee_Initialization = CreateTrigger()
TriggerAddAction(gg_trg_Melee_Initialization, Trig_Melee_Initialization_Actions)
end

function InitCustomTriggers()
InitTrig_Melee_Initialization()
end

function RunInitializationTriggers()
ConditionalTriggerExecute(gg_trg_Melee_Initialization)
end

function InitCustomPlayerSlots()
SetPlayerStartLocation(Player(0), 0)
SetPlayerColor(Player(0), ConvertPlayerColor(0))
SetPlayerRacePreference(Player(0), RACE_PREF_HUMAN)
SetPlayerRaceSkin(Player(0), RACE_PREF_RANDOM)
SetPlayerRaceSelectable(Player(0), true)
SetPlayerController(Player(0), MAP_CONTROL_USER)
end

function InitCustomTeams()
SetPlayerTeam(Player(0), 0)
end

function main()
SetCameraBounds(-3328.0 + GetCameraMargin(CAMERA_MARGIN_LEFT), -3584.0 + GetCameraMargin(CAMERA_MARGIN_BOTTOM), 3328.0 - GetCameraMargin(CAMERA_MARGIN_RIGHT), 3072.0 - GetCameraMargin(CAMERA_MARGIN_TOP), -3328.0 + GetCameraMargin(CAMERA_MARGIN_LEFT), 3072.0 - GetCameraMargin(CAMERA_MARGIN_TOP), 3328.0 - GetCameraMargin(CAMERA_MARGIN_RIGHT), -3584.0 + GetCameraMargin(CAMERA_MARGIN_BOTTOM))
SetDayNightModels("Environment\\DNC\\DNCLordaeron\\DNCLordaeronTerrain\\DNCLordaeronTerrain.mdl", "Environment\\DNC\\DNCLordaeron\\DNCLordaeronUnit\\DNCLordaeronUnit.mdl")
SetHDWaterParamsEx(0, 0, 0, false, 20, 0, 100, 10, 0, 50, 100, 100)
NewSoundEnvironment("Default")
SetAmbientDaySound("LordaeronSummerDay")
SetAmbientNightSound("LordaeronSummerNight")
SetMapMusic("Music", true, 0)
InitBlizzard()
InitGlobals()
InitCustomTriggers()
RunInitializationTriggers()
end

function config()
SetMapName("TRIGSTR_003")
SetMapDescription("TRIGSTR_005")
SetPlayers(1)
SetTeams(1)
SetGamePlacement(MAP_PLACEMENT_USE_MAP_SETTINGS)
DefineStartLocation(0, -1408.0, 1728.0)
InitCustomPlayerSlots()
SetPlayerSlotAvailable(Player(0), MAP_CONTROL_USER)
InitGenericPlayerSlots()
end

