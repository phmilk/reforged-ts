// A round's interface, built when the round starts and torn down when it
// ends: a timer window, a leaderboard, a multiboard, a vote dialog, a quest
// and a frame. Each is hidden, then destroyed, on every client, and the
// object that held them is dropped: in Dev mode any later use of a
// destroyed Wrapper raises `reforged-ts: used after destroy: <Class>#<id>`.
import {
  Dialog,
  DialogButton,
  Frame,
  Init,
  Leaderboard,
  MapPlayer,
  Multiboard,
  Quest,
  Timer,
  TimerDialog,
  tsGlobals,
} from "reforged-ts";

interface RoundUi {
  readonly timer: Timer;
  readonly countdown: TimerDialog;
  readonly kills: Leaderboard;
  readonly scores: Multiboard;
  readonly vote: Dialog;
  readonly objective: Quest;
  readonly banner: Frame | undefined;
}

let round: RoundUi | undefined;

/** Ends the round: hides each part of its interface, then destroys it. */
export function endRound(players: MapPlayer[]): void {
  if (round === undefined) {
    return;
  }
  const { timer, countdown, kills, scores, vote, objective, banner } = round;
  round = undefined;
  countdown.display = false;
  countdown.destroy();
  timer.destroy();
  kills.display(false);
  kills.destroy();
  scores.display(false);
  scores.destroy();
  for (const player of players) {
    vote.display(player, false);
  }
  vote.destroy();
  objective.enabled = false;
  objective.destroy();
  if (banner !== undefined) {
    banner.visible = false;
    banner.destroy();
  }
}

/** Starts a two-minute round, with its interface. */
export function startRound(players: MapPlayer[]): void {
  const timer = Timer.create().start(120, false, () => {
    endRound(players);
  });
  const countdown = TimerDialog.create(timer);
  countdown.setTitle("Round");
  countdown.display = true;

  const kills = Leaderboard.create();
  kills.label = "Kills";
  kills.display();

  const scores = Multiboard.create();
  scores.title = "Score";
  scores.columns = 1;
  scores.rows = 1;
  // A cell's handle is released once set; the cell keeps its text.
  const cell = scores.createItem(1, 1);
  cell.setValue("0");
  cell.destroy();

  const vote = Dialog.create();
  vote.setMessage("Surrender?");
  DialogButton.create(vote, "No", 0);

  const objective = Quest.create();
  objective.setTitle("Hold the line");
  objective.setDescription("Survive until the timer runs out.");

  const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
  const banner =
    gameUi === undefined
      ? undefined
      : Frame.createType("RoundBanner", gameUi, 0, "TEXT", "");
  banner?.setText("Round 1");

  round = { timer, countdown, kills, scores, vote, objective, banner };
}

Init.onGameStart(() => {
  startRound(tsGlobals.Players);
});
