/** @noSelfInFile */

// MapPlayer on the Handle base: players are not created, so every factory is
// a lookup, except `fromLocal`, the documented non-null path (the Native
// never returns nothing, and the member throws should it ever do).

// Keep this import ahead of the library's: the library wraps the entry
// points when it loads, and this file defines them.
import "./support/bundle-position";
import { describe, expect, it, stubCalls } from "reforged-test/lua";
import { MapPlayer, Point, Rectangle, tsGlobals } from "../src/index";
import { defined } from "./support/defined";
import { handleRef } from "./support/handle-ref";
import { describeNatives, nativeCase } from "./support/native-cases";
import { withNative } from "./support/native-override";
import { raisedIn } from "./support/raised-in";

declare const InitGlobals: () => void;

// `Players` is filled at the `globals` stage: run it, as `main` would.
InitGlobals();

/** A Map project's own player model, extending the library's Wrapper. */
class Contestant extends MapPlayer {
  public score = 0;
}

describe("MapPlayer.fromIndex", () => {
  it("is the object the Players global holds for the slot", () => {
    const player = MapPlayer.fromIndex(3);
    expect(player).toBe(tsGlobals.Players[3]);
    expect(player?.handle).toBe(Player(3));
  });

  it("is undefined for a slot Player returns nil for", () => {
    expect(
      withNative(
        "Player",
        () => undefined,
        () => MapPlayer.fromIndex(99),
      ),
    ).toBeUndefined();
  });
});

describe("MapPlayer.fromLocal", () => {
  it("is the player of slot 0 in the stubs, the Players entry", () => {
    const local = MapPlayer.fromLocal();
    expect(local).toBe(tsGlobals.Players[0]);
    expect(local.handle).toBe(GetLocalPlayer());
  });

  it("throws when GetLocalPlayer returns nil, never returning undefined", () => {
    const message = withNative(
      "GetLocalPlayer",
      () => undefined,
      () =>
        raisedIn(() => {
          MapPlayer.fromLocal();
        }),
    );
    expect(message).toEqual("reforged-ts: failed to create MapPlayer");
  });
});

describe("MapPlayer event and enumeration lookups", () => {
  it("are undefined when their Native returns nil", () => {
    expect(
      withNative(
        "GetTriggerPlayer",
        () => undefined,
        () => MapPlayer.fromEvent(),
      ),
    ).toBeUndefined();
    expect(
      withNative(
        "GetEnumPlayer",
        () => undefined,
        () => MapPlayer.fromEnum(),
      ),
    ).toBeUndefined();
    expect(
      withNative(
        "GetFilterPlayer",
        () => undefined,
        () => MapPlayer.fromFilter(),
      ),
    ).toBeUndefined();
  });

  it("are the Players entry for the player their Native returns", () => {
    const handle = defined(Player(4), "Player(4)");
    const expected = tsGlobals.Players[4];
    expect(
      withNative(
        "GetTriggerPlayer",
        () => handle,
        () => MapPlayer.fromEvent(),
      ),
    ).toBe(expected);
    expect(
      withNative(
        "GetEnumPlayer",
        () => handle,
        () => MapPlayer.fromEnum(),
      ),
    ).toBe(expected);
    expect(
      withNative(
        "GetFilterPlayer",
        () => handle,
        () => MapPlayer.fromFilter(),
      ),
    ).toBe(expected);
  });
});

describe("a Map project subclass of MapPlayer", () => {
  it("gets its own instances from the inherited lookups", () => {
    const handle = defined(Player(7), "Player(7)");
    const contestant = defined(
      Contestant.fromHandle(handle),
      "Contestant.fromHandle",
    );
    expect(contestant instanceof Contestant).toEqual(true);
    expect(contestant.score).toEqual(0);
    expect(contestant.handle).toBe(handle);
    expect(contestant.id).toEqual(7);
    expect(Contestant.fromIndex(7)).toBe(contestant);
    expect(Contestant.fromIndex(6) instanceof Contestant).toEqual(true);
  });

  it("replaces the MapPlayer the Players global holds, as the upgrade rule says", () => {
    const contestant = Contestant.fromHandle(Player(8));
    expect(MapPlayer.fromIndex(8)).toBe(contestant);
    expect(tsGlobals.Players[8] === contestant).toEqual(false);
    expect(tsGlobals.Players[8]?.handle).toBe(defined(Player(8), "Player(8)"));
  });
});

describe("MapPlayer.setRaceSkin", () => {
  it("passes the race preference to SetPlayerRaceSkin", () => {
    const player = defined(MapPlayer.fromIndex(2), "MapPlayer.fromIndex(2)");
    withNative(
      "SetPlayerRaceSkin",
      () => undefined,
      () => {
        player.setRaceSkin(RACE_PREF_FORSAKEN);
      },
    );
    expect(stubCalls()).toContainCall(
      `SetPlayerRaceSkin(${handleRef("player", player.handle)}, RACE_PREF_FORSAKEN)`,
    );
  });
});

