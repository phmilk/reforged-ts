// Positive: the AI natives, with reforged-types/3.0.0/common.ai in types,
// alongside the common.j and Blizzard.j declarations.
StartThread(() => {
  if (CaptainAtGoal() && GetMinesOwned() > 0) {
    DisplayTextToPlayer(GetLocalPlayer(), 0, 0, "gold: " + String(GetGold()));
  }
});

// The Rawcode globals of common.ai carry their kind into its functions.
SetProduce(1, FOOTMAN, 0);
SetProduce(1, FOOTMEN, 0);
SetUpgrade(UPG_MELEE);
const hero: Rawcode<"unit"> = GetHeroId();
const skill: Rawcode<"ability"> = HOLY_BOLT;

export { hero, skill };
