# Environment secrets in a reusable workflow called from another repository

How a job in a reusable workflow that declares `environment` resolves that environment's secrets and variables when a workflow in another repository calls it, researched for #551 after the rehearsal (#554, [comment](https://github.com/phmilk/reforged-ts/issues/551#issuecomment-6065638313)) showed `vars.APP_CLIENT_ID` resolving and the environment secret `APP_PRIVATE_KEY` arriving empty. Sources are primary only: docs.github.com (read from the `github/docs` sources on `main`, 2026-10-08), the GitHub changelog, and issues in `actions/runner` and `github/docs`. Each claim is marked **Docs** (stated by the documentation, quoted), **Observed** (measured in this project's runs) or **Inferred** (follows from the above, not stated anywhere).

## TL;DR

- **Whose environment:** the caller's. The called job's `environment: board` enters the environment of the _calling_ repository, as it does its variables and its `github` context (Observed in the rehearsal; Inferred from the docs, which never say it in one sentence).
- **Secrets without passing:** no. **Docs** (changed 2026-10-07): "The caller workflow must still pass the secret." and "If the caller workflow doesn't pass an environment secret, the secret resolves to an empty string in the reusable workflow. The workflow run doesn't show an error." Variables are not gated that way: "For reusable workflows, the variables from the caller workflow's repository are used." That difference is why `vars.APP_CLIENT_ID` resolved and `secrets.APP_PRIVATE_KEY` came empty.
- **How to pass it:** `secrets: inherit` or an explicit `secrets: { APP_PRIVATE_KEY: ${{ secrets.APP_PRIVATE_KEY }} }` on the calling job. **Docs:** "You can pass a secret by name even if it only exists in the environment." The calling job still cannot declare `environment` ("The job that calls the reusable workflow can't use the `environment` keyword.").
- **Precedence:** environment over repository over organization, in a normal job and in the reusable case. **Docs:** "If an environment secret has the same name as a repository or organization secret, the environment secret takes precedence. This applies when the caller uses either `secrets: inherit` or `${{ secrets.MY_SECRET }}`."
- **User-owned repositories (Observed, [probe](#5-the-probe-2026-10-08)):** `phmilk` is a user account, and the docs scope `secrets: inherit` to "repositories within the same organization, or across organizations within the same enterprise". No primary source settled whether `inherit` and the explicit map work between two repositories of one user. The probe did: both deliver a secret that exists only in the caller's environment, the explicit map through a nested call too, and the environment's value wins over a same-named repository secret.

## 1. Which repository's environment, and what the called job sees

### Whose environment

- **Docs** do not contain a sentence of the form "the environment is resolved in the caller's repository". What they do say all points at the caller:
  - "When a reusable workflow is triggered by a caller workflow, the `github` context is always associated with the caller workflow." ([Reusing workflow configurations](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations))
  - "For reusable workflows, the variables from the caller workflow's repository are used. Variables from the repository that contains the called workflow are not made available to the caller workflow." ([Variables reference](https://docs.github.com/en/actions/reference/workflows-and-actions/variables#configuration-variable-precedence))
  - `secrets: inherit` passes "all secrets the calling workflow has access to, namely organization, repository, and environment secrets" ([Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idsecretsinherit)).
- **Observed:** the rehearsal's caller run [37818344328](https://github.com/phmilk/reforged-ts-template/actions/runs/37818344328) (created 2026-10-08T17:40:10Z) created deployment `6942559261` in the environment `board` of `phmilk/reforged-ts-template` at 17:40:11Z, ref `main`: the caller's environment, under the caller's deployment branch policy.
- **Inferred:** the environment named by the called job is looked up in the caller's repository, so its protection rules and its variables are the caller's. The called workflow's own repository contributes its YAML only.

### Variables

- **Docs:** "The `vars` context contains custom configuration variables set at the organization, repository, and environment levels." ([Contexts](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#vars-context)) and "Configuration variables at the environment level are automatically available after their environment is declared by the runner." (same page). For the reusable case, the caller's repository variables are used (quoted above).
- No passing step exists for variables: `on.workflow_call` has `inputs` and `secrets`, not variables. So the called job reads the caller's repository variables and, with `environment`, the caller's environment variables directly.

### Secrets

- **Docs** ([Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows#using-inputs-and-secrets-in-a-reusable-workflow)):
  - "To use an environment secret in a reusable workflow, set `environment` on the job in the reusable workflow. The job that calls the reusable workflow can't use the `environment` keyword."
  - "The caller workflow must still pass the secret. Use `secrets: inherit` or pass the secret by name, for example `MY_SECRET: ${{ secrets.MY_SECRET }}`. You can pass a secret by name even if it only exists in the environment."
  - Warning: "If the caller workflow doesn't pass an environment secret, the secret resolves to an empty string in the reusable workflow. The workflow run doesn't show an error. To make the workflow run fail instead, set `required: true` for the secret in `on.workflow_call.secrets`. This setting only checks whether the caller workflow passes the secret. It doesn't check whether the secret has a value."
- **Docs** ([Using secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)): "Secrets are not automatically passed to reusable workflows."
- **Docs** ([Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments#environment-secrets)): "Secrets stored in an environment are only available to workflow jobs that reference the environment."

### Why `vars` resolved and the secret came empty

- **Docs** explain each half: variables of the caller's repository are used in a reusable workflow with no passing step; secrets reach a reusable workflow only when the caller passes them, and an environment secret that is not passed "resolves to an empty string". Declaring `environment` in the called job is necessary for an environment secret, not sufficient.
- **Inferred:** the called workflow's `secrets` context holds only what the caller passed (plus `GITHUB_TOKEN`); the environment binding admits the environment's secrets into that context only among the secrets passed. The docs give no mechanism, only the outcome.
- The rehearsal's failure matches the documented behavior exactly: `create-github-app-token` got `''` for `private-key`, with no error before it.

## 2. Passing the secret: `secrets: inherit`, an explicit map, and the calling job

- **`secrets: inherit`. Docs:** "Use the `inherit` keyword to pass all the calling workflow's secrets to the called workflow. This includes all secrets the calling workflow has access to, namely organization, repository, and environment secrets. The `inherit` keyword can be used to pass secrets across repositories within the same organization, or across organizations within the same enterprise." ([Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idsecretsinherit)). Also: "If the secrets are inherited by using `secrets: inherit` in the calling workflow, you can reference them even if they are not explicitly defined in the `on` key." ([Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows))
- **Explicit map. Docs:** "You can use `jobs.<job_id>.secrets` in a calling workflow to pass named secrets to a directly called workflow." The key "must match the name of a secret defined by `on.workflow_call.secrets.<secret_id>` in the called workflow", and "If a caller workflow passes a secret that is not specified in the called workflow, this results in an error." Allowed expression contexts for the value: `github`, `needs` and `secrets`. ([Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idsecretssecret_id)). And, for environment secrets: "You can pass a secret by name even if it only exists in the environment."
- **`environment` on the calling job: not supported. Docs:** "The job that calls the reusable workflow can't use the `environment` keyword." `environment` is also absent from the list of "Supported keywords for jobs that call a reusable workflow" ([Reusing workflow configurations](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations#supported-keywords-for-jobs-that-call-a-reusable-workflow)).
- **Nesting. Docs:** "Secrets are only passed to directly called workflow, so in the workflow chain A > B > C, workflow C will only receive secrets from A if they have been passed from A to B, and then from B to C." Each level passes again (`inherit` or a map).
- **User-owned repositories.** The docs scope `inherit` to the same organization or the same enterprise. They say nothing about two repositories of one user account, which `phmilk/reforged-ts` and `phmilk/reforged-ts-template` are. No primary source settles it. **Observed** ([probe](#5-the-probe-2026-10-08)): `inherit` works between two private repositories of one user.
- **The explicit map across repositories.** The docs sentence "You can pass a secret by name even if it only exists in the environment" has no repository qualifier. Third-party repositories (not primary, not relied on) report the explicit map arriving empty across repositories and only `inherit` working. **Observed** ([probe](#5-the-probe-2026-10-08)): the explicit map delivers a secret that exists only in the caller's environment, across two repositories of one user, directly and through a nested call.

## 3. Precedence when names collide

- **Normal job. Docs:** "If a secret with the same name exists at multiple levels, the secret at the lowest level takes precedence. For example, if an organization-level secret has the same name as a repository-level secret, then the repository-level secret takes precedence. Similarly, if an organization, repository, and environment all have a secret with the same name, the environment-level secret takes precedence." ([Secrets reference](https://docs.github.com/en/actions/reference/security/secrets#naming-your-secrets))
- **Reusable workflow. Docs:** "If an environment secret has the same name as a repository or organization secret, the environment secret takes precedence. This applies when the caller uses either `secrets: inherit` or `${{ secrets.MY_SECRET }}`. The job that sets `environment` receives the environment secret's value." ([Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows#using-inputs-and-secrets-in-a-reusable-workflow))
- **Variables, for comparison. Docs:** the same lowest-level rule, with "Environment-level variables are only available on the runner after the job starts executing. This means that environment-level variables won't overwrite variables in the `env` and `vars` contexts." ([Variables reference](https://docs.github.com/en/actions/reference/workflows-and-actions/variables#configuration-variable-precedence))
- **Inferred consequence:** a same-named repository secret cannot leak in place of the environment's once the caller passes it: the job that sets `environment` gets the environment's value. Deleting the repository copy (#558) does not stop the pass: "You can pass a secret by name even if it only exists in the environment."

## 4. History and known issues

- **2021-11-24, changelog** [Reusable workflows are generally available](https://github.blog/changelog/2021-11-24-github-actions-reusable-workflows-are-generally-available/): lists "You can pass environment secrets to reusable workflows".
- **2021-11-16, [actions/runner#1490](https://github.com/actions/runner/issues/1490)** "Environment Secrets are not available on Reusable Workflow / Workflow Templates": the same symptom as the rehearsal (environment set in the called job, secret empty, fixed by an explicit map in the caller). Closed as not planned; no GitHub staff answer in the thread.
- **2022-05-03, changelog** [Simplify using secrets with reusable workflows](https://github.blog/changelog/2022-05-03-github-actions-simplify-using-secrets-with-reusable-workflows/): introduces `secrets: inherit`.
- **2024-03-15, [actions/runner#3206](https://github.com/actions/runner/issues/3206)** "Not able to use environment secrets in reusable workflows" (environment secrets of the _called_ workflow's repository from another repository): open, no staff answer. Consistent with the caller-side resolution above.
- **2026-05-26, [actions/runner#4453](https://github.com/actions/runner/issues/4453)** "Environment-scoped secrets unreachable from reusable workflow without secrets: inherit, despite called job declaring environment": open, no staff answer; reports that the environment binding applies to protection rules and `vars` but not to secrets.
- **2026-05-26 to 2026-09-03, [github/docs#44458](https://github.com/github/docs/issues/44458)**: the docs bug for the same gap, closed by a docs team member as tracked by actions/runner#4453.
- **2026-10-07, docs commit [`8260600890`](https://github.com/github/docs/commit/8260600890)** "Clarify how environment secrets work in reusable workflows": replaced the old warning, which read "Environment secrets cannot be passed from the caller workflow as `on.workflow_call` does not support the `environment` keyword. If you include `environment` in the reusable workflow at the job level, the environment secret will be used, and not the secret passed from the caller workflow.", with the current text (the caller must pass it; an unpassed one resolves empty). The old wording is the likely source of ADR 0017's premise. **Inferred:** the docs changed, not the platform; the behavior they now describe is the one #1490 reported in 2021.
- **Known limitation, open:** no setting makes an environment's secrets reach a called job without the caller passing them, and `required: true` "only checks whether the caller workflow passes the secret. It doesn't check whether the secret has a value."

## 5. The probe (2026-10-08)

The probe ran in two throwaway private repositories of `phmilk`, deleted afterwards. The code is on the branch `prototype/env-secret-reusable` (`.github/prototype/env-secret-reusable/`), and the results are in [this comment on #554](https://github.com/phmilk/reforged-ts/issues/554#issuecomment-6065934706).

- **Setup.** The called repository's jobs all declare `environment: board`. The caller's `board` admits `main` alone and holds the secret, a dummy value of length 9. Round 2 adds a same-named repository secret of length 21. Each job printed only whether the secret was non-empty and its length.

| Variant                                                   | Environment only | Environment + repository |
| --------------------------------------------------------- | ---------------- | ------------------------ |
| (a) caller without `secrets:`                             | empty            | empty                    |
| (b) `secrets: inherit`                                    | 9                | 9                        |
| (c) plain job with `environment: board`, no reusable call | 9                | 9                        |
| (d) explicit map, `required: true` in the called workflow | 9                | 9                        |
| (e) explicit map, nested (caller → middle → inner)        | 9                | 9                        |

- **Observed:** (a) reproduces the rehearsal. The job concludes success with an empty secret, so the failure surfaces only where the secret is used.
- **Observed:** in (d) the calling job has no environment, so it evaluates the secret as empty in round 1 and as the repository value in round 2. The called job still receives the environment's value: the pass is by name, and the value comes from the called job's environment.

## Implications for #551

- The premise behind ADR 0017, written in the header of `.github/workflows/board-dispatch.yml` as "The caller passes no secrets: a caller cannot pass an environment secret", was half right. The environment _is_ the caller's, but its secret reaches the called job only when the caller passes it. ADR 0017's second amendment, of 2026-10-08 (#560), records the fix.
- Keep `environment: board` on the `dispatch` job of `board-dispatch.yml`: the docs require it for an environment secret, and it is what gives the environment's value precedence and the deployment branch policy its effect.
- The explicit map, chosen over `inherit` once the probe showed it works between the two repositories:
  - `board-dispatch.yml` declares `on.workflow_call.secrets.APP_PRIVATE_KEY` with `required: true`, so an unpassed key fails the run at startup instead of failing in `create-github-app-token`.
  - The Template's caller passes `secrets: { APP_PRIVATE_KEY: ${{ secrets.APP_PRIVATE_KEY }} }`. Only that secret leaves the Template, where `inherit` would hand the library's workflow every secret the caller can reach.
  - The nested path (Template `claim.yml` → `claim-check.yml` → `board-dispatch.yml`) passes at each level. `claim-check.yml` declares `APP_PRIVATE_KEY` in its own `on.workflow_call.secrets`, not `required`, since the library's own `claim.yml` passes none, and maps it on its call of `board-dispatch.yml`. The Template's `claim.yml` maps it on its call of `claim-check.yml`.
- The secret must exist in the Template's environment `board`, and the called job must run on a ref the environment's deployment branch policy admits: the secret is read from the caller's environment, not from the library's.
- #558 deleting the repository secrets changes nothing once the callers pass the key: round 1 had no repository secret at all.

## Sources

- Reuse workflows, "Using inputs and secrets in a reusable workflow" and "Passing secrets to nested workflows": https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows (source: `content/actions/how-tos/reuse-automations/reuse-workflows.md` in `github/docs`)
- Reusing workflow configurations, limitations and supported keywords: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- Workflow syntax, `jobs.<job_id>.secrets.inherit`, `jobs.<job_id>.secrets.<secret_id>`, `on.workflow_call.secrets`: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Variables reference, "Configuration variable precedence": https://docs.github.com/en/actions/reference/workflows-and-actions/variables
- Contexts, `vars` context: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#vars-context
- Secrets reference, precedence: https://docs.github.com/en/actions/reference/security/secrets
- Using secrets in GitHub Actions: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
- Deployments and environments, environment secrets and variables: https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments
- Docs commit "Clarify how environment secrets work in reusable workflows", 2026-10-07: https://github.com/github/docs/commit/8260600890
- Changelog, reusable workflows GA, 2021-11-24: https://github.blog/changelog/2021-11-24-github-actions-reusable-workflows-are-generally-available/
- Changelog, `secrets: inherit`, 2022-05-03: https://github.blog/changelog/2022-05-03-github-actions-simplify-using-secrets-with-reusable-workflows/
- actions/runner#1490: https://github.com/actions/runner/issues/1490
- actions/runner#3206: https://github.com/actions/runner/issues/3206
- actions/runner#4453: https://github.com/actions/runner/issues/4453
- github/docs#44458: https://github.com/github/docs/issues/44458
- The rehearsal: https://github.com/phmilk/reforged-ts/issues/551#issuecomment-6065638313 and run https://github.com/phmilk/reforged-ts-template/actions/runs/37818344328
