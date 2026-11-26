/**
 * The Claim board, the entry point of its modules: every importer outside
 * them (the CLIs, `spec-check`, `spec-verdict`, the tests) reads the board
 * here, and this file holds re-exports only. One module per subject, none
 * of which imports this one:
 *
 * - `board-definition.ts`: the board as code, one Projects (v2) project on
 *   the owner's account over both repositories (ADR 0016), and
 *   `board:setup`, which makes the project match it.
 * - `board-issues.ts`: an issue as the board reads it, the Status rules
 *   (`statusOf`) and the label pair of an open Spec (`specLabelsOf`).
 * - `board-reconcile.ts`: `board:reconcile`, the board's single writer of
 *   Status, membership and archiving included.
 * - `board-labels.ts`: what `board:labels` writes with the App's token, the
 *   label pair of an open Spec and the Issue status of every open issue.
 * - `board-request.ts`: a request, the mutations, the error, and how a
 *   request is printed and sent.
 *
 * The GraphQL transport and the pager are `github-graphql.ts`.
 */
export {
  applyBoardSetup,
  assumedState,
  BOARD_APP_LOGIN,
  BOARD_OWNER,
  BOARD_README,
  BOARD_REPOSITORIES,
  BOARD_TITLE,
  BOARD_VIEWS,
  CLAIM_DOC_URL,
  freshProject,
  planBoardSetup,
  readBoardState,
  readProjectState,
  STATUS_FIELD,
  STATUS_OPTIONS,
  type BoardSetupPlan,
  type BoardState,
  type BoardView,
  type OptionColor,
  type ProjectField,
  type ProjectState,
  type ProjectView,
  type SelectOption,
  type Status,
  type StatusOption,
  type ViewLayout,
} from "./board-definition.js";
export {
  issueKey,
  issueLookup,
  NEEDS_SPLIT_LABEL,
  PARENT_RULE_ORDER,
  readOpenIssues,
  SPEC_LABEL,
  specLabelsOf,
  statusOf,
  type BoardIssue,
  type BoardPullRequest,
  type IssueLookup,
  type IssueRef,
  type LabelChange,
  type ParentIssue,
  type SubIssue,
} from "./board-issues.js";
export {
  applyBoardLabels,
  applyIssueStatuses,
  ISSUE_STATUS_OF,
  planBoardLabels,
  planIssueStatuses,
  readIssueStatuses,
  readLabelState,
  type BoardLabelPlan,
  type IdsByRepository,
  type IssueStatusPlan,
  type IssueStatusState,
  type LabelState,
  type OpenIssueStatus,
} from "./board-labels.js";
export {
  applyBoardReconcile,
  ARCHIVE_AFTER_DAYS,
  MAX_DELETES,
  planBoardReconcile,
  readProjectItems,
  readReconcileState,
  type BoardReconcilePlan,
  type ItemContent,
  type ProjectItem,
  type ReconcileLimits,
  type ReconcileRequest,
  type ReconcileState,
} from "./board-reconcile.js";
export {
  BOARD_MUTATIONS,
  BoardError,
  describeRequest,
  type BoardRequest,
} from "./board-request.js";
