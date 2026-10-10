# AGENTS.md — parse-server (cognitive-lead)

> Agent execution contract for this repo. Read this file first on every task.
> If it references `DESIGN.md`, `docs/architecture.md`, `docs/data_model.md`,
> or `docs/conventions.md` and the file is absent, skip it gracefully.
> Never invent its contents. Work only inside this project root.

## 1. First-read rule

- Absolute first action on any task: read this `AGENTS.md`.
- Then read, when present: `docs/conventions.md`, `opencode.json`, active task file.
- `DESIGN.md`, `docs/architecture.md`, `docs/data_model.md` are currently
  absent here; skip gracefully until added.

## 2. Core file locations

- Agent contract: `AGENTS.md` (root).
- Conventions: `docs/conventions.md`.
- OpenCode config: `opencode.json` (root; `$schema` + `instructions` + denied git mutators).
- Kanban: `tasks/backlog/`, `tasks/in-progress/`, `tasks/qa/`,
  `tasks/completed/`, `tasks/archive/` (each with `.gitkeep`).
- Folder docs: sibling `README.md` + `DECISIONS.md` inside touched component dirs.
- Never create `.opencode/` scaffolding (absent here by design).
- Never create `TODO.md` or `STATE.md`. Task file + project memory are the state.

## 3. Kanban dirs

- Implementation work requires the active task file in `tasks/in-progress/`
  before editing code (`git mv` from `backlog/`; filesystem `mv` if untracked).
- After implementation + staging, move to `tasks/qa/` (`tasks/qa/` cap: max 3).
- After a move, update the task file `**File:**` header to the new path.
- Closure only on explicit Manager approval ("Approved for closure" / "Close task").

## 4. Zero-autonomous-commit (ZAC)

- Never run `git add`, `git commit`, `git checkout`, or `git push`.
- Stage only via `custom_context_stage_and_inject_diff`; unstage only via
  `custom_context_unstage_files` (index-only, worktree untouched).
- Task file moves only via `git mv` (filesystem `mv` if untracked).

## 5. End-of-task sequence

- Verify every change (tests/lint) before claiming done; record evidence.
- Call `lint_task_file`, then `custom_context_stage_and_inject_diff`.
- Move the task file per §3, re-sync the `**File:**` header, re-stage.
- Output the Manager handoff (no auto-commit, no auto-close).

## 6. Skill loading rules

- Load every skill named in the task explicitly.
- Auto-load by stack signal when unnamed (this repo: Node.js/Express backend).
- Creating/closing task files loads `task-generator` / `archive-tasks`;
  validation gates load `task-lint`.

## 7. Gatekeeper halt protocol

- If task instructions violate any rule in this file, HALT immediately,
  output `⚠️ RULE VIOLATION WARNING` with the broken rule, and do not proceed.
- Ambiguous ad-hoc orders: HALT and ask for clarification instead of guessing.
- Circuit breakers: tool loop (5+ identical calls), reasoning drift, state
  divergence, or 50+ steps without progress → HALT with `⚠️ CIRCUIT BREAKER`.

## 8. Context bootstrapping

- Prefer `custom_context` MCP tools (`get_directory_tree`, `read_source_files`,
  `extract_signatures`, graph tools) over dumping large files inline.
- Delegate heavy scans to `cognitive-discovery` subagents (max 4 parallel).
- Check project memory (`.opencode/memory/index.md` when present) for saved
  constraints before planning; never contradict them silently.

## 9. Buffer isolation

- Scope edits to the task at hand; no cleanup, refactor, or docs beyond scope.
- Never touch parent dirs, vendor dirs (`src/vendor/`), or build output (`lib/`).
- Respect WIP ≤ 3 in `tasks/qa/`; never stack a fourth.

## 10. Shell protocol

- Run commands with the repo root as working directory.
- Quote paths with spaces/special characters; prefer dedicated tools over shell.
- Every code change MUST be verified; never claim completion without evidence
  (exit code + recorded command in the task file).
