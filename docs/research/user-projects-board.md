# What a user-owned Projects board offers on the Free plan

Research for ticket [#520](https://github.com/phmilk/reforged-ts/issues/520), a child of the map [#518](https://github.com/phmilk/reforged-ts/issues/518). Facts only; no decision.

Everything below was read on 2026-10-06 from three primary sources: the GitHub Docs pages on Projects (article bodies fetched verbatim through the site's own `/api/article/body` endpoint), the live GraphQL schema (introspected with `gh api graphql`, cross-checked against the reference page https://docs.github.com/en/graphql/reference/projects) and the `gh project` manual at cli.github.com. Scope: a Projects (v2) board owned by a **personal account on GitHub Free**; organisation-only features are named only to mark them as unavailable. Anything not read from a primary source is marked *inference*. "Documented absence" means the docs were searched for the point and do not answer it; that is reported as a finding, not guessed around.

## Answer in one paragraph

A user-owned project on GitHub Free has the full Projects feature set with exactly one plan-bound limit in the docs: **one auto-add workflow** (Free 1, Pro 5, Team 5, Enterprise 20), and each auto-add workflow targets a single repository, so only one repository can feed the board automatically; a second repository's issues are added by hand, by `gh project item-add`, or by a GitHub Actions workflow with a personal access token. The built-in workflows only ever set the **Status** single-select (item added → Todo; issue or PR closed → Done; PR merged → Done; status set to a chosen value → close the issue) or add/archive items by filter; **none reacts to an assignee change** (the auto-add filter can match on `assignee:`, and the auto-archive `updated` clock restarts when assignees change, but no workflow sets a field when an assignee changes). Of the nine workflow names in the ticket, the docs spell out only "Item added to project", "Auto-add to project" and "Auto-archive items"; the others exist in the UI only. Access to a user project is granted per person under the project's Settings → Manage access with Read, Write or Admin, independently of repository collaborators; a public project is readable by everyone on the internet, with items from private repositories hidden; `gh project` needs the `project` scope (`read:project` for read-only). Views can group by Parent issue (stated explicitly) and by any field except title, labels, reviewers and linked pull requests, and filter by `repo:`, `label:`, `assignee:`, `milestone:`, `parent-issue:` and the rest of the project filter grammar; issue dependencies appear only as a "Blocked" icon on cards, with no field, group or filter. Limits: 50,000 items per project including the archive, 50 fields, 50 options per single select, 100 sub-issues per parent and 8 nesting levels; the number of projects per user and of views per project is undocumented. Issues from any repository can be added to one project, and a project can be listed in the Projects tab of every repository that has the same owner.

---

## 1. Built-in workflows

### 1.1 What the docs name and describe

The "Workflows" entry of the project menu opens a "Default workflows" list. The docs describe the workflows by effect rather than by a complete list of names.

| Documented name | Trigger ("When") | Effect ("Set") | Where the docs say so |
|---|---|---|---|
| **Item added to project** | an issue or pull request is added (the "When" row offers `issues` and `pull requests` as separate checkboxes) | "Next to **Set**, select **Status:Todo**" | Quickstart, "Configuring built-in automation" |
| (unnamed) item closed | "when issues or pull requests in your project are closed" | "their status is set to **Done**"; enabled by default when the project is created | Using the built-in automations |
| (unnamed) pull request merged | "when pull requests in your project are merged" | "their status is set to **Done**"; enabled by default | Using the built-in automations |
| (unnamed) close issue on status change | "the issue's status in your project is changed" | "close issues" | Using the built-in automations ("close issues when the issue's status in your project is changed") |
| **Auto-add to project** | an item in the chosen repository is "created or updated" and matches the filter | adds the item to the project | Adding items automatically |
| **Auto-archive items** | an item matches the `is` / `reason` / `updated` filter | archives the item (the item "retains all of its custom field data") | Archiving items automatically |

The docs' summary of the whole family: "Projects includes built-in workflows that you can use to update the **Status** of items based on certain events" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations, read 2026-10-06). Nothing on docs.github.com says a built-in workflow can set a field other than Status.

**Documented absence.** The names "Item reopened", "Item closed", "Code changes requested", "Code review approved", "Pull request merged" and "Auto-close issue" from the ticket do not occur on any Projects page: the docs site's own search index (`https://docs.github.com/api/search/v1`, queried 2026-10-06 for each phrase) returns no Projects page for "Code review approved", "Item reopened", "Code changes requested" or "Auto-close issue" (the only hit for the last one is the repository setting that closes issues when a linked pull request merges, a different feature). Those entries are visible only in the project's Workflows list in the UI; what "Code changes requested" and "Code review approved" set, and whether "Item reopened" exists, cannot be cited from the docs.

Enabling and editing is UI-only: menu → **Workflows** → pick the workflow under "Default workflows" → **Edit** → "make changes to the fields to configure the workflow's behavior" → **Save and turn on workflow** (same page). Changes made by a workflow are attributed on the issue timeline to **@github-project-automation** (https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-items-in-your-project/adding-items-to-your-project, read 2026-10-06).

### 1.2 Auto-add to project

- Filter grammar is a documented subset: `is` (open, closed, merged, draft, issue, pr), `label`, `reason` (completed, reopened, "not planned"), `assignee` (a GitHub username), `no` (label, assignee, reason); "All filters, other than `no`, support negation" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/adding-items-automatically, read 2026-10-06).
- One repository per workflow: "Under 'Filters', select the repository you want to add items from"; "each workflow can have a unique filter and target a different repository" and "You can target the same repository with multiple workflows if the filter is unique for each workflow" (same page).
- **Plan limit** (the only per-plan table in the Projects docs): "The auto-add workflow is limited per plan." GitHub Free 1, GitHub Pro 5, GitHub Team 5, GitHub Enterprise Cloud 20, GitHub Enterprise Server 20 (same page). The page does not distinguish user from organisation projects; *inference*: a user-owned project is governed by the personal account's plan, so Free means one auto-add workflow for the whole project.
- No retroactivity: "When you enable the auto-add workflow, existing items matching your criteria will not be added. The workflow will add items when created or updated if the item matches your filter" (same page). Existing items are added with the bulk "Add item from repository" dialog instead (Adding items to your project).
- Auto-add workflows are the one thing never copied: project copies and templates carry "configured workflows (except any auto-add workflows)" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/copying-an-existing-project, read 2026-10-06).

