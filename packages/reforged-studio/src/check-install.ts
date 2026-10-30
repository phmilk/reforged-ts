/**
 * The check of the reader on the real install (#830), which CI cannot run:
 * it reads one Built-in object's base values from the game data model,
 * then resolves its icon and its model in the HD art layer, as the Studio
 * will. `studio:check-install` runs it on the install `builtins:generate`
 * finds (`./cli/check-install.ts`); its report goes in the pull request.
 */
import type { CascStorage } from "./casc/storage.js";
import { readGameData, type FieldValue } from "./game-data.js";
import type { ObjectKind } from "./kinds.js";
import { createPathResolver } from "./paths.js";

/** What to check. */
export interface InstallCheckOptions {
  /** The Built-in object: `hfoo`, the Footman, by default. */
  rawcode?: string;
  /** Its kind: `unit` by default. */
  kind?: ObjectKind;
  /** The Game data set read: `custom-fk` by default. */
  gameDataSet?: string;
  /** The fields whose base values the report gives: the name, hit points and attack type by default. */
  values?: readonly string[];
  /** Its icon field: `uico` by default. */
  icon?: string;
  /** Its model field: `umdl` by default. */
  model?: string;
}

/** What the check found. */
export interface InstallCheck {
  /** Whether it read the base values, the icon, and the model from the HD layer. */
  ok: boolean;
  /** One line per finding. */
  report: string;
}

/** Reads one object's base values, icon and HD model from the storage. */
export async function checkInstall(
  storage: CascStorage,
  options: InstallCheckOptions = {},
): Promise<InstallCheck> {
  const rawcode = options.rawcode ?? "hfoo";
  const kind = options.kind ?? "unit";
  const gameDataSet = options.gameDataSet ?? "custom-fk";
  const shown = options.values ?? ["unam", "uhpm", "ua1t"];
  const iconField = options.icon ?? "uico";
  const modelField = options.model ?? "umdl";

  const lines = [`Build ${storage.build}, Game data set ${gameDataSet}.`];
  const data = await readGameData(storage, { gameDataSet });
  const object = data.kinds[kind].objects.get(rawcode);
  if (object === undefined || object.values.size === 0) {
    lines.push(`The ${kind} ${rawcode} has no base value.`);
    return { ok: false, report: lines.join("\n") + "\n" };
  }
  const show = (value: FieldValue | undefined) =>
    value === undefined
      ? "(none)"
      : typeof value === "string"
        ? value
        : value.join(", ");
  lines.push(
    `The ${kind} ${rawcode} has ${String(object.values.size)} base values: ${shown
      .map((id) => `${id} ${show(object.values.get(id))}`)
      .join(", ")}.`,
  );

  const resolver = createPathResolver(storage, { artLayer: "hd" });
  let ok = true;
  const icon = object.values.get(iconField);
  const iconPath = await resolver.resolve(typeof icon === "string" ? icon : "");
  if (iconPath.found) {
    lines.push(
      `Its icon (${iconField}) ${iconPath.path}: ${iconPath.file}, ${String((await iconPath.read()).byteLength)} bytes.`,
    );
  } else {
    ok = false;
    lines.push(`Its icon (${iconField}) ${show(icon)}: not found.`);
  }
  const model = object.values.get(modelField);
  const modelPath = await resolver.resolve(
    typeof model === "string" ? model : "",
  );
  if (modelPath.found && modelPath.file.includes("_HD.w3mod:")) {
    lines.push(
      `Its model (${modelField}) ${modelPath.path} in HD: ${modelPath.file}, ${String((await modelPath.read()).byteLength)} bytes.`,
    );
  } else {
    ok = false;
    lines.push(
      `Its model (${modelField}) ${modelPath.path} in HD: not in the HD layer (${modelPath.found ? modelPath.file : "found nowhere"}).`,
    );
  }
  return { ok, report: lines.join("\n") + "\n" };
}
