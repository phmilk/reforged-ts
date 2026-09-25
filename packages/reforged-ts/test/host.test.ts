/** @noSelfInFile */

// The host System on one client, through the entry points as the game runs
// them: the lobby time is measured from `config` to `MarkGameStarted`, and
// the election sends it at the `gameStart` stage as a packed float, base64
// text in the payload of one sync packet. The file's tests share one Lua
// state and one run of the editor's script, in order. The elections on
// several clients are in host-clients.test.ts.

// Keep this import ahead of the library's: the library wraps the entry
// points when it loads, and this file defines them.
import "./support/bundle-position";
import { describe, expect, it } from "reforged-test/lua";
import { base64Decode, Host, type MapPlayer } from "../src/index";
import { defined } from "./support/defined";

declare const config: () => void;
declare const main: () => void;

/** The first `detectHost` call's `Promise`. */
let election: Promise<MapPlayer> | undefined;

/** The packets `BlzSendSyncData` recorded while `body` ran. */
function sentBy(body: () => void): StubSyncPacket[] {
  const before = __stub_sync_packets().length;
  body();
  return __stub_sync_packets().slice(before);
}

describe("Host", () => {
  it("has no host before the election", () => {
    expect(Host.host).toBeUndefined();
  });

  it("returns the same Promise from every detectHost call, whatever the options", () => {
    election = Host.detectHost();
    expect(Host.detectHost({ timeout: 1 })).toBe(election);
    expect(Host.detectHost()).toBe(election);
  });

  it("sends nothing before the game starts", () => {
    const packets = sentBy(() => {
      __stub_set_clock(2);
      config();
      __stub_set_clock(3);
      main();
    });
    expect(packets).toEqual([]);
  });

  it("sends the time from config to the game start at the gameStart stage, as a packed float", () => {
    __stub_set_clock(7.5);
    const packets = sentBy(() => {
      MarkGameStarted();
    });
    expect(packets.length).toEqual(1);
    expect(packets[0].from).toBe(GetLocalPlayer());
    const payload = base64Decode(string.sub(packets[0].data, 9));
    const [duration] = string.unpack(">f", payload);
    expect(duration).toEqual(5.5);
  });

  it("still returns the same Promise once the election started", () => {
    expect(Host.detectHost()).toBe(
      defined(election, "the first call's Promise"),
    );
    expect(Host.host).toBeUndefined();
  });
});
