// The first player's save code, read from that player's disk, made known to
// every client. Every client runs the same code: each reads its own file and
// sends the request, and only the first player's client sends its data.
import { File, Init, MapPlayer, SyncRequest } from "reforged-ts";

async function loadSaveCode(sender: MapPlayer): Promise<void> {
  try {
    const response = await SyncRequest.send(
      sender,
      File.read("savecode.txt") ?? "",
      { timeout: 10 },
    );
    print(`${response.from.name} loaded: ${response.data}`);
  } catch (reason) {
    // A timeout, a cancellation or a network error, naming the request.
    print(String(reason));
  }
}

Init.onGameStart(() => {
  const sender = MapPlayer.fromIndex(0);
  if (sender) {
    void loadSaveCode(sender);
  }
});