### 1.3 Auto-archive items

- Filters: only `is`, `reason` and `updated` ("You can only use the `is`, `reason`, and `updated` filters"), e.g. `updated:<@today-14d` (https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/archiving-items-automatically, read 2026-10-06).
- Retroactive: "items in your project that already meet your criteria will also be archived" (same page).
- "Updated" is reset when an item is created, reopened, edited, commented, labeled, when "Assignees are updated", when milestones are updated, when transferred, and when "field values in your project are changed" (same page).

### 1.4 Restrictions by plan or to organisations

- Per plan: only the auto-add count above. The plans page lists what GitHub Free for personal accounts includes and does not mention Projects at all, so no other Projects feature is gated by the plan in the docs (https://docs.github.com/en/get-started/learning-about-github/githubs-plans, read 2026-10-06).
- Organisation-only features adjacent to workflows: project templates ("only projects which are owned by an Organization can be marked as a template", schema description of `markProjectV2AsTemplate`; https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-project-templates-in-your-organization), organisation issue types ("If your organization uses issue types") and organisation issue fields ("Issue fields are organization-level fields"). None of the built-in workflows is documented as organisation-only.
- Insights: "the chart is available to anyone that can view the project"; the current page carries no plan restriction for current or historical charts (https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-from-your-project/about-insights-for-projects, read 2026-10-06).

### 1.5 Does anything react to an assignee change?

- **Built-in workflows: no.** The documented triggers are item added, item closed, pull request merged, status changed, and the auto-add / auto-archive filters (sections 1.1–1.3). An assignee change touches two of them only indirectly: it counts as an "update", so an item whose new assignee matches an auto-add filter such as `assignee:USERNAME` is added at that moment, and it restarts the auto-archive `updated` clock. No workflow sets Status or any other field on assignment. Documented absence: no Projects page mentions assignment as a workflow trigger.
- **GitHub Actions: yes**, from the repository side. The `issues` event has the activity types `assigned` and `unassigned` (and `labeled`, `milestoned`, `typed`, `field_added`, ...), as does `pull_request` (https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows, read 2026-10-06). The Actions-for-Projects page shows the pattern (add the item with `addProjectV2ItemById`, then `updateProjectV2ItemFieldValue`) and warns: "`GITHUB_TOKEN` is scoped to the repository level and cannot access projects. To access projects you can either create a GitHub App (recommended for organization projects) or a personal access token (recommended for user projects)"; the PAT needs the `project` and `repo` scopes; "A project can span multiple repositories, but a workflow is specific to a repository. Add the workflow to each repository that you want your project to track" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/automating-projects-using-actions, read 2026-10-06).

