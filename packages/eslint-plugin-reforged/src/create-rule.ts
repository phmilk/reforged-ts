// The one rule creator: every rule of the plugin is made with it, so every
// rule carries `meta.docs.url` in the same form.
import { ESLintUtils } from "@typescript-eslint/utils";

import { docsUrl } from "./meta.js";

export const createRule = ESLintUtils.RuleCreator(docsUrl);
