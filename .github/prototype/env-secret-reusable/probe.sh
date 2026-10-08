#!/usr/bin/env bash
# PROTOTYPE, throwaway (#551). Drives the probe from this folder:
#   bash probe.sh setup     two private repositories, the environment, its secret
#   bash probe.sh round1    environment secret only, then run the caller
#   bash probe.sh round2    add a same-named repository secret, run again
#   bash probe.sh teardown  delete both repositories (needs delete_repo scope)
# Each round prints the run URL and one line per variant: non-empty and
# length only. Environment value length 9, repository value length 21.
set -euo pipefail
OWNER=phmilk
REUSABLE=$OWNER/probe-env-secret-reusable
CALLER=$OWNER/probe-env-secret-caller
HERE=$(cd "$(dirname "$0")" && pwd)

push_dir() { # $1 local folder, $2 owner/repo
  local tmp
  tmp=$(mktemp -d)
  cp -r "$1/." "$tmp"
  git -C "$tmp" init -q -b main
  git -C "$tmp" add -A
  git -C "$tmp" -c user.name=probe -c user.email=probe@invalid commit -q -m "probe"
  git -C "$tmp" push -q "https://github.com/$2.git" main
  rm -rf "$tmp"
}

run_round() { # $1 round name
  gh workflow run probe.yml --repo "$CALLER" --ref main
  sleep 5
  local id
  id=$(gh run list --repo "$CALLER" --workflow probe.yml --limit 1 --json databaseId --jq '.[0].databaseId')
  gh run watch "$id" --repo "$CALLER" --exit-status >/dev/null || true
  echo "$1: https://github.com/$CALLER/actions/runs/$id"
  gh run view "$id" --repo "$CALLER" --log | grep -o 'variant=[a-z-]* nonempty=[a-z]* length=[0-9]*' | sort -u
  gh run view "$id" --repo "$CALLER" --json jobs --jq '.jobs[] | "  job \(.name): \(.conclusion)"'
}

case "${1:-}" in
  setup)
    gh repo create "$REUSABLE" --private
    push_dir "$HERE/reusable" "$REUSABLE"
    # A private repository's workflows are callable from the owner's other
    # private repositories only with this access level.
    gh api -X PUT "repos/$REUSABLE/actions/permissions/access" -f access_level=user
    gh repo create "$CALLER" --private
    push_dir "$HERE/caller" "$CALLER"
    # As the Template's `board`: its default branch alone.
    gh api -X PUT "repos/$CALLER/environments/board" --input "$HERE/environment.json"
    gh api -X POST "repos/$CALLER/environments/board/deployment-branch-policies" -f name=main -f type=branch
    gh secret set APP_PRIVATE_KEY --repo "$CALLER" --env board --body probe-123
    ;;
  round1)
    gh secret delete APP_PRIVATE_KEY --repo "$CALLER" 2>/dev/null || true
    run_round round1-environment-only
    ;;
  round2)
    gh secret set APP_PRIVATE_KEY --repo "$CALLER" --body repo-probe-value-0001
    run_round round2-environment-and-repository
    ;;
  teardown)
    gh repo delete "$CALLER" --yes
    gh repo delete "$REUSABLE" --yes
    ;;
  *) echo "usage: probe.sh setup|round1|round2|teardown" >&2; exit 2 ;;
esac
