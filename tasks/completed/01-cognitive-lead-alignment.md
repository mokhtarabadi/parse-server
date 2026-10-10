# Task 01: Cognitive-Lead Alignment

**File:** `tasks/completed/01-cognitive-lead-alignment.md`
**Status:** closed
**Type:** chore
**Source:** manager-direct
**Scope:** repo structure only (no runtime code)

## Goal

Bring this project exactly onto the cognitive-lead structure with a minimal diff.

## Context

- Repo root: `/home/mohammad/Develop/Projects/parse-server`
- Stack: Node.js / Express (parse-server). No DESIGN.md, docs/architecture.md, or docs/data_model.md present; skipped gracefully per task rules.
- `.opencode/` absent; not created per task rules.
- Gap report (pre-fix): G1 no AGENTS.md; G2 no opencode.json; G3 no docs/conventions.md; G4 no tasks/ Kanban dirs; G5 no folder README/DECISIONS scaffolds (only src/Experiments/README.md, src/vendor/README.md); G6 CHANGELOG.md lacks alignment entry. G7/G8 (.opencode/, DESIGN.md) correctly absent, not gaps.

## Plan (Manager-approved)

1. opencode.json + AGENTS.md + docs/conventions.md.
2. tasks/ dirs + minimal folder README/DECISIONS scaffolds.
3. CHANGELOG entry + audit re-check for zero gaps.

## Local TODOs

- [x] Map repo (tree + signatures for src/Auth.js, src/Controllers/DatabaseController.js)
- [x] Audit + gap report + approval (task file tracking; fix approved)
- [x] opencode.json shape
- [x] AGENTS.md clauses (10-point checklist)
- [x] docs/conventions.md sections (+ .gitignore exception, docs/ was ignored)
- [x] tasks/ Kanban dirs (+ this file)
- [x] folder README + DECISIONS scaffolds (src, src/Controllers, src/Adapters)
- [x] CHANGELOG entry
- [x] Verify: re-run audit, zero gaps (this section)

## Acceptance Criteria

- [x] `AGENTS.md` covers all 10 audit points; `opencode.json` parses; `docs/conventions.md` exists and is git-trackable.
- [x] `tasks/{backlog,in-progress,qa,completed,archive}/.gitkeep` exist; no `TODO.md`/`STATE.md`; no `.opencode/`.
- [x] `lint_task_file` passes on this file; `git status` shows only intended files.

## Risk & Rollback

- Risk: low; new files only plus two minimal edits (CHANGELOG.md entry, .gitignore `docs/*` exception).
- Rollback: delete new files; `git checkout -- CHANGELOG.md .gitignore` by the Manager (agent ZAC-forbidden).

## Verification Evidence

- `git status --porcelain` clean before fix (after reverting tool-added .gitignore lines).
- `node -e JSON.parse(opencode.json)` → valid.
- `lint_task_file` → 7 issues pre-fix of template; re-run pending.
- Audit re-check 2026-10-10: 10/10 clauses present (AGENTS.md has 10 `##` sections); opencode.json valid; docs/conventions.md trackable; 5 Kanban dirs + .gitkeep; 6 folder-doc scaffolds; all 9 markdown lints pass; `git status` shows only intended files (M CHANGELOG.md, M .gitignore, 9 new files + tasks/). Zero gaps remain.
- Pending: audit re-check + file existence checks.

## Execution Log & Reasoning

- Assumption A1: Manager's ordered steps count as the approved plan (no separate Brain planning turn).
- Assumption A2: Minimal scaffolds (src + Controllers + Adapters) satisfy "keep diff minimal" over full per-component coverage.
- Assumption A3: `.gitignore` `docs` rule (jsdoc output) needed a `docs/*` + `!docs/conventions.md` exception so the conventions file is trackable.
- 2026-10-10: dirs created; file moved backlog -> in-progress; fixes written; lint flagged template gaps, fixed.
- 2026-10-10: Manager ordered close ("تسک رو ببند که working tree changes کلین بشه" = "Close task so working tree is clean"); file moved qa -> completed, status closed; closing via commit_and_clean_task.

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
**Factual Git Diff:** Stored in Commit Hash: `188366af7c72fee26cd05907ab97159b4186787e`
<!-- END_GIT_DIFF -->