### 1.6 Workflows in the GraphQL schema and in `gh`

- `ProjectV2` exposes `workflows` (a `ProjectV2WorkflowConnection`) and `workflow(number:)`. `ProjectV2Workflow` ("A workflow inside a project") has only `id`, `fullDatabaseId`, `name`, `number`, `enabled`, `project`, `createdAt`, `updatedAt`: the trigger, filter and effect are not exposed (schema introspection, 2026-10-06; https://docs.github.com/en/graphql/reference/projects#projectv2workflow).
- The only workflow mutation is `deleteProjectV2Workflow`; there is no create or update mutation (schema introspection of the mutation type, 2026-10-06). Workflows are therefore configured in the UI only.
- `gh project` has no workflow subcommand; its commands are close, copy, create, delete, edit, field-create, field-delete, field-list, item-add, item-archive, item-create, item-delete, item-edit, item-list, link, list, mark-template, unlink, view (https://cli.github.com/manual/gh_project, read 2026-10-06).

---

## 2. Access

### 2.1 Granting a repository collaborator write access to a user-owned project

- Who can grant: "Admins of user-level projects can invite individual collaborators and manage their access" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-access-to-your-projects, read 2026-10-06). Base roles and team access exist for organisation projects only.
- How: project menu → **Settings** → **Manage access** → under **Invite collaborators** search for the user → choose the role → **Invite**. Roles: "**Read:** The individual can view the project. **Write:** The individual can view and edit the project. **Admin:** The individual can view, edit, and add new collaborators to the project." Existing collaborators are edited or removed in the same **Manage access** list (same page).
- Separate from repository access, in the docs' own words: "This only affects collaborators for your project, not for repositories in your project. To view an item on the project, someone must have the required permissions for the repository that the item belongs to. Only people with access to a private repository will be able to view project items from that private repository" (same page). Conversely, being a repository collaborator grants nothing on the project; the project invitation is a second, independent step.
- Schema: `updateProjectV2Collaborators(projectId, collaborators: [ProjectV2Collaborator!]!)` where `ProjectV2Collaborator` is `{ userId | teamId, role: ProjectV2Roles! }` and `ProjectV2Roles` is `NONE` ("no direct access"), `READER`, `WRITER`, `ADMIN` ("can view, edit, and maange the settings of the project", typo in the schema). `ProjectV2.viewerCanUpdate`, `viewerCanClose`, `viewerCanReopen` report the caller's rights (schema introspection, 2026-10-06; https://docs.github.com/en/graphql/reference/projects#updateprojectv2collaborators).

### 2.2 What a public project shows a visitor

- "For public projects, everyone on the internet can view the project. For private projects, only users granted at least read access can see the project" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-visibility-of-your-projects, read 2026-10-06).
- Per-item gating survives: "Only the project visibility is affected; to view an item on the project, someone must have the required permissions for the repository that the item belongs to"; such items show as a padlock (same page, screenshot caption "One of the items is marked with a padlock icon, indicating it's hidden"). In the schema an item the viewer may not see has `type: REDACTED` ("Redacted Item", `ProjectV2ItemType`).
- Visibility is set under **Settings** → "Danger zone" → **Visibility** → **Private** or **Public**; "Project admins and organization owners can control project visibility" (same page). `ProjectV2.public` exposes it.
- Read access implies: all views (the views are the project), charts ("the chart is available to anyone that can view the project", About insights), the project's timeline events on items ("Timeline events are only visible to people who have at least read permission for the project", Adding items to your project), and the README/description/status updates on the side panel (About Projects). Documented absence: no page itemises what a logged-out visitor sees beyond "can view the project"; whether workflows or settings pages are readable is not stated (*inference*: Settings and Workflows are admin surfaces, not part of "view").

### 2.3 The `project` scope and `gh project`

