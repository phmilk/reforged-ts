// Every creation member returns the Wrapper itself, the ones that delegate to
// a `create` included; the player's leaderboard is a lookup.
import {
  Dialog,
  DialogButton,
  Leaderboard,
  type MapPlayer,
  Multiboard,
  MultiboardItem,
  Quest,
  QuestItem,
} from "reforged-ts";

declare const player: MapPlayer;

const dialog: Dialog = Dialog.create();
const stay: DialogButton = DialogButton.create(dialog, "Stay");
const leave: DialogButton = dialog.addButton("Leave", 0, true);
const quest: Quest = Quest.create();
const objective: QuestItem = QuestItem.create(quest);
const described: QuestItem = quest.addItem("Slay the dragon");
const board: Multiboard = Multiboard.create();
const cell: MultiboardItem = MultiboardItem.create(board, 1, 1);
const created: MultiboardItem = board.createItem(1, 2);
const leaderboard: Leaderboard = Leaderboard.create();
const shown: Leaderboard | undefined = Leaderboard.fromPlayer(player);

export {
  board,
  cell,
  created,
  described,
  dialog,
  leaderboard,
  leave,
  objective,
  quest,
  shown,
  stay,
};
