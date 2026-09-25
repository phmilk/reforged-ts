-- reforged-test stubs for the triggers family. CreateTrigger is in base.lua,
-- the baseline every test can rely on (the library's globals stage creates
-- the sync Trigger with it). A trigger never fires on its own: it stores its
-- actions and conditions, a registration keeps nothing beyond its call-log
-- line, and a test fires the trigger with __stub_fire_trigger and the context
-- the response Natives answer from. The one exception is a sync
-- registration, remembered so that __stub_deliver_sync finds the triggers
-- the game would fire for a packet.

-- The game's constants the registration Natives take and the event response
-- Natives answer with, per kind in the order the Typings declare them: opaque
-- values a test compares by identity, rendered by name in the call log.
local function constants(kind, names)
  for i = 1, #names do
    _G[names[i]] = __stub_constant(kind, names[i])
  end
end

constants("playerunitevent", {
  "EVENT_PLAYER_UNIT_ATTACKED", "EVENT_PLAYER_UNIT_RESCUED", "EVENT_PLAYER_UNIT_DEATH",
  "EVENT_PLAYER_UNIT_DECAY", "EVENT_PLAYER_UNIT_DETECTED", "EVENT_PLAYER_UNIT_HIDDEN",
  "EVENT_PLAYER_UNIT_SELECTED", "EVENT_PLAYER_UNIT_DESELECTED", "EVENT_PLAYER_UNIT_CONSTRUCT_START",
  "EVENT_PLAYER_UNIT_CONSTRUCT_CANCEL", "EVENT_PLAYER_UNIT_CONSTRUCT_FINISH",
  "EVENT_PLAYER_UNIT_UPGRADE_START", "EVENT_PLAYER_UNIT_UPGRADE_CANCEL",
  "EVENT_PLAYER_UNIT_UPGRADE_FINISH", "EVENT_PLAYER_UNIT_TRAIN_START",
  "EVENT_PLAYER_UNIT_TRAIN_CANCEL", "EVENT_PLAYER_UNIT_TRAIN_FINISH",
  "EVENT_PLAYER_UNIT_RESEARCH_START", "EVENT_PLAYER_UNIT_RESEARCH_CANCEL",
  "EVENT_PLAYER_UNIT_RESEARCH_FINISH", "EVENT_PLAYER_UNIT_ISSUED_ORDER",
  "EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER", "EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER",
  "EVENT_PLAYER_UNIT_ISSUED_UNIT_ORDER", "EVENT_PLAYER_HERO_LEVEL", "EVENT_PLAYER_HERO_SKILL",
  "EVENT_PLAYER_HERO_REVIVABLE", "EVENT_PLAYER_HERO_REVIVE_START",
  "EVENT_PLAYER_HERO_REVIVE_CANCEL", "EVENT_PLAYER_HERO_REVIVE_FINISH", "EVENT_PLAYER_UNIT_SUMMON",
  "EVENT_PLAYER_UNIT_DROP_ITEM", "EVENT_PLAYER_UNIT_PICKUP_ITEM", "EVENT_PLAYER_UNIT_USE_ITEM",
  "EVENT_PLAYER_UNIT_LOADED", "EVENT_PLAYER_UNIT_DAMAGED", "EVENT_PLAYER_UNIT_DAMAGING",
  "EVENT_PLAYER_UNIT_SELL", "EVENT_PLAYER_UNIT_CHANGE_OWNER", "EVENT_PLAYER_UNIT_SELL_ITEM",
  "EVENT_PLAYER_UNIT_SPELL_CHANNEL", "EVENT_PLAYER_UNIT_SPELL_CAST",
  "EVENT_PLAYER_UNIT_SPELL_EFFECT", "EVENT_PLAYER_UNIT_SPELL_FINISH",
  "EVENT_PLAYER_UNIT_SPELL_ENDCAST", "EVENT_PLAYER_UNIT_PAWN_ITEM", "EVENT_PLAYER_UNIT_STACK_ITEM",
  "EVENT_PLAYER_UNIT_EQUIP_ITEM", "EVENT_PLAYER_UNIT_UNEQUIP_ITEM",
})
constants("unitevent", {
  "EVENT_UNIT_DAMAGED", "EVENT_UNIT_DAMAGING", "EVENT_UNIT_DEATH", "EVENT_UNIT_DECAY",
  "EVENT_UNIT_DETECTED", "EVENT_UNIT_HIDDEN", "EVENT_UNIT_SELECTED", "EVENT_UNIT_DESELECTED",
  "EVENT_UNIT_STATE_LIMIT", "EVENT_UNIT_ACQUIRED_TARGET", "EVENT_UNIT_TARGET_IN_RANGE",
  "EVENT_UNIT_ATTACKED", "EVENT_UNIT_RESCUED", "EVENT_UNIT_CONSTRUCT_CANCEL",
  "EVENT_UNIT_CONSTRUCT_FINISH", "EVENT_UNIT_UPGRADE_START", "EVENT_UNIT_UPGRADE_CANCEL",
  "EVENT_UNIT_UPGRADE_FINISH", "EVENT_UNIT_TRAIN_START", "EVENT_UNIT_TRAIN_CANCEL",
  "EVENT_UNIT_TRAIN_FINISH", "EVENT_UNIT_RESEARCH_START", "EVENT_UNIT_RESEARCH_CANCEL",
  "EVENT_UNIT_RESEARCH_FINISH", "EVENT_UNIT_ISSUED_ORDER", "EVENT_UNIT_ISSUED_POINT_ORDER",
  "EVENT_UNIT_ISSUED_TARGET_ORDER", "EVENT_UNIT_HERO_LEVEL", "EVENT_UNIT_HERO_SKILL",
  "EVENT_UNIT_HERO_REVIVABLE", "EVENT_UNIT_HERO_REVIVE_START", "EVENT_UNIT_HERO_REVIVE_CANCEL",
  "EVENT_UNIT_HERO_REVIVE_FINISH", "EVENT_UNIT_SUMMON", "EVENT_UNIT_DROP_ITEM",
  "EVENT_UNIT_PICKUP_ITEM", "EVENT_UNIT_USE_ITEM", "EVENT_UNIT_LOADED", "EVENT_UNIT_SELL",
  "EVENT_UNIT_CHANGE_OWNER", "EVENT_UNIT_SELL_ITEM", "EVENT_UNIT_SPELL_CHANNEL",
  "EVENT_UNIT_SPELL_CAST", "EVENT_UNIT_SPELL_EFFECT", "EVENT_UNIT_SPELL_FINISH",
  "EVENT_UNIT_SPELL_ENDCAST", "EVENT_UNIT_PAWN_ITEM", "EVENT_UNIT_STACK_ITEM",
  "EVENT_UNIT_EQUIP_ITEM", "EVENT_UNIT_UNEQUIP_ITEM",
})
constants("playerevent", {
  "EVENT_PLAYER_STATE_LIMIT", "EVENT_PLAYER_ALLIANCE_CHANGED", "EVENT_PLAYER_DEFEAT",
  "EVENT_PLAYER_VICTORY", "EVENT_PLAYER_LEAVE", "EVENT_PLAYER_CHAT", "EVENT_PLAYER_END_CINEMATIC",
  "EVENT_PLAYER_ARROW_LEFT_DOWN", "EVENT_PLAYER_ARROW_LEFT_UP", "EVENT_PLAYER_ARROW_RIGHT_DOWN",
  "EVENT_PLAYER_ARROW_RIGHT_UP", "EVENT_PLAYER_ARROW_DOWN_DOWN", "EVENT_PLAYER_ARROW_DOWN_UP",
  "EVENT_PLAYER_ARROW_UP_DOWN", "EVENT_PLAYER_ARROW_UP_UP", "EVENT_PLAYER_MOUSE_DOWN",
  "EVENT_PLAYER_MOUSE_UP", "EVENT_PLAYER_MOUSE_MOVE", "EVENT_PLAYER_SYNC_DATA", "EVENT_PLAYER_KEY",
  "EVENT_PLAYER_KEY_DOWN", "EVENT_PLAYER_KEY_UP",
})
constants("gameevent", {
  "EVENT_GAME_VICTORY", "EVENT_GAME_END_LEVEL", "EVENT_GAME_VARIABLE_LIMIT",
  "EVENT_GAME_STATE_LIMIT", "EVENT_GAME_TIMER_EXPIRED", "EVENT_GAME_ENTER_REGION",
  "EVENT_GAME_LEAVE_REGION", "EVENT_GAME_TRACKABLE_HIT", "EVENT_GAME_TRACKABLE_TRACK",
  "EVENT_GAME_SHOW_SKILL", "EVENT_GAME_BUILD_SUBMENU", "EVENT_GAME_LOADED",
  "EVENT_GAME_TOURNAMENT_FINISH_SOON", "EVENT_GAME_TOURNAMENT_FINISH_NOW", "EVENT_GAME_SAVE",
  "EVENT_GAME_CUSTOM_UI_FRAME",
})
constants("widgetevent", {
  "EVENT_WIDGET_DEATH",
})
constants("dialogevent", {
  "EVENT_DIALOG_BUTTON_CLICK", "EVENT_DIALOG_CLICK",
})
constants("frameeventtype", {
  "FRAMEEVENT_CONTROL_CLICK", "FRAMEEVENT_MOUSE_ENTER", "FRAMEEVENT_MOUSE_LEAVE",
  "FRAMEEVENT_MOUSE_UP", "FRAMEEVENT_MOUSE_DOWN", "FRAMEEVENT_MOUSE_WHEEL",
  "FRAMEEVENT_CHECKBOX_CHECKED", "FRAMEEVENT_CHECKBOX_UNCHECKED", "FRAMEEVENT_EDITBOX_TEXT_CHANGED",
  "FRAMEEVENT_POPUPMENU_ITEM_CHANGED", "FRAMEEVENT_MOUSE_DOUBLECLICK",
  "FRAMEEVENT_SPRITE_ANIM_UPDATE", "FRAMEEVENT_SLIDER_VALUE_CHANGED", "FRAMEEVENT_DIALOG_CANCEL",
  "FRAMEEVENT_DIALOG_ACCEPT", "FRAMEEVENT_EDITBOX_ENTER",
})
constants("limitop", {
  "LESS_THAN", "LESS_THAN_OR_EQUAL", "EQUAL", "GREATER_THAN_OR_EQUAL", "GREATER_THAN", "NOT_EQUAL",
})
constants("igamestate", {
  "GAME_STATE_DIVINE_INTERVENTION", "GAME_STATE_DISCONNECTED",
})
constants("fgamestate", {
  "GAME_STATE_TIME_OF_DAY",
})
constants("playerstate", {
  "PLAYER_STATE_GAME_RESULT", "PLAYER_STATE_RESOURCE_GOLD", "PLAYER_STATE_RESOURCE_LUMBER",
  "PLAYER_STATE_RESOURCE_HERO_TOKENS", "PLAYER_STATE_RESOURCE_FOOD_CAP",
  "PLAYER_STATE_RESOURCE_FOOD_USED", "PLAYER_STATE_FOOD_CAP_CEILING", "PLAYER_STATE_GIVES_BOUNTY",
  "PLAYER_STATE_ALLIED_VICTORY", "PLAYER_STATE_PLACED", "PLAYER_STATE_OBSERVER_ON_DEATH",
  "PLAYER_STATE_OBSERVER", "PLAYER_STATE_UNFOLLOWABLE", "PLAYER_STATE_GOLD_UPKEEP_RATE",
  "PLAYER_STATE_LUMBER_UPKEEP_RATE", "PLAYER_STATE_GOLD_GATHERED", "PLAYER_STATE_LUMBER_GATHERED",
  "PLAYER_STATE_NO_CREEP_SLEEP",
})
constants("unitstate", {
  "UNIT_STATE_LIFE", "UNIT_STATE_MAX_LIFE", "UNIT_STATE_MANA", "UNIT_STATE_MAX_MANA",
})
constants("alliancetype", {
  "ALLIANCE_PASSIVE", "ALLIANCE_HELP_REQUEST", "ALLIANCE_HELP_RESPONSE", "ALLIANCE_SHARED_XP",
  "ALLIANCE_SHARED_SPELLS", "ALLIANCE_SHARED_VISION", "ALLIANCE_SHARED_CONTROL",
  "ALLIANCE_SHARED_ADVANCED_CONTROL", "ALLIANCE_RESCUABLE", "ALLIANCE_SHARED_VISION_FORCED",
})
constants("attacktype", {
  "ATTACK_TYPE_NORMAL", "ATTACK_TYPE_MELEE", "ATTACK_TYPE_PIERCE", "ATTACK_TYPE_SIEGE",
  "ATTACK_TYPE_MAGIC", "ATTACK_TYPE_CHAOS", "ATTACK_TYPE_HERO",
})
constants("damagetype", {
  "DAMAGE_TYPE_UNKNOWN", "DAMAGE_TYPE_NORMAL", "DAMAGE_TYPE_ENHANCED", "DAMAGE_TYPE_FIRE",
  "DAMAGE_TYPE_COLD", "DAMAGE_TYPE_LIGHTNING", "DAMAGE_TYPE_POISON", "DAMAGE_TYPE_DISEASE",
  "DAMAGE_TYPE_DIVINE", "DAMAGE_TYPE_MAGIC", "DAMAGE_TYPE_SONIC", "DAMAGE_TYPE_ACID",
  "DAMAGE_TYPE_FORCE", "DAMAGE_TYPE_DEATH", "DAMAGE_TYPE_MIND", "DAMAGE_TYPE_PLANT",
  "DAMAGE_TYPE_DEFENSIVE", "DAMAGE_TYPE_DEMOLITION", "DAMAGE_TYPE_SLOW_POISON",
  "DAMAGE_TYPE_SPIRIT_LINK", "DAMAGE_TYPE_SHADOW_STRIKE", "DAMAGE_TYPE_UNIVERSAL",
})
constants("weapontype", {
  "WEAPON_TYPE_WHOKNOWS", "WEAPON_TYPE_METAL_LIGHT_CHOP", "WEAPON_TYPE_METAL_MEDIUM_CHOP",
  "WEAPON_TYPE_METAL_HEAVY_CHOP", "WEAPON_TYPE_METAL_LIGHT_SLICE", "WEAPON_TYPE_METAL_MEDIUM_SLICE",
  "WEAPON_TYPE_METAL_HEAVY_SLICE", "WEAPON_TYPE_METAL_MEDIUM_BASH", "WEAPON_TYPE_METAL_HEAVY_BASH",
  "WEAPON_TYPE_METAL_MEDIUM_STAB", "WEAPON_TYPE_METAL_HEAVY_STAB", "WEAPON_TYPE_WOOD_LIGHT_SLICE",
  "WEAPON_TYPE_WOOD_MEDIUM_SLICE", "WEAPON_TYPE_WOOD_HEAVY_SLICE", "WEAPON_TYPE_WOOD_LIGHT_BASH",
  "WEAPON_TYPE_WOOD_MEDIUM_BASH", "WEAPON_TYPE_WOOD_HEAVY_BASH", "WEAPON_TYPE_WOOD_LIGHT_STAB",
  "WEAPON_TYPE_WOOD_MEDIUM_STAB", "WEAPON_TYPE_CLAW_LIGHT_SLICE", "WEAPON_TYPE_CLAW_MEDIUM_SLICE",
  "WEAPON_TYPE_CLAW_HEAVY_SLICE", "WEAPON_TYPE_AXE_MEDIUM_CHOP", "WEAPON_TYPE_ROCK_HEAVY_BASH",
})
constants("oskeytype", {
  "OSKEY_BACKSPACE", "OSKEY_TAB", "OSKEY_CLEAR", "OSKEY_RETURN", "OSKEY_SHIFT", "OSKEY_CONTROL",
  "OSKEY_ALT", "OSKEY_PAUSE", "OSKEY_CAPSLOCK", "OSKEY_KANA", "OSKEY_HANGUL", "OSKEY_JUNJA",
  "OSKEY_FINAL", "OSKEY_HANJA", "OSKEY_KANJI", "OSKEY_ESCAPE", "OSKEY_CONVERT", "OSKEY_NONCONVERT",
  "OSKEY_ACCEPT", "OSKEY_MODECHANGE", "OSKEY_SPACE", "OSKEY_PAGEUP", "OSKEY_PAGEDOWN", "OSKEY_END",
  "OSKEY_HOME", "OSKEY_LEFT", "OSKEY_UP", "OSKEY_RIGHT", "OSKEY_DOWN", "OSKEY_SELECT",
  "OSKEY_PRINT", "OSKEY_EXECUTE", "OSKEY_PRINTSCREEN", "OSKEY_INSERT", "OSKEY_DELETE", "OSKEY_HELP",
  "OSKEY_0", "OSKEY_1", "OSKEY_2", "OSKEY_3", "OSKEY_4", "OSKEY_5", "OSKEY_6", "OSKEY_7", "OSKEY_8",
  "OSKEY_9", "OSKEY_A", "OSKEY_B", "OSKEY_C", "OSKEY_D", "OSKEY_E", "OSKEY_F", "OSKEY_G", "OSKEY_H",
  "OSKEY_I", "OSKEY_J", "OSKEY_K", "OSKEY_L", "OSKEY_M", "OSKEY_N", "OSKEY_O", "OSKEY_P", "OSKEY_Q",
  "OSKEY_R", "OSKEY_S", "OSKEY_T", "OSKEY_U", "OSKEY_V", "OSKEY_W", "OSKEY_X", "OSKEY_Y", "OSKEY_Z",
  "OSKEY_LMETA", "OSKEY_RMETA", "OSKEY_APPS", "OSKEY_SLEEP", "OSKEY_NUMPAD0", "OSKEY_NUMPAD1",
  "OSKEY_NUMPAD2", "OSKEY_NUMPAD3", "OSKEY_NUMPAD4", "OSKEY_NUMPAD5", "OSKEY_NUMPAD6",
  "OSKEY_NUMPAD7", "OSKEY_NUMPAD8", "OSKEY_NUMPAD9", "OSKEY_MULTIPLY", "OSKEY_ADD",
  "OSKEY_SEPARATOR", "OSKEY_SUBTRACT", "OSKEY_DECIMAL", "OSKEY_DIVIDE", "OSKEY_F1", "OSKEY_F2",
  "OSKEY_F3", "OSKEY_F4", "OSKEY_F5", "OSKEY_F6", "OSKEY_F7", "OSKEY_F8", "OSKEY_F9", "OSKEY_F10",
  "OSKEY_F11", "OSKEY_F12", "OSKEY_F13", "OSKEY_F14", "OSKEY_F15", "OSKEY_F16", "OSKEY_F17",
  "OSKEY_F18", "OSKEY_F19", "OSKEY_F20", "OSKEY_F21", "OSKEY_F22", "OSKEY_F23", "OSKEY_F24",
  "OSKEY_NUMLOCK", "OSKEY_SCROLLLOCK", "OSKEY_OEM_NEC_EQUAL", "OSKEY_OEM_FJ_JISHO",
  "OSKEY_OEM_FJ_MASSHOU", "OSKEY_OEM_FJ_TOUROKU", "OSKEY_OEM_FJ_LOYA", "OSKEY_OEM_FJ_ROYA",
  "OSKEY_LSHIFT", "OSKEY_RSHIFT", "OSKEY_LCONTROL", "OSKEY_RCONTROL", "OSKEY_LALT", "OSKEY_RALT",
  "OSKEY_BROWSER_BACK", "OSKEY_BROWSER_FORWARD", "OSKEY_BROWSER_REFRESH", "OSKEY_BROWSER_STOP",
  "OSKEY_BROWSER_SEARCH", "OSKEY_BROWSER_FAVORITES", "OSKEY_BROWSER_HOME", "OSKEY_VOLUME_MUTE",
  "OSKEY_VOLUME_DOWN", "OSKEY_VOLUME_UP", "OSKEY_MEDIA_NEXT_TRACK", "OSKEY_MEDIA_PREV_TRACK",
  "OSKEY_MEDIA_STOP", "OSKEY_MEDIA_PLAY_PAUSE", "OSKEY_LAUNCH_MAIL", "OSKEY_LAUNCH_MEDIA_SELECT",
  "OSKEY_LAUNCH_APP1", "OSKEY_LAUNCH_APP2", "OSKEY_OEM_1", "OSKEY_OEM_PLUS", "OSKEY_OEM_COMMA",
  "OSKEY_OEM_MINUS", "OSKEY_OEM_PERIOD", "OSKEY_OEM_2", "OSKEY_OEM_3", "OSKEY_OEM_4", "OSKEY_OEM_5",
  "OSKEY_OEM_6", "OSKEY_OEM_7", "OSKEY_OEM_8", "OSKEY_OEM_AX", "OSKEY_OEM_102", "OSKEY_ICO_HELP",
  "OSKEY_ICO_00", "OSKEY_PROCESSKEY", "OSKEY_ICO_CLEAR", "OSKEY_PACKET", "OSKEY_OEM_RESET",
  "OSKEY_OEM_JUMP", "OSKEY_OEM_PA1", "OSKEY_OEM_PA2", "OSKEY_OEM_PA3", "OSKEY_OEM_WSCTRL",
  "OSKEY_OEM_CUSEL", "OSKEY_OEM_ATTN", "OSKEY_OEM_FINISH", "OSKEY_OEM_COPY", "OSKEY_OEM_AUTO",
  "OSKEY_OEM_ENLW", "OSKEY_OEM_BACKTAB", "OSKEY_ATTN", "OSKEY_CRSEL", "OSKEY_EXSEL", "OSKEY_EREOF",
  "OSKEY_PLAY", "OSKEY_ZOOM", "OSKEY_NONAME", "OSKEY_PA1", "OSKEY_OEM_CLEAR",
})

