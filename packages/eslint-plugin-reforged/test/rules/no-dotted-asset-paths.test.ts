import { describe, expect, it } from "vitest";

import { lintWithRecommended } from "../support/lint.js";
import { ruleOf } from "../support/plugin.js";
import { createRuleTester } from "../support/rule-tester.js";

const ruleTester = createRuleTester();

ruleTester.run("no-dotted-asset-paths", ruleOf("no-dotted-asset-paths"), {
  valid: [
    {
      name: "a model without inner dots",
      code: 'const m = "units/human/Footman.mdx";',
    },
    {
      name: "dots in a folder, not in the file name",
      code: 'const m = "war3.w3mod/units/v1.2/Footman.mdl";',
    },
    {
      name: "a backslash path",
      code: 'const m = "Abilities\\\\Spells\\\\Human\\\\ThunderClap\\\\ThunderClapCaster.mdl";',
    },
    { name: "not an asset extension", code: 'const f = "notes.v1.txt";' },
    {
      name: "a dot inside the extension only",
      code: 'const t = "Hero.blp.bak";',
    },
    {
      name: "a template literal with a substitution",
      code: "const v = 2;\nconst m = `units/Footman.${v}.mdx`;",
    },
    { name: "not a string", code: "const n = 1.5;" },
    {
      name: "the extensions option replaces the default list",
      code: 'const m = "my_model_1.0.mdx";',
      options: [{ extensions: [".mp3"] }],
    },
  ],
  invalid: [
    {
      name: "the 3.0.0 example",
      code: 'const m = "my_model_1.0.mdx";',
      errors: [
        {
          messageId: "dottedAssetPath",
          data: { segment: "my_model_1.0.mdx", fixed: "my_model_1_0.mdx" },
          line: 1,
          column: 11,
          suggestions: [
            {
              messageId: "replaceInnerDots",
              data: { fixed: "my_model_1_0.mdx" },
              output: 'const m = "my_model_1_0.mdx";',
            },
          ],
        },
      ],
    },
    {
      name: "every inner dot, a backslash path, an upper-case extension",
      code: "const t = 'Textures\\\\Hero.Skin.v2.BLP';",
      errors: [
        {
          messageId: "dottedAssetPath",
          data: { segment: "Hero.Skin.v2.BLP", fixed: "Hero_Skin_v2.BLP" },
          suggestions: [
            {
              messageId: "replaceInnerDots",
              output: "const t = 'Textures\\\\Hero_Skin_v2.BLP';",
            },
          ],
        },
      ],
    },
    ...[".mdl", ".dds", ".tga"].map((extension) => ({
      name: `the ${extension} extension`,
      code: `const a = "a.b${extension}";`,
      errors: [
        {
          messageId: "dottedAssetPath" as const,
          suggestions: [
            {
              messageId: "replaceInnerDots" as const,
              output: `const a = "a_b${extension}";`,
            },
          ],
        },
      ],
    })),
    {
      name: "a template literal without substitutions, as an argument",
      code: "AddSpecialEffect(`units/Footman.v2.mdx`, 0, 0);",
      errors: [
        {
          messageId: "dottedAssetPath",
          column: 18,
          suggestions: [
            {
              messageId: "replaceInnerDots",
              output: "AddSpecialEffect(`units/Footman_v2.mdx`, 0, 0);",
            },
          ],
        },
      ],
    },
    {
      name: "the extensions option: without the dot, any case",
      code: 'const a = "sound.v2.mp3";\nconst b = "Voice.Line.WAV";\nconst m = "a.b.mdx";',
      options: [{ extensions: ["mp3", ".wav"] }],
      errors: [
        {
          messageId: "dottedAssetPath",
          line: 1,
          suggestions: [
            {
              messageId: "replaceInnerDots",
              output:
                'const a = "sound_v2.mp3";\nconst b = "Voice.Line.WAV";\nconst m = "a.b.mdx";',
            },
          ],
        },
        {
          messageId: "dottedAssetPath",
          line: 2,
          suggestions: [
            {
              messageId: "replaceInnerDots",
              output:
                'const a = "sound.v2.mp3";\nconst b = "Voice_Line.WAV";\nconst m = "a.b.mdx";',
            },
          ],
        },
      ],
    },
    {
      name: "no suggestion when the file name is written with an escape",
      code: 'const m = "a\\u002eb.mdx";',
      errors: [
        {
          messageId: "dottedAssetPath",
          data: { segment: "a.b.mdx", fixed: "a_b.mdx" },
          suggestions: [],
        },
      ],
    },
  ],
});

describe("no-dotted-asset-paths through the recommended config", () => {
  it("reports a dotted asset path as an error", () => {
    expect(lintWithRecommended('const m = "my_model_1.0.mdx";')).toMatchObject([
      {
        ruleId: "reforged/no-dotted-asset-paths",
        severity: 2,
        messageId: "dottedAssetPath",
      },
    ]);
  });

  it("honours an eslint-disable-next-line escape with a reason", () => {
    expect(
      lintWithRecommended(
        '// eslint-disable-next-line reforged/no-dotted-asset-paths -- a remote URL, not a game asset\nconst url = "https://example.org/model.v1.2.mdx";',
      ),
    ).toEqual([]);
  });
});
