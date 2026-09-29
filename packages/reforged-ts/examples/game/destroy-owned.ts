// A shrine that stands for 60 seconds, with everything it shows. Its
// handles belong to it alone: its end destroys each of them once, on every
// client, and drops the object that held them, so no reference survives.
// Any later use of a destroyed Wrapper raises in Dev mode
// (`reforged-ts: used after destroy: <Class>#<id>`); without Dev mode it
// reaches a Handle the game has freed.
import {
  Effect,
  FogModifier,
  Image,
  ImageType,
  Init,
  MapPlayer,
  Rectangle,
  Region,
  TextTag,
  Timer,
  Trigger,
  tsGlobals,
  Ubersplat,
  Unit,
  WeatherEffect,
} from "reforged-ts";

interface Shrine {
  readonly area: Rectangle;
  readonly region: Region;
  readonly trigger: Trigger;
  readonly timer: Timer;
  readonly glow: Effect;
  readonly label: TextTag;
  readonly circle: Image;
  readonly splat: Ubersplat;
  readonly vision: FogModifier;
  readonly rain: WeatherEffect;
}

let shrine: Shrine | undefined;

/** Ends the shrine: every handle it owns is destroyed, then forgotten. */
export function endShrine(): void {
  if (shrine === undefined) {
    return;
  }
  const { area, region, trigger, timer, glow, label } = shrine;
  const { circle, splat, vision, rain } = shrine;
  shrine = undefined;
  trigger.destroy();
  region.destroy();
  rain.destroy();
  area.destroy();
  glow.destroy();
  label.destroy();
  circle.destroy();
  splat.destroy();
  vision.destroy();
  timer.destroy();
}

/** Raises a shrine at (x, y) for `owner`, healing the heroes who enter. */
export function raiseShrine(owner: MapPlayer, x: number, y: number): void {
  endShrine();
  const area = Rectangle.create(x - 256, y - 256, x + 256, y + 256);
  const region = Region.create();
  region.addRect(area);
  const trigger = Trigger.create().registerEnterRegion(region, () => {
    return Unit.fromFilter()?.isHero() === true;
  });
  trigger.addAction(() => {
    const hero = Unit.fromEntering();
    if (hero !== undefined) {
      hero.life = hero.maxLife;
    }
  });
  const rain = WeatherEffect.create(area, FourCC("RAlr"));
  rain.enable(true);
  const label = TextTag.create();
  label.setText("Shrine", 12, true);
  label.setPos(x, y, 128);
  const circle = Image.create(
    "ReplaceableTextures\\Selection\\SpellAreaOfEffect.blp",
    512,
    512,
    0,
    x - 256,
    y - 256,
    0,
    0,
    0,
    0,
    ImageType.Indicator,
  );
  circle.setRender(true);
  const splat = Ubersplat.create(x, y, "HMED", 255, 255, 255, 255, true, true);
  splat.show(true);
  const vision = FogModifier.create(
    owner,
    FOG_OF_WAR_VISIBLE,
    x,
    y,
    512,
    true,
    false,
  );
  vision.start();
  shrine = {
    area,
    region,
    trigger,
    timer: Timer.create().start(60, false, endShrine),
    glow: Effect.create(
      "Abilities\\Spells\\Human\\HolyBolt\\HolyBoltSpecialArt.mdl",
      x,
      y,
    ),
    label,
    circle,
    splat,
    vision,
    rain,
  };
}

Init.onGameStart(() => {
  raiseShrine(tsGlobals.Players[0], 0, 0);
});