-- Every TriggerRegister* Native of the Patch, with its parameters after the
-- trigger. Each records the trigger and exactly those arguments (an omitted
-- filter as nil) and returns a new event handle; the trigger keeps nothing
-- of it, so which event fires is the test's decision.
local registrations = {
  { "TriggerRegisterVariableEvent", "varName", "opcode", "limitval" },
  { "TriggerRegisterTimerEvent", "timeout", "periodic" },
  { "TriggerRegisterTimerExpireEvent", "t" },
  { "TriggerRegisterGameStateEvent", "whichState", "opcode", "limitval" },
  { "TriggerRegisterDialogEvent", "whichDialog" },
  { "TriggerRegisterDialogButtonEvent", "whichButton" },
  { "TriggerRegisterGameEvent", "whichGameEvent" },
  { "TriggerRegisterEnterRegion", "whichRegion", "filter" },
  { "TriggerRegisterLeaveRegion", "whichRegion", "filter" },
  { "TriggerRegisterTrackableHitEvent", "t" },
  { "TriggerRegisterTrackableTrackEvent", "t" },
  { "TriggerRegisterCommandEvent", "whichAbility", "order" },
  { "TriggerRegisterUpgradeCommandEvent", "whichUpgrade" },
  { "TriggerRegisterPlayerEvent", "whichPlayer", "whichPlayerEvent" },
  { "TriggerRegisterPlayerUnitEvent", "whichPlayer", "whichPlayerUnitEvent", "filter" },
  { "TriggerRegisterPlayerAllianceChange", "whichPlayer", "whichAlliance" },
  { "TriggerRegisterPlayerStateEvent", "whichPlayer", "whichState", "opcode", "limitval" },
  { "TriggerRegisterPlayerChatEvent", "whichPlayer", "chatMessageToDetect", "exactMatchOnly" },
  { "TriggerRegisterDeathEvent", "whichWidget" },
  { "TriggerRegisterUnitStateEvent", "whichUnit", "whichState", "opcode", "limitval" },
  { "TriggerRegisterUnitEvent", "whichUnit", "whichEvent" },
  { "TriggerRegisterFilterUnitEvent", "whichUnit", "whichEvent", "filter" },
  { "TriggerRegisterUnitInRange", "whichUnit", "range", "filter" },
  { "BlzTriggerRegisterFrameEvent", "frame", "eventId" },
  { "BlzTriggerRegisterPlayerSyncEvent", "whichPlayer", "prefix", "fromServer" },
  { "BlzTriggerRegisterPlayerKeyEvent", "whichPlayer", "key", "metaKey", "keyDown" },
}