// The player-first Natives #173 closed, one case each.
{
  const player = defined(MapPlayer.fromIndex(2), "MapPlayer.fromIndex(2)");
  const ref = handleRef("player", player.handle);
  const other = defined(Player(4), "Player(4)");
  const otherPlayer = tsGlobals.Players[4];
  const masked = defined(ConvertFogState(2), "ConvertFogState(2)");
  const maskedRef = handleRef("fogstate", masked);
  const where = Rectangle.create(0, 0, 256, 256);
  const whereRef = handleRef("rect", where.handle);
  const center = Point.create(64, -32);
  const centerRef = handleRef("location", center.handle);
  // The harness defines no aidifficulty constant: a sentinel the call log
  // renders by name, as it renders the game's constants.
  const insane = {
    __name: "AI_DIFFICULTY_INSANE",
  } as unknown as aidifficulty;

  describeNatives("MapPlayer members", [
    nativeCase({
      native: "SetPlayerTeam",
      answer: () => undefined,
      member: () => {
        player.team = 3;
      },
      line: `SetPlayerTeam(${ref}, 3)`,
    }),
    nativeCase({
      native: "SetPlayerStartLocation",
      answer: () => undefined,
      member: () => {
        player.startLocation = 5;
      },
      line: `SetPlayerStartLocation(${ref}, 5)`,
    }),
    nativeCase({
      native: "ForcePlayerStartLocation",
      answer: () => undefined,
      member: () => {
        player.forceStartLocation(6);
      },
      line: `ForcePlayerStartLocation(${ref}, 6)`,
    }),
    nativeCase({
      native: "SetPlayerRacePreference",
      answer: () => undefined,
      member: () => {
        player.setRacePreference(RACE_PREF_ORC);
      },
      line: `SetPlayerRacePreference(${ref}, RACE_PREF_ORC)`,
    }),
    nativeCase({
      native: "SetPlayerRaceSelectable",
      answer: () => undefined,
      member: () => {
        player.setRaceSelectable(false);
      },
      line: `SetPlayerRaceSelectable(${ref}, false)`,
    }),
    nativeCase({
      native: "SetPlayerController",
      answer: () => undefined,
      member: () => {
        player.controller = MAP_CONTROL_COMPUTER;
      },
      line: `SetPlayerController(${ref}, MAP_CONTROL_COMPUTER)`,
    }),
    nativeCase({
      native: "GetTournamentScore",
      answer: () => 1200,
      member: () => player.tournamentScore,
      line: `GetTournamentScore(${ref})`,
      returns: 1200,
    }),
    nativeCase({
      native: "GetPlayerHandicapReviveTime",
      answer: () => 0.5,
      member: () => player.handicapReviveTime,
      line: `GetPlayerHandicapReviveTime(${ref})`,
      returns: 0.5,
    }),
    nativeCase({
      native: "SetPlayerHandicapReviveTime",
      answer: () => undefined,
      member: () => {
        player.handicapReviveTime = 1.5;
      },
      line: `SetPlayerHandicapReviveTime(${ref}, 1.5)`,
    }),
    nativeCase({
      native: "GetPlayerHandicapDamage",
      answer: () => 0.75,
      member: () => player.handicapDamage,
      line: `GetPlayerHandicapDamage(${ref})`,
      returns: 0.75,
    }),
    nativeCase({
      native: "SetPlayerHandicapDamage",
      answer: () => undefined,
      member: () => {
        player.handicapDamage = 1.25;
      },
      line: `SetPlayerHandicapDamage(${ref}, 1.25)`,
    }),
    nativeCase({
      native: "SetFogStateRect",
      answer: () => undefined,
      member: () => {
        player.setFogStateRect(masked, where, true);
      },
      line: `SetFogStateRect(${ref}, ${maskedRef}, ${whereRef}, true)`,
    }),
    nativeCase({
      native: "SetFogStateRadius",
      answer: () => undefined,
      member: () => {
        player.setFogStateRadius(masked, 16, -48, 512, false);
      },
      line: `SetFogStateRadius(${ref}, ${maskedRef}, 16, -48, 512, false)`,
    }),
    nativeCase({
      native: "SetFogStateRadiusLoc",
      answer: () => undefined,
      member: () => {
        player.setFogStateRadiusLoc(masked, center, 300, true);
      },
      line: `SetFogStateRadiusLoc(${ref}, ${maskedRef}, ${centerRef}, 300, true)`,
    }),
    nativeCase({
      native: "SetBlight",
      answer: () => undefined,
      member: () => {
        player.setBlight(10, 20, 400, true);
      },
      line: `SetBlight(${ref}, 10, 20, 400, true)`,
    }),
    nativeCase({
      native: "SetBlightRect",
      answer: () => undefined,
      member: () => {
        player.setBlightRect(where, false);
      },
      line: `SetBlightRect(${ref}, ${whereRef}, false)`,
    }),
    nativeCase({
      native: "SetBlightPoint",
      answer: () => undefined,
      member: () => {
        player.setBlightPoint(-10, 30, true);
      },
      line: `SetBlightPoint(${ref}, -10, 30, true)`,
    }),
    nativeCase({
      native: "SetBlightLoc",
      answer: () => undefined,
      member: () => {
        player.setBlightLoc(center, 250, false);
      },
      line: `SetBlightLoc(${ref}, ${centerRef}, 250, false)`,
    }),
    nativeCase({
      native: "StartMeleeAI",
      answer: () => undefined,
      member: () => {
        player.startMeleeAI("human.ai");
      },
      line: `StartMeleeAI(${ref}, "human.ai")`,
    }),
    nativeCase({
      native: "StartCampaignAI",
      answer: () => undefined,
      member: () => {
        player.startCampaignAI("campaign.ai");
      },
      line: `StartCampaignAI(${ref}, "campaign.ai")`,
    }),
    nativeCase({
      native: "CommandAI",
      answer: () => undefined,
      member: () => {
        player.commandAI(7, 42);
      },
      line: `CommandAI(${ref}, 7, 42)`,
    }),
    nativeCase({
      native: "PauseCompAI",
      answer: () => undefined,
      member: () => {
        player.pauseCompAI(true);
      },
      line: `PauseCompAI(${ref}, true)`,
    }),
    nativeCase({
      native: "GetAIDifficulty",
      answer: () => insane,
      member: () => player.aiDifficulty,
      line: `GetAIDifficulty(${ref})`,
      returns: insane,
    }),
    nativeCase({
      native: "DisplayTextToPlayer",
      answer: () => undefined,
      member: () => {
        player.displayText(0, 0, "hello");
      },
      line: `DisplayTextToPlayer(${ref}, 0, 0, "hello")`,
    }),
    nativeCase({
      native: "DisplayTimedTextToPlayer",
      answer: () => undefined,
      member: () => {
        player.displayTimedText(0.5, 0, 10, "timed");
      },
      line: `DisplayTimedTextToPlayer(${ref}, 0.5, 0, 10, "timed")`,
    }),
    nativeCase({
      native: "DisplayTimedTextFromPlayer",
      answer: () => undefined,
      member: () => {
        player.displayTimedTextFrom(0, 0.5, 5, "from an ally");
      },
      line: `DisplayTimedTextFromPlayer(${ref}, 0, 0.5, 5, "from an ally")`,
    }),
    nativeCase({
      native: "BlzDisplayChatMessage",
      answer: () => undefined,
      member: () => {
        player.displayChatMessage(0, "gg");
      },
      line: `BlzDisplayChatMessage(${ref}, 0, "gg")`,
    }),
    nativeCase({
      native: "GetWinningPlayer",
      answer: () => other,
      member: () => MapPlayer.fromWinning(),
      line: "GetWinningPlayer()",
      returns: otherPlayer,
    }),
    nativeCase({
      native: "GetTournamentFinishNowPlayer",
      answer: () => other,
      member: () => MapPlayer.fromTournamentFinishNow(),
      line: "GetTournamentFinishNowPlayer()",
      returns: otherPlayer,
    }),
    nativeCase({
      native: "GetChangingUnitPrevOwner",
      answer: () => other,
      member: () => MapPlayer.fromPreviousOwner(),
      line: "GetChangingUnitPrevOwner()",
      returns: otherPlayer,
    }),
    nativeCase({
      native: "GetEventDetectingPlayer",
      answer: () => other,
      member: () => MapPlayer.fromDetecting(),
      line: "GetEventDetectingPlayer()",
      returns: otherPlayer,
    }),
  ]);

  describeNatives("MapPlayer event lookups when their Native answers nil", [
    nativeCase({
      native: "GetWinningPlayer",
      answer: () => undefined,
      member: () => MapPlayer.fromWinning(),
      line: "GetWinningPlayer()",
    }),
    nativeCase({
      native: "GetTournamentFinishNowPlayer",
      answer: () => undefined,
      member: () => MapPlayer.fromTournamentFinishNow(),
      line: "GetTournamentFinishNowPlayer()",
    }),
    nativeCase({
      native: "GetChangingUnitPrevOwner",
      answer: () => undefined,
      member: () => MapPlayer.fromPreviousOwner(),
      line: "GetChangingUnitPrevOwner()",
    }),
    nativeCase({
      native: "GetEventDetectingPlayer",
      answer: () => undefined,
      member: () => MapPlayer.fromDetecting(),
      line: "GetEventDetectingPlayer()",
    }),
  ]);
}
