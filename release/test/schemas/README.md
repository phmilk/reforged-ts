# Vendored JSON schemas

The schemas `issue-forms.test.ts` validates the issue forms against, copied byte for byte from [SchemaStore](https://github.com/SchemaStore/schemastore) (Apache License 2.0) so the test needs no network:

| File                       | Source                                                | Validates                              |
| -------------------------- | ----------------------------------------------------- | -------------------------------------- |
| `github-issue-forms.json`  | https://json.schemastore.org/github-issue-forms.json  | Each form in `.github/ISSUE_TEMPLATE/` |
| `github-issue-config.json` | https://json.schemastore.org/github-issue-config.json | `.github/ISSUE_TEMPLATE/config.yml`    |

Downloaded on 2026-09-25. To refresh them, download both URLs over these files and run `pnpm --filter reforged-ts-release test`.
