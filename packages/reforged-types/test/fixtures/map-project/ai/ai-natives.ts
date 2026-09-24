// Positive: the AI natives, with reforged-types/3.0.0/common.ai in types,
// alongside the common.j and Blizzard.j declarations.
StartThread(() => {
  if (CaptainAtGoal() && GetMinesOwned() > 0) {
    DisplayTextToPlayer(GetLocalPlayer(), 0, 0, "gold: " + GetGold());
  }
});

export {};