- OAuth/PAT (classic) scopes: "`project` — Grants read/write access to user and organization projects. `read:project` — Grants read only access to user and organization projects" (https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps, read 2026-10-06).
- `gh project`: "The minimum required scope for the token is: `project`. You can verify your token scope by running `gh auth status` and add the `project` scope by running `gh auth refresh -s project`" (https://cli.github.com/manual/gh_project, read 2026-10-06). The API page adds that `read:project` suffices for queries: "If you only need to read, but not edit, projects, you can provide the `read:project` scope instead of `project`" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects, read 2026-10-06).
- With the scope, `gh project` can create/edit/close/delete/copy a project, list and create/delete fields, add, create (draft), edit, archive, delete and list items, link/unlink a project to a repository or team, and `mark-template` (organisation projects only). The owner is given with `--owner`: "Login of the owner. Use "@me" for the current user" (https://cli.github.com/manual/gh_project_item-add, read 2026-10-06). It cannot touch workflows, views or collaborators (section 1.6; no such subcommands).
- Observed on 2026-10-06: a `gh` token with the scopes `gist, read:org, repo, workflow` is refused by the GraphQL API for `viewer { projectsV2 { nodes { number title } } }` with `INSUFFICIENT_SCOPES` ("requires one of the following scopes: ['read:project']"), confirming that `repo` alone reads nothing of a project.
- Tokens: the API page names "a personal access token (classic) for a user or an installation access token for a GitHub App"; fine-grained personal access tokens are not mentioned on either Projects page (documented absence).

---

## 3. Fields and views

### 3.1 Status

- Status is the single-select field the built-in workflows set (section 1.1) and the default column field of a board: "You can create a kanban board by setting your column field to a 'Status' field or set any other single select or iteration field as the column field" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout, read 2026-10-06). The quickstart's workflow step shows the option "Status:Todo", so Todo is a default option; the full default option set is not listed on any page read (documented absence; *inference* from the workflow descriptions: Todo, In Progress, Done).
- Single-select fields: "Single select fields can contain up to 50 options", each with a label, a colour and a description; a default option can be chosen ("New items added to the project are automatically pre-populated with that option"); filtered with `fieldname:option` or `fieldname:option,option` (https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-single-select-fields, read 2026-10-06). Schema: `ProjectV2SingleSelectField { options { id name color description } }`; values are set with `updateProjectV2ItemFieldValue` using the option id.
- Whether Status can be deleted: the deletion page is "Deleting custom fields" and covers custom fields only (https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/deleting-custom-fields, read 2026-10-06); nothing says whether the Status field is deletable (documented absence).

### 3.2 Built-in fields

The schema enum `ProjectV2FieldType` (introspected 2026-10-06; https://docs.github.com/en/graphql/reference/projects#projectv2fieldtype) is the complete list:

| Kind | `ProjectV2FieldType` values |
|---|---|
| Built-in metadata of the item | `TITLE`, `ASSIGNEES`, `LABELS`, `MILESTONE`, `REPOSITORY`, `LINKED_PULL_REQUESTS`, `REVIEWERS`, `ISSUE_TYPE`, `PARENT_ISSUE`, `SUB_ISSUES_PROGRESS`, `TRACKS`, `TRACKED_BY`, `CREATED`, `UPDATED`, `CLOSED` |
| Custom | `TEXT`, `NUMBER`, `DATE`, `SINGLE_SELECT`, `MULTI_SELECT`, `ITERATION` |

- Showing a hidden built-in field: in table view click the plus in the rightmost header, then under "Hidden fields" click **Parent issue**, **Sub-issue progress** (https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-parent-issue-and-sub-issue-progress-fields), **Linked pull requests**, **Reviewers** (https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-pull-request-fields) or **Type** (https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-the-issue-type-field), all read 2026-10-06. The Type field needs organisation issue types; organisation issue fields (priority, effort, ...) are organisation-only too (https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-issue-fields). Neither exists for a personal account.
- "Parent issue" shows "which parent issues the issues in your project belong to"; "Sub-issue progress" shows "how many sub-issues have been completed". The page's opening sentence says "If your organization uses sub-issues", but sub-issues are a feature of issues in any repository (the sub-issues page carries no plan or organisation condition and lists the limits "up to 100 sub-issues per parent issue and ... up to eight levels", https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues, read 2026-10-06); *inference*: the wording is the docs' usual team framing, not a restriction.
- Field budget: "You can use up to 50 fields in a project, including built-in metadata and custom fields" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects, read 2026-10-06).
- Two-way sync: "change an assignee in your project and that change is shown in your issue"; "group your project by assignee, and make changes to issue assignment by dragging issues into the different groups" (same page). Through the API, however, `updateProjectV2ItemFieldValue` supports "only single-select, multi-select, text, number, date, and iteration fields", and `clearProjectV2ItemFieldValue` "only text, number, date, assignees, labels, single-select, multi-select, iteration and milestone fields" (schema descriptions, 2026-10-06): assignees, labels and milestone are set on the issue itself, not through the project item. Item field values are read through the `ProjectV2ItemFieldValue` union (`...UserValue` for assignees, `...LabelValue`, `...MilestoneValue`, `...RepositoryValue`, `...PullRequestValue`, `...ReviewerValue`, ...); there is no value type for Parent issue or Sub-issues progress, which are read from the item's `content { ... on Issue { parent, subIssuesSummary } }` instead (schema, 2026-10-06).

### 3.3 Views: layouts, grouping, slicing, filtering

- Three layouts per view: **Table**, **Board**, **Roadmap** (`ProjectV2ViewLayout`: `TABLE_LAYOUT`, `BOARD_LAYOUT`, `ROADMAP_LAYOUT`); each saved view is a tab; "You can set each view in your project to a different layout" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view, read 2026-10-06).
- **Group by**: table, board (horizontal swimlanes) and roadmap can group by a field; the only exclusion is "You cannot group by title, labels, reviewers, or linked pull requests" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-table-layout and the board and roadmap pages, read 2026-10-06). **Parent issue is groupable by explicit statement**: "The 'Parent issue' field can be used to group items, allowing you to create views that break down your work using the sub-issue hierarchies you have created" (parent-issue page); the sub-issues page repeats "build views, filter, and group by parent issue". Assignee grouping is stated on About Projects. *Inference* from the exclusion list: Repository, Milestone, Status and other single selects are groupable; Labels is not (use slicing or filtering for labels). Dragging an item into a group applies the group's value; a new item added inside a group takes that value (table and board pages).
- **Board columns**: "any single select or iteration field" (board page). Optional per-column limit, shown and highlighted when exceeded, "does not restrict anyone from adding cards ... nor does it restrict any automations from adding cards"; column limits are per view (board page).
- **Slice by**: any field except "title, reviewers, or linked pull requests" (so labels can be sliced), shown as a side panel that narrows the view and "works with the current filter" (table, board and roadmap pages).
- **Sort**: primary and secondary sort; on a sorted board "you cannot manually reorder items within a column" (board page). **Field sum**: sums of number fields and item counts per column or group (all three pages).
- **Filter grammar** (https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects, read 2026-10-06): `assignee:USERNAME`, `label:LABEL`, `FIELD:VALUE` (e.g. `status:done`), `reviewers:`, `milestone:"..."`, `repo:OWNER/REPO`, `is:open|closed|merged|issue|pr|draft`, `reason:completed|"not planned"|reopened`, `updated:@today-1w` style ranges, `type:"..."` (organisation issue types), `parent-issue:OWNER/REPO#N`, `has:FIELD`, `no:FIELD`, `title:"..."`, free text (prefix match on words), `*` wildcards, `@me`, `@current/@previous/@next` for iterations, comparisons and `..` ranges on number/date/iteration fields, `-` to negate. Several qualifiers are AND; comma lists within one qualifier are OR; "Projects does not currently support logical OR filters across multiple fields". A filtered view applies its filter values to items added from it. The same grammar drives insights charts and the archived-items list.
- Schema: `ProjectV2View { layout, filter, groupByFields, verticalGroupByFields, sortByFields, fields }`; `createProjectV2View` / `updateProjectV2View` take `name`, `layout`, `filter` and a `configuration` whose only documented member is `visibleFields` (introspected 2026-10-06), so group-by and sort are set in the UI. `gh project` has no view command.

