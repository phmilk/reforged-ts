// Positive: calls with the right handle types, a trailing nullable parameter
// left out, a boolean predicate passed to Filter, bj_ arrays indexed by number.
const owner: player = GetLocalPlayer();
const footman = CreateUnit(owner, FourCC("hfoo"), 0, 0, 270);
if (footman !== undefined) {
  SetUnitPosition(footman, GetUnitX(footman) + 128, -64);
}

const countdown: timer = CreateTimer();
TimerStart(countdown, 1.5, false, () => {
  DestroyTimer(countdown);
});

const nearby = CreateGroup();
if (nearby !== undefined) {
  GroupEnumUnitsInRange(nearby, 0, 0, 512);
  GroupEnumUnitsInRange(nearby, 0, 0, 512, Filter(() => GetFilterUnit() !== undefined));
  DestroyGroup(nearby);
}

const firstForce: force | undefined = bj_FORCE_PLAYER[0];
const slotUsed: boolean = bj_slotControlUsed[1];

export { firstForce, slotUsed };
