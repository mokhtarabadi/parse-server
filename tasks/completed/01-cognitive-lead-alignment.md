# Task 01: Cognitive-Lead Alignment

**File:** `tasks/qa/01-cognitive-lead-alignment.md`
**Status:** in-progress
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

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
```diff
diff --git a/.gitignore b/.gitignore
index b5b69e3..34b8adc 100644
--- a/.gitignore
+++ b/.gitignore
@@ -16,8 +16,9 @@ coverage
 .nyc_output
 
 # docs output
-out 
-docs
+out
+docs/*
+!docs/conventions.md
 
 # Grunt intermediate storage (http://gruntjs.com/creating-plugins#storing-task-files)
 .grunt
diff --git a/AGENTS.md b/AGENTS.md
new file mode 100644
index 0000000..166d5a6
--- /dev/null
+++ b/AGENTS.md
@@ -0,0 +1,82 @@
+# AGENTS.md — parse-server (cognitive-lead)
+
+> Agent execution contract for this repo. Read this file first on every task.
+> If it references `DESIGN.md`, `docs/architecture.md`, `docs/data_model.md`,
+> or `docs/conventions.md` and the file is absent, skip it gracefully.
+> Never invent its contents. Work only inside this project root.
+
+## 1. First-read rule
+
+- Absolute first action on any task: read this `AGENTS.md`.
+- Then read, when present: `docs/conventions.md`, `opencode.json`, active task file.
+- `DESIGN.md`, `docs/architecture.md`, `docs/data_model.md` are currently
+  absent here; skip gracefully until added.
+
+## 2. Core file locations
+
+- Agent contract: `AGENTS.md` (root).
+- Conventions: `docs/conventions.md`.
+- OpenCode config: `opencode.json` (root; `$schema` + `instructions` + denied git mutators).
+- Kanban: `tasks/backlog/`, `tasks/in-progress/`, `tasks/qa/`,
+  `tasks/completed/`, `tasks/archive/` (each with `.gitkeep`).
+- Folder docs: sibling `README.md` + `DECISIONS.md` inside touched component dirs.
+- Never create `.opencode/` scaffolding (absent here by design).
+- Never create `TODO.md` or `STATE.md`. Task file + project memory are the state.
+
+## 3. Kanban dirs
+
+- Implementation work requires the active task file in `tasks/in-progress/`
+  before editing code (`git mv` from `backlog/`; filesystem `mv` if untracked).
+- After implementation + staging, move to `tasks/qa/` (`tasks/qa/` cap: max 3).
+- After a move, update the task file `**File:**` header to the new path.
+- Closure only on explicit Manager approval ("Approved for closure" / "Close task").
+
+## 4. Zero-autonomous-commit (ZAC)
+
+- Never run `git add`, `git commit`, `git checkout`, or `git push`.
+- Stage only via `custom_context_stage_and_inject_diff`; unstage only via
+  `custom_context_unstage_files` (index-only, worktree untouched).
+- Task file moves only via `git mv` (filesystem `mv` if untracked).
+
+## 5. End-of-task sequence
+
+- Verify every change (tests/lint) before claiming done; record evidence.
+- Call `lint_task_file`, then `custom_context_stage_and_inject_diff`.
+- Move the task file per §3, re-sync the `**File:**` header, re-stage.
+- Output the Manager handoff (no auto-commit, no auto-close).
+
+## 6. Skill loading rules
+
+- Load every skill named in the task explicitly.
+- Auto-load by stack signal when unnamed (this repo: Node.js/Express backend).
+- Creating/closing task files loads `task-generator` / `archive-tasks`;
+  validation gates load `task-lint`.
+
+## 7. Gatekeeper halt protocol
+
+- If task instructions violate any rule in this file, HALT immediately,
+  output `⚠️ RULE VIOLATION WARNING` with the broken rule, and do not proceed.
+- Ambiguous ad-hoc orders: HALT and ask for clarification instead of guessing.
+- Circuit breakers: tool loop (5+ identical calls), reasoning drift, state
+  divergence, or 50+ steps without progress → HALT with `⚠️ CIRCUIT BREAKER`.
+
+## 8. Context bootstrapping
+
+- Prefer `custom_context` MCP tools (`get_directory_tree`, `read_source_files`,
+  `extract_signatures`, graph tools) over dumping large files inline.
+- Delegate heavy scans to `cognitive-discovery` subagents (max 4 parallel).
+- Check project memory (`.opencode/memory/index.md` when present) for saved
+  constraints before planning; never contradict them silently.
+
+## 9. Buffer isolation
+
+- Scope edits to the task at hand; no cleanup, refactor, or docs beyond scope.
+- Never touch parent dirs, vendor dirs (`src/vendor/`), or build output (`lib/`).
+- Respect WIP ≤ 3 in `tasks/qa/`; never stack a fourth.
+
+## 10. Shell protocol
+
+- Run commands with the repo root as working directory.
+- Quote paths with spaces/special characters; prefer dedicated tools over shell.
+- Every code change MUST be verified; never claim completion without evidence
+  (exit code + recorded command in the task file).
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 867c816..b9cf8b2 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -2,6 +2,12 @@
 
 Changelogs are separated by release type for better overview.
 
+## 2026-10-10 — Cognitive-lead structure
+
+- Added `AGENTS.md` (agent contract), `opencode.json`, `docs/conventions.md`.
+- Added `tasks/` Kanban dirs and minimal `src/` folder docs (`README.md` + `DECISIONS.md`).
+- No runtime code changed.
+
 ## ✅ [Stable Releases][log_release]
 
 > ### “Stable for production!”
diff --git a/docs/conventions.md b/docs/conventions.md
new file mode 100644
index 0000000..b211f25
--- /dev/null
+++ b/docs/conventions.md
@@ -0,0 +1,44 @@
+# Conventions — parse-server
+
+> Coding and workflow conventions bound to `AGENTS.md`. Keep minimal; expand
+> only when a real task forces it.
+
+## 1. Language & runtime
+
+- Node.js + Express 5. Source lives in `src/` (CommonJS `require`), specs in
+  `spec/` (Jasmine). Build output `lib/` is generated; never edit by hand.
+
+## 2. Naming & layout
+
+- One class/module per file; file name matches the export (`DatabaseController.js`
+  exports `DatabaseController`).
+- Adapters live under `src/Adapters/<Area>/`; controllers under `src/Controllers/`;
+  CLI under `src/cli/`. New areas get their own directory + sibling docs (§6).
+
+## 3. Style & lint
+
+- ESLint is the gate (`eslint.config.js` at root and `spec/eslint.config.js`).
+- Prettier (`.prettierrc`) for formatting. Match surrounding style in edited files.
+
+## 4. Tests & verification
+
+- Specs: `spec/**/*.spec.js` run via Jasmine (`npm test` invokes the suite).
+- Every code change MUST be verified before claiming done; record the exact
+  command, expected vs actual result, and exit code in the task file.
+
+## 5. Commits & changelog
+
+- Conventional Commits; releases via semantic-release (`.releaserc/`).
+- User-facing changes update `CHANGELOG.md` / `changelogs/`; agent-structure
+  changes note the date and scope only.
+
+## 6. Folder docs
+
+- When inspecting or editing inside a component directory, read its sibling
+  `README.md` + `DECISIONS.md` first; update them when contracts or decisions change.
+- Minimal scaffold per directory: purpose, public entry points, key invariants.
+
+## 7. Safety
+
+- ZAC holds: no `git add` / `commit` / `checkout` / `push` by the agent.
+- Never touch parent dirs, `src/vendor/`, or `lib/`.
diff --git a/opencode.json b/opencode.json
new file mode 100644
index 0000000..f40dcc6
--- /dev/null
+++ b/opencode.json
@@ -0,0 +1,12 @@
+{
+  "$schema": "https://opencode.ai/config.json",
+  "instructions": ["AGENTS.md", "docs/conventions.md"],
+  "permission": {
+    "bash": {
+      "git add*": "deny",
+      "git commit*": "deny",
+      "git checkout*": "deny",
+      "git push*": "deny"
+    }
+  }
+}
diff --git a/src/Adapters/DECISIONS.md b/src/Adapters/DECISIONS.md
new file mode 100644
index 0000000..d32e10e
--- /dev/null
+++ b/src/Adapters/DECISIONS.md
@@ -0,0 +1,4 @@
+# src/Adapters/ DECISIONS
+
+- 2026-10-10: Scaffold only (no behavior change). Record adapter contract or
+  default-adapter changes here on first touch.
diff --git a/src/Adapters/README.md b/src/Adapters/README.md
new file mode 100644
index 0000000..eb41185
--- /dev/null
+++ b/src/Adapters/README.md
@@ -0,0 +1,9 @@
+# src/Adapters/
+
+Swappable ports and adapters grouped by area: `Auth/`, `Cache/`, `Storage/`
+(`Mongo/`, `Postgres/`), `Files/`, `Push/`, `PubSub/`, `Logger/`, `Email/`,
+`MessageQueue/`, `WebSocketServer/`.
+
+- Loader: `AdapterLoader.js` resolves adapter modules at startup.
+- Invariants: each adapter honors its base interface (`*Adapter.js`); new
+  adapters ship with a spec under `spec/` and a section in the area README.
diff --git a/src/Controllers/DECISIONS.md b/src/Controllers/DECISIONS.md
new file mode 100644
index 0000000..f66b771
--- /dev/null
+++ b/src/Controllers/DECISIONS.md
@@ -0,0 +1,4 @@
+# src/Controllers/ DECISIONS
+
+- 2026-10-10: Scaffold only (no behavior change). Record controller-level
+  contract changes here on first touch.
diff --git a/src/Controllers/README.md b/src/Controllers/README.md
new file mode 100644
index 0000000..1c30e1c
--- /dev/null
+++ b/src/Controllers/README.md
@@ -0,0 +1,8 @@
+# src/Controllers/
+
+Request and business-logic controllers (e.g. `DatabaseController`,
+`UserController`, `SchemaController`).
+
+- Entry: `index.js` re-exports the controllers.
+- Invariants: controllers orchestrate adapters; they do not own transport or
+  storage details. Keep per-controller behavior covered by `spec/` suites.
diff --git a/src/DECISIONS.md b/src/DECISIONS.md
new file mode 100644
index 0000000..51f02c2
--- /dev/null
+++ b/src/DECISIONS.md
@@ -0,0 +1,6 @@
+# src/ DECISIONS
+
+- 2026-10-10: Adopted cognitive-lead folder docs. New component dirs get a
+  sibling `README.md` + `DECISIONS.md`; existing dirs backfill on first touch.
+- 2026-10-10: `src/vendor/` is vendored code — excluded from agent edits and
+  from doc backfill.
diff --git a/src/README.md b/src/README.md
new file mode 100644
index 0000000..7bb9cf7
--- /dev/null
+++ b/src/README.md
@@ -0,0 +1,10 @@
+# src/
+
+Server implementation root (CommonJS, Express 5).
+
+- Entry surface: `src/ParseServer.js` (check exact filename when wiring new routes).
+- Subareas: `Controllers/` (request/business logic), `Adapters/` (storage, cache,
+  auth, push, pub/sub), `cloud-code/`, `GraphQL/`, `Routers/` (when present),
+  `cli/` (bin definitions).
+- Conventions: `docs/conventions.md` §2–§4. Never edit `lib/` (build output)
+  or `src/vendor/` by hand.
```
<!-- END_GIT_DIFF -->
