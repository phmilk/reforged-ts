// Compiled with typescript-to-lua for Lua 5.3. This file carries no self
// directive: the callbacks and the calls to Natives below lose `self` through
// the Typings alone. Function expressions rather than arrows, because
// typescript-to-lua never gives an arrow function a `self` parameter.
const ticker = CreateTimer();
TimerStart(ticker, 0.03, true, function () {
  PauseTimer(ticker);
});

const nearby = CreateGroup();
if (nearby !== undefined) {
  GroupEnumUnitsInRange(
    nearby,
    0,
    0,
    256,
    Filter(function () {
      return GetFilterUnit() !== undefined;
    }),
  );
}

// Control: declared here, without `this: void` and without a self directive,
// so the call passes a context and the callback takes `self`.
declare function registerLocal(callback: () => void): void;
registerLocal(function () {
  DestroyTimer(ticker);
});

export {};
