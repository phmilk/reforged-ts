import { describe, expect, it } from "vitest";
import { CREATED_PROJECT } from "../src/creation-step.js";
import {
  ALL_FOUR,
  CLI,
  CREATED_FILES,
  allSteps,
  creationLine,
  fakeRunner,
  gate,
  lines,
  packOutput,
  templateCheckout,
} from "./support/template-gate.js";

describe("the creation step", () => {
  it("runs the plan's create-reforged-map when the plan publishes it, packing nothing", async () => {
    const packDir = await packOutput([...ALL_FOUR, { name: CLI }]);
    const runner = fakeRunner();

    const { result, scratch } = await gate(
      await templateCheckout(),
      packDir,
      runner.run,
    );

    expect(result.ok).toBe(true);
    expect(lines(runner.commands)).toEqual(
      allSteps(scratch).filter((line) => !line.startsWith("pnpm pack")),
    );
  });

  it("stops when the project keeps a path of the Template's maintenance manifest, naming it", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const runner = fakeRunner({ created: { "scripts/detach.ts": "" } });

    const { result, scratch } = await gate(
      await templateCheckout(),
      packDir,
      runner.run,
    );

    expect(result).toEqual({
      ok: false,
      installed: expect.any(Array) as unknown,
      failed: creationLine(scratch),
      message: `The Template gate failed at \`${creationLine(scratch)}\`: the project keeps scripts/detach.ts, which the Template's template-maintenance.json lists.`,
    });
  });

  it("stops when the project keeps the template:detach script", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const manifest = JSON.parse(CREATED_FILES["package.json"] ?? "") as {
      scripts: Record<string, string>;
    };
    manifest.scripts["template:detach"] = "node scripts/detach.ts";
    const runner = fakeRunner({
      created: { "package.json": JSON.stringify(manifest) },
    });

    const { result } = await gate(
      await templateCheckout(),
      packDir,
      runner.run,
    );

    expect(result).toMatchObject({
      ok: false,
      message: expect.stringMatching(
        /: the project's package\.json keeps the `template:detach` script\.$/,
      ) as unknown,
    });
  });

  it.each([
    [
      "package.json",
      JSON.stringify({ name: "reforged-ts-template" }),
      `the project's package.json does not have the name "gate-map" and the description "${CREATED_PROJECT.description}": the Seeds were not prepared.`,
    ],
    [
      "README.md",
      "# gate-map\n\nA Map project template.\n",
      'the project\'s README.md does not have the title "# gate-map" over the description: the Seeds were not prepared.',
    ],
    [
      "AGENTS.md",
      "# Map project\n\n## Your project\n\nThis section belongs to the map's author.\n",
      'the project\'s AGENTS.md does not have the description under "## Your project": the Seeds were not prepared.',
    ],
  ])(
    "stops when the project's %s is not prepared",
    async (file, text, reason) => {
      const packDir = await packOutput(ALL_FOUR);
      const runner = fakeRunner({ created: { [file]: text } });

      const { result, scratch } = await gate(
        await templateCheckout(),
        packDir,
        runner.run,
      );

      expect(result).toMatchObject({
        ok: false,
        failed: creationLine(scratch),
        message: `The Template gate failed at \`${creationLine(scratch)}\`: ${reason}`,
      });
    },
  );

  it("stops before running the CLI on a Template without template:detach or without its manifest", async () => {
    const packDir = await packOutput(ALL_FOUR);
    const cases = [
      {
        template: await templateCheckout(["build", "lint", "test"]),
        reason: "the Template has no `template:detach` script.",
      },
      {
        template: await templateCheckout(undefined, undefined, false),
        reason:
          "the Template has no template-maintenance.json listing its maintenance `paths`.",
      },
    ];
    for (const { template, reason } of cases) {
      const runner = fakeRunner();

      const { result, scratch } = await gate(template, packDir, runner.run);

      expect(lines(runner.commands)).toEqual(allSteps(scratch).slice(0, -1));
      expect(result).toMatchObject({
        ok: false,
        message: `The Template gate failed at \`${creationLine(scratch)}\`: ${reason}`,
      });
    }
  });
});
