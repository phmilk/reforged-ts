/** @noSelfInFile */

// The firing helpers of the reforged-test stubs that the tests call. They are
// Lua globals the shipped stub files define, not Natives, so the Typings do
// not declare them.

/** Runs the handler `TimerStart` stored for this timer, once. */
declare function __stub_fire_timer(whichTimer: timer): void;
