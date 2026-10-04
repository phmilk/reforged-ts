// The fixture common.j of the Nullability sweep's tests: three converters,
// one of whose types has no constant.
type race extends handle
type mousebuttontype extends handle
type abilityintegerlevelarrayfield extends handle

constant native ConvertRace takes integer i returns race
constant native ConvertMouseButtonType takes integer i returns mousebuttontype
constant native ConvertAbilityIntegerLevelArrayField takes integer i returns abilityintegerlevelarrayfield

globals
    constant race RACE_NONE = ConvertRace(0)
    constant race RACE_HUMAN = ConvertRace(1)
    constant race RACE_ORC = ConvertRace(2)
    constant race RACE_GREEN = ConvertRace(2)
    constant mousebuttontype MOUSE_BUTTON_TYPE_LEFT = ConvertMouseButtonType(1)
    constant mousebuttontype MOUSE_BUTTON_TYPE_MIDDLE = ConvertMouseButtonType(2)
    constant mousebuttontype MOUSE_BUTTON_TYPE_RIGHT = ConvertMouseButtonType(3)
endglobals