for _, registration in ipairs(registrations) do
  local name, arity = registration[1], #registration - 1
  _G[name] = function(whichTrigger, ...)
    __stub_record(name, whichTrigger, table.unpack({ ... }, 1, arity))
    return __stub_new_handle("event")
  end
end

-- The exception: a sync registration also keeps its trigger, player and
-- prefix, in registration order, because a delivery must find the triggers
-- the game would fire for a packet. Its call-log line and event handle are
-- the ones every registration has.
local syncRegistrations = {}
local registerSync = BlzTriggerRegisterPlayerSyncEvent

function BlzTriggerRegisterPlayerSyncEvent(whichTrigger, whichPlayer, prefix, fromServer)
  local event = registerSync(whichTrigger, whichPlayer, prefix, fromServer)
  syncRegistrations[#syncRegistrations + 1] = {
    trigger = whichTrigger,
    player = whichPlayer,
    prefix = prefix,
  }
  return event
end

-- The event response Natives, answering from the firing context: nil outside
-- a firing and for a name the context leaves out. GetExpiredTimer is in
-- timers.lua and GetTriggeringTrackable in trackables.lua.
local responses = {
  -- the trigger and the event
  "GetTriggeringTrigger", "GetTriggerEventId", "GetTriggerWidget", "GetTriggerDestructable",
  -- units
  "GetTriggerUnit", "GetKillingUnit", "GetAttacker",
  "GetEventDamageSource", "BlzGetEventDamageTarget", "GetEventDamage",
  "BlzGetEventAttackType", "BlzGetEventDamageType", "BlzGetEventWeaponType", "BlzGetEventIsAttack",
  "GetSpellAbilityUnit", "GetSpellAbilityId", "GetSpellTargetUnit", "GetSpellTargetItem",
  "GetSpellTargetDestructable", "GetSpellTargetX", "GetSpellTargetY",
  "GetOrderedUnit", "GetIssuedOrderId", "GetOrderPointX", "GetOrderPointY",
  "GetOrderTargetUnit", "GetOrderTarget",
  "GetManipulatedItem", "GetEquippedItem", "GetUnequippedItem", "GetSoldItem",
  "GetTrainedUnit", "GetConstructedStructure", "GetResearched", "GetLevelingUnit", "GetLearnedSkill",
  "GetChangingUnit", "GetChangingUnitPrevOwner", "GetSummoningUnit", "GetSummonedUnit",
  "GetTransportUnit", "GetLoadedUnit",
  -- players
  "GetTriggerPlayer", "GetEventPlayerChatString", "GetEventPlayerChatStringMatched",
  "BlzGetTriggerPlayerKey", "BlzGetTriggerPlayerMetaKey", "BlzGetTriggerPlayerIsKeyDown",
  "BlzGetTriggerPlayerMouseX", "BlzGetTriggerPlayerMouseY",
  "BlzGetTriggerSyncPrefix", "BlzGetTriggerSyncData",
  -- dialogs, frames and regions
  "GetClickedDialog", "GetClickedButton",
  "BlzGetTriggerFrame", "BlzGetTriggerFrameEvent", "BlzGetTriggerFrameValue", "BlzGetTriggerFrameText",
  "GetTriggeringRegion", "GetEnteringUnit", "GetLeavingUnit",
}

