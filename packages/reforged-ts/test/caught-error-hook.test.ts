/** @noSelfInFile */

// The Caught error hook (ADR 0028): the three places that catch an error of
// a Map project's callback (an Init queue, a protected callback, Dev mode's
// `runLocal`) call the global `__reforged_caught_error(origin, message)`
// when it is defined, on every failure, the counted repeats included; what
// they print stays the same, and with the global absent nothing changes.
//
// The file's tests share one Lua state; each defines the global for the
// length of its body only, through `caughtBy`.

import { describe, expect, it } from "reforged-test/lua";
import { runQueue } from "../src/init/queue";
import { MapPlayer, Reforged } from "../src/index";
import { protect } from "../src/reforged/protect";
import { defined } from "./support/defined";
import { globals } from "./support/editor-script";

// Dev mode raises for a Wrapper created before the globals Init stage.
__stub_init_globals();

const local = defined(MapPlayer.fromIndex(0), "MapPlayer.fromIndex(0)");
__stub_set_local_player(0);

/** One call of the hook: its two arguments. */
interface Caught {
  readonly origin: string;
  readonly message: string;
}

/** What a piece of code printed, showed on screen and passed to the hook. */
interface Seen {
  readonly printed: string[];
  readonly displayed: number;
  readonly caught: Caught[];
}

/**
 * Runs `body` with `__reforged_caught_error` defined, when `hooked`, and
 * returns what it printed and what the hook received; the global is absent
 * again afterwards, also when `body` throws.
 */
function caughtBy(body: () => void, hooked = true): Seen {
  const caught: Caught[] = [];
  const printed = __stub_printed().length;
  const displayed = __stub_displayed().length;
  if (hooked) {
    globals.__reforged_caught_error = (origin: string, message: string) => {
      caught.push({ origin, message });
    };
  }
  try {
    body();
  } finally {
    globals.__reforged_caught_error = undefined;
  }
  return {
    printed: __stub_printed().slice(printed),
    displayed: __stub_displayed().length - displayed,
    caught,
  };
}

/** Runs an Init queue whose one callback, `"spawn"`, fails. */
function failingQueue(): void {
  runQueue("globals", [
    {
      callback: () => {
        error("queue failure", 0);
      },
      name: '"spawn"',
    },
  ]);
}

/** A protected callback that fails, registered in Dev mode. */
function failingProtected(): () => void {
  Reforged.configure({ devMode: true });
  return protect(undefined, "Test.member", () => {
    error("protected failure", 0);
  });
}

describe("the Caught error hook", () => {
  it("hears an Init queue's failure, each time, and the line printed stays", () => {
    const seen = caughtBy(() => {
      failingQueue();
      failingQueue();
    });
    expect(seen.caught).toEqual([
      { origin: 'globals callback "spawn"', message: "queue failure" },
      { origin: 'globals callback "spawn"', message: "queue failure" },
    ]);
    expect(seen.printed).toEqual([
      'reforged-ts: globals callback "spawn" failed: queue failure',
      'reforged-ts: globals callback "spawn" failed: queue failure',
    ]);
    expect(seen.displayed).toEqual(0);
  });

  it("hears a protected callback's failure, its counted repeats included", () => {
    const callback = failingProtected();
    const seen = caughtBy(() => {
      callback();
      callback();
      callback();
    });
    const once = { origin: "Test.member", message: "protected failure" };
    expect(seen.caught).toEqual([once, once, once]);
    expect(seen.printed).toEqual([
      "reforged-ts: Test.member failed: protected failure",
    ]);
    expect(seen.displayed).toEqual(1);
  });

  it("hears a runLocal function's failure, its counted repeats included", () => {
    Reforged.configure({ devMode: true });
    const fn = () => {
      error("local failure", 0);
    };
    const seen = caughtBy(() => {
      MapPlayer.runLocal(local, fn);
      MapPlayer.runLocal(local, fn);
    });
    const origin = `MapPlayer#${String(local.id)} MapPlayer.runLocal`;
    const once = { origin, message: "local failure" };
    expect(seen.caught).toEqual([once, once]);
    expect(seen.printed).toEqual([
      `reforged-ts: ${origin} failed: local failure`,
    ]);
  });

  it("changes nothing when the global is absent", () => {
    const callback = failingProtected();
    const fn = () => {
      error("unheard local failure", 0);
    };
    const seen = caughtBy(() => {
      failingQueue();
      callback();
      callback();
      MapPlayer.runLocal(local, fn);
    }, false);
    expect(seen.caught).toEqual([]);
    expect(seen.printed).toEqual([
      'reforged-ts: globals callback "spawn" failed: queue failure',
      "reforged-ts: Test.member failed: protected failure",
      `reforged-ts: MapPlayer#${String(local.id)} MapPlayer.runLocal failed: unheard local failure`,
    ]);
    expect(seen.displayed).toEqual(2);
  });

  it("reads the global raw: a map's undeclared-global warner never sees the lookup", () => {
    const callback = failingProtected();
    const previous = getmetatable(_G);
    // A warner that raises, unlike the logging one of
    // support/header-position-with-metatable.ts: a lookup would escape the
    // failure, and `looked` counts it besides.
    let looked = 0;
    setmetatable(_G, {
      __index: () => {
        looked++;
        error("undeclared global", 0);
      },
    });
    let seen: Seen;
    try {
      seen = caughtBy(() => {
        failingQueue();
        callback();
      }, false);
    } finally {
      setmetatable(_G, previous);
    }
    expect(looked).toEqual(0);
    expect(seen.printed).toEqual([
      'reforged-ts: globals callback "spawn" failed: queue failure',
      "reforged-ts: Test.member failed: protected failure",
    ]);
  });
});