### 3.4 Issue dependencies ("blocked by") on a board

- Dependencies are an issue feature set in the issue sidebar ("Relationships" → "Mark as blocked by" / "Mark as blocking"), also with `gh issue create --blocked-by/--blocking` and `gh issue edit --add-blocked-by ...`; "Blocked issues are marked with a 'Blocked' icon on your project boards or repository's Issues page, so you can easily identify bottlenecks" (https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies, read 2026-10-06). That icon is the only documented appearance of dependencies in a project.
- No project field, group or filter: `ProjectV2FieldType` has no dependency value (section 3.2), the filtering page has no `blocked`/`blocking` qualifier (documented absence), and the parent-issue page is the only relationship with a field. The data lives on the issue: `Issue.blockedBy`, `Issue.blocking`, `Issue.issueDependenciesSummary { blockedBy blocking totalBlockedBy totalBlocking }` (schema, 2026-10-06), and `gh issue view N --json blockedBy,blocking`.

---

## 4. Limits

| Limit | Value | Source (read 2026-10-06) |
|---|---|---|
| Items per project | "A project can contain a maximum of 50,000 items across both active views and the archive page" | Adding items to your project; Archiving items from your project; Archiving items automatically ("Once that limit has been reached, you will need to delete items") |
| Archived items | no separate cap; archived items count toward the 50,000, keep their field data ("An archived item retains all of its custom field data"), can be filtered and restored from **Archived items**, and are ignored by insights ("Insights does not track items you have archived or deleted") | Archiving items automatically; Archiving items from your project; About insights |
| Fields per project | 50, "including built-in metadata and custom fields" | About Projects |
| Options per single select | 50 | About single select fields |
| Auto-add workflows per project | 1 on GitHub Free (5 Pro/Team, 20 Enterprise) | Adding items automatically |
| Sub-issues | 100 per parent issue, 8 nesting levels | Adding sub-issues |
| Projects per user | **not documented**: no Projects page states a cap, the docs search index returns none, and `createProjectV2` carries no limit in its description | docs search 2026-10-06; schema |
| Views per project | **not documented** on "Managing your views" | Managing your views |
| Workflows other than auto-add | no count documented (each default workflow is a single toggle) | Using the built-in automations |