for i = 1, #responses do
  __stub_response(responses[i])
end

-- Condition and Filter record their call and return a new boolexpr handle
-- (of kind conditionfunc or filterfunc) that remembers its function, so the
-- conditions of a trigger can run it.
function Condition(func)
  __stub_record("Condition", func)
  local expr = __stub_new_handle("conditionfunc")
  expr.func = func
  return expr
end

function Filter(func)
  __stub_record("Filter", func)
  local expr = __stub_new_handle("filterfunc")
  expr.func = func
  return expr
end

-- A trigger's actions and conditions are lists of { handle, value } entries,
-- in the order they were added.
local function append(whichTrigger, key, handle, value)
  local entries = whichTrigger[key]
  if entries == nil then
    entries = {}
    whichTrigger[key] = entries
  end
  entries[#entries + 1] = { handle = handle, value = value }
end

local function remove(whichTrigger, key, handle)
  local entries = whichTrigger[key] or {}
  for i = 1, #entries do
    if rawequal(entries[i].handle, handle) then
      table.remove(entries, i)
      return
    end
  end
end

-- A copy of the entries, so an action or a condition that adds or removes
-- some while the trigger runs leaves the running pass alone.
local function snapshot(whichTrigger, key)
  local entries = whichTrigger[key] or {}
  return table.move(entries, 1, #entries, 1, {})
end

-- Runs every condition, in added order and without short-circuit, and
-- returns their conjunction (true for no condition).
local function evaluate(whichTrigger)
  local passed = true
  for _, condition in ipairs(snapshot(whichTrigger, "conditions")) do
    local func = condition.value.func
    if func == nil then
      error(__stub_format(condition.value) .. " was not created by Condition or Filter", 0)
    end
    if not func() then
      passed = false
    end
  end
  return passed
end

local function execute(whichTrigger)
  for _, action in ipairs(snapshot(whichTrigger, "actions")) do
    action.value()
  end
end

function TriggerAddAction(whichTrigger, actionFunc)
  __stub_record("TriggerAddAction", whichTrigger, actionFunc)
  local action = __stub_new_handle("triggeraction")
  append(whichTrigger, "actions", action, actionFunc)
  return action
end

function TriggerRemoveAction(whichTrigger, whichAction)
  __stub_record("TriggerRemoveAction", whichTrigger, whichAction)
  remove(whichTrigger, "actions", whichAction)
end

function TriggerClearActions(whichTrigger)
  __stub_record("TriggerClearActions", whichTrigger)
  whichTrigger.actions = nil
end

function TriggerAddCondition(whichTrigger, condition)
  __stub_record("TriggerAddCondition", whichTrigger, condition)
  local handle = __stub_new_handle("triggercondition")
  append(whichTrigger, "conditions", handle, condition)
  return handle
end

function TriggerRemoveCondition(whichTrigger, whichCondition)
  __stub_record("TriggerRemoveCondition", whichTrigger, whichCondition)
  remove(whichTrigger, "conditions", whichCondition)
end

function TriggerClearConditions(whichTrigger)
  __stub_record("TriggerClearConditions", whichTrigger)
  whichTrigger.conditions = nil
end

-- Runs the conditions at once, in the current context, as the game does.
function TriggerEvaluate(whichTrigger)
  __stub_record("TriggerEvaluate", whichTrigger)
  return evaluate(whichTrigger)
end

-- Runs the actions at once, in the current context and without the
-- conditions, as the game does. The stubs have no sleeps, so the waiting
-- variant runs the same way.
function TriggerExecute(whichTrigger)
  __stub_record("TriggerExecute", whichTrigger)
  execute(whichTrigger)
end

function TriggerExecuteWait(whichTrigger)
  __stub_record("TriggerExecuteWait", whichTrigger)
  execute(whichTrigger)
end

-- A trigger is enabled until DisableTrigger; a disabled one does not fire.
function EnableTrigger(whichTrigger)
  __stub_record("EnableTrigger", whichTrigger)
  whichTrigger.disabled = nil
end

function DisableTrigger(whichTrigger)
  __stub_record("DisableTrigger", whichTrigger)
  whichTrigger.disabled = true
end

function IsTriggerEnabled(whichTrigger)
  __stub_record("IsTriggerEnabled", whichTrigger)
  return not whichTrigger.disabled
end

function TriggerWaitOnSleeps(whichTrigger, flag)
  __stub_record("TriggerWaitOnSleeps", whichTrigger, flag)
  whichTrigger.waitOnSleeps = flag
end

function IsTriggerWaitOnSleeps(whichTrigger)
  __stub_record("IsTriggerWaitOnSleeps", whichTrigger)
  return whichTrigger.waitOnSleeps == true
end

-- The stubs count nothing: both counts are 0, and a reset changes nothing.
function GetTriggerEvalCount(whichTrigger)
  __stub_record("GetTriggerEvalCount", whichTrigger)
  return 0
end

function GetTriggerExecCount(whichTrigger)
  __stub_record("GetTriggerExecCount", whichTrigger)
  return 0
end

function ResetTrigger(whichTrigger)
  __stub_record("ResetTrigger", whichTrigger)
end

function DestroyTrigger(whichTrigger)
  __stub_record("DestroyTrigger", whichTrigger)
  whichTrigger.destroyed = true
end

-- Fires the trigger as one event would, with `context` (optional: a table
-- keyed by response Native name) as the firing context. The conditions run
-- first, every one, in added order; the actions run, in added order, only if
-- every condition returned true. Returns whether the actions ran. A disabled
-- trigger does not fire; firing a destroyed one is an error. Not a Native,
-- so it adds no call-log line.
function __stub_fire_trigger(whichTrigger, context)
  if whichTrigger.destroyed then
    error("__stub_fire_trigger: " .. __stub_format(whichTrigger) .. " was destroyed", 2)
  end
  if whichTrigger.disabled then
    return false
  end
  return __stub_with_context(context or {}, function()
    if not evaluate(whichTrigger) then
      return false
    end
    execute(whichTrigger)
    return true
  end)
end

-- Delivers a sync packet as the game would: fires every trigger registered
-- for the packet's prefix and sender, once per registration, in registration
-- order, skipping a disabled or destroyed one. `packet` is { prefix, data,
-- from }, a recorded one (__stub_sync_packets) or one the test built, which
-- is how a foreign packet is simulated. The firing context answers
-- BlzGetTriggerSyncPrefix, BlzGetTriggerSyncData, GetTriggerPlayer and
-- GetTriggeringTrigger. With `options.cString`, the data is cut at its first
-- zero byte, as the game cuts a C string. Returns how many triggers ran their
-- actions. Not a Native, so it adds no call-log line.
function __stub_deliver_sync(packet, options)
  local data = packet.data
  if options ~= nil and options.cString then
    local zero = string.find(data, "\0", 1, true)
    if zero ~= nil then
      data = string.sub(data, 1, zero - 1)
    end
  end
  local fired = 0
  for _, registration in ipairs(table.move(syncRegistrations, 1, #syncRegistrations, 1, {})) do
    local whichTrigger = registration.trigger
    if registration.prefix == packet.prefix
      and rawequal(registration.player, packet.from)
      and not whichTrigger.destroyed
    then
      local ran = __stub_fire_trigger(whichTrigger, {
        BlzGetTriggerSyncPrefix = packet.prefix,
        BlzGetTriggerSyncData = data,
        GetTriggerPlayer = packet.from,
        GetTriggeringTrigger = whichTrigger,
      })
      if ran then
        fired = fired + 1
      end
    end
  end
  return fired
end
