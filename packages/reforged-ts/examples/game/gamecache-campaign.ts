// Carrying the hero and the gold from one map of a campaign to the next. The
// first map calls saveProgress when its chapter is won; the next map opens
// the same cache and restores the hero at its start.
import { GameCache, Init, Unit, tsGlobals } from "reforged-ts";

const CAMPAIGN = "MyCampaign.w3v";
const CHAPTER = "chapter1";

/** Stores the hero and the gold, and saves the cache to disk. */
export function saveProgress(hero: Unit, gold: number): void {
  const cache = GameCache.create(CAMPAIGN);
  cache.store(CHAPTER, "hero", hero);
  cache.storeInteger(CHAPTER, "gold", gold);
  cache.save();
}

Init.onGameStart(() => {
  const cache = GameCache.create(CAMPAIGN);
  if (!cache.hasUnit(CHAPTER, "hero")) {
    return;
  }
  const hero = cache.restoreUnit(
    CHAPTER,
    "hero",
    tsGlobals.Players[0],
    0,
    0,
    270,
  );
  print(
    `${hero.name} returns with ${String(cache.getInteger(CHAPTER, "gold"))} gold`,
  );
});