---

## 5. Cross-repository: two repositories of the same owner in one project

- Adding: "you can include issues and pull requests from any organization" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-items-in-your-project/adding-items-to-your-project, read 2026-10-06), by pasting a URL, by `#` search ("Select the repository where the pull request or issue is located"), by the bulk dialog **Add item from repository** with a repository dropdown, from a repository's issue list, from the issue sidebar, with `addProjectV2ItemById`, or with `gh project item-add N --owner @me --url <issue url>`. The creating-a-project page describes the usual case more narrowly ("User projects can track issues and pull requests from the repositories owned by your personal account", https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project, read 2026-10-06); no page states a prohibition on other owners' repositories (*inference*: that sentence is descriptive). Two repositories of the same owner are therefore the plain case.
- Listing the project in each repository: "You can list relevant projects in a repository. You can only list projects that are owned by the same user or organization that owns the repository" (https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/adding-your-project-to-a-repository, read 2026-10-06); `gh project link` / `linkProjectV2ToRepository` do the same (`ProjectV2.repositories` lists them). A project has one **default repository** for issues created from the board (same page).
- Automatic intake is the constraint: one repository per auto-add workflow and one workflow on Free (section 1.2), so one of the two repositories feeds the board automatically and the other does not; the Actions route needs a workflow file in each repository ("Add the workflow to each repository that you want your project to track", section 1.5) plus a PAT with `project` and `repo` scopes, or GitHub's own `actions/add-to-project` action.
- Telling the repositories apart on the board: filter with `repo:OWNER/REPO` (filtering page) and show or group by the Repository field (*inference* from the group-by exclusion list, section 3.3). Draft issues have no repository until converted ("In order to populate the repository, labels, or milestones for a draft issue, you must first convert the draft issue to an issue", Adding items to your project).
- Each add/remove and each Status change is recorded on the issue's own timeline, visible only to people with read access to the project (Adding items to your project).

---

## Sources

All read 2026-10-06.

- https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/adding-items-automatically
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/archiving-items-automatically
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/automating-projects-using-actions
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/quickstart-for-projects
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/copying-an-existing-project
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-access-to-your-projects
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-visibility-of-your-projects
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/adding-your-project-to-a-repository
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-project-templates-in-your-organization
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-items-in-your-project/adding-items-to-your-project
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-items-in-your-project/archiving-items-from-your-project
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-single-select-fields
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-parent-issue-and-sub-issue-progress-fields
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-pull-request-fields
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-the-issue-type-field
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-issue-fields
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/deleting-custom-fields
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-table-layout
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-roadmap-layout
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/managing-your-views
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-from-your-project/about-insights-for-projects
- https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues
- https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
- https://docs.github.com/en/get-started/learning-about-github/githubs-plans
- https://docs.github.com/en/graphql/reference/projects (ProjectV2, ProjectV2Workflow, ProjectV2View, ProjectV2Item, ProjectV2FieldType, ProjectV2Roles, ProjectV2Collaborator, updateProjectV2Collaborators, deleteProjectV2Workflow, markProjectV2AsTemplate, updateProjectV2ItemFieldValue, clearProjectV2ItemFieldValue), confirmed by schema introspection with `gh api graphql`
- https://docs.github.com/api/search/v1 (the docs site's search index, queried for the undocumented workflow names and for a projects-per-user limit)
- https://cli.github.com/manual/gh_project and https://cli.github.com/manual/gh_project_item-add
