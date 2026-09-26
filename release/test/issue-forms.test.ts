// The issue forms and their configuration, as GitHub reads them: each file
// under .github/ISSUE_TEMPLATE against SchemaStore's schema (vendored in
// schemas/), plus what the schema cannot say: the labels each form applies
// and the field ids and labels the Patch watch writes.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Ajv, type SchemaObject } from "ajv";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { repositoryRoot } from "../src/workspace.js";

const formsFolder = join(repositoryRoot, ".github", "ISSUE_TEMPLATE");
const schemasFolder = new URL("schemas/", import.meta.url);

/** Each form file with the kind label it applies next to `needs-triage`. */
const FORMS: Record<string, string> = {
  "bug-report.yml": "bug",
  "feature-request.yml": "enhancement",
  "new-game-patch.yml": "game-patch",
};

/**
 * The "New game Patch" form's fields, id and label, in order: the Patch
 * watch (#195) writes an issue body with one `### <label>` section each.
 */
const PATCH_FIELDS = [
  ["build", "Build"],
  ["tag", "jass-history tag"],
  ["observed", "Where it was observed"],
  ["notes", "Additional context"],
];

interface Form {
  labels?: string[];
  body: { type: string; id?: string; attributes: { label?: string } }[];
}

async function validator(schema: string) {
  const text = await readFile(new URL(schema, schemasFolder), "utf8");
  // SchemaStore's schemas use keywords and formats of their own; the
  // structure is what is checked here.
  return new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: false,
  }).compile(JSON.parse(text) as SchemaObject);
}

async function readYaml(file: string): Promise<unknown> {
  return parse(await readFile(join(formsFolder, file), "utf8")) as unknown;
}

/** A form's fields, every item but the markdown ones, as id and label. */
function fields(form: Form): (string | undefined)[][] {
  return form.body
    .filter((item) => item.type !== "markdown")
    .map((item) => [item.id, item.attributes.label]);
}

const validateForm = await validator("github-issue-forms.json");
const validateConfig = await validator("github-issue-config.json");

describe("the issue forms", () => {
  it("are the three forms and the configuration, no other file", async () => {
    expect((await readdir(formsFolder)).sort()).toEqual(
      [...Object.keys(FORMS), "config.yml"].sort(),
    );
  });

  describe.each(Object.entries(FORMS))("%s", (file, kind) => {
    it("matches GitHub's issue form schema", async () => {
      const form = await readYaml(file);
      expect(validateForm(form) ? [] : validateForm.errors).toEqual([]);
    });

    it(`applies needs-triage and ${kind}`, async () => {
      const form = (await readYaml(file)) as Form;
      expect(form.labels?.sort()).toEqual([kind, "needs-triage"].sort());
    });

    it("has unique field ids and labels", async () => {
      const pairs = fields((await readYaml(file)) as Form);
      const ids = pairs.map(([id]) => id);
      const labels = pairs.map(([, label]) => label);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  it("keeps the fields the Patch watch writes", async () => {
    const form = (await readYaml("new-game-patch.yml")) as Form;
    expect(fields(form)).toEqual(PATCH_FIELDS);
  });

  it("disable blank issues in a configuration GitHub accepts", async () => {
    const config = await readYaml("config.yml");
    expect(validateConfig(config) ? [] : validateConfig.errors).toEqual([]);
    expect(config).toMatchObject({ blank_issues_enabled: false });
  });
});
