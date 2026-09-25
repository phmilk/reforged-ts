// The host gets a dialog the other players do not. Every client runs the
// same code and awaits the same election, so every client agrees on who the
// host is.
import { Host, Init, MapPlayer } from "reforged-ts";

async function greetHost(): Promise<void> {
  try {
    const host = await Host.detectHost({ timeout: 15 });
    if (host === MapPlayer.fromLocal()) {
      print("You are the host.");
    }
  } catch (reason) {
    // No lobby time arrived before the timeout.
    print(String(reason));
  }
}

Init.onGameStart(() => {
  void greetHost();
});
