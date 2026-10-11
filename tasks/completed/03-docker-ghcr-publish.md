# Task 03: Docker Publish to GHCR

**File:** `tasks/completed/03-docker-ghcr-publish.md`
**Status:** closed
**Type:** chore
**Source:** manager-direct
**Scope:** `.github/workflows/` GHCR migration + forced alpha image (no release)

## Goal

Publish parse-server alpha as a Docker image to GitHub Container Registry and migrate both Docker workflows off Docker Hub.

## Context

- Branch `alpha`, remote `origin` = `mokhtarabadi/parse-server`. No release cut (alpha only).
- Workflows migrated (uncommitted): `release-automated.yml` + `release-manual-docker.yml` → `REGISTRY: ghcr.io`, `IMAGE_NAME: mokhtarabadi/parse-server`, login via `github.actor` + `GITHUB_TOKEN` (packages:write already granted).
- Image build running in background (native amd64, tags `alpha` + `7301b3f`).

## Local TODOs

- [x] Migrate both workflows to GHCR (+ YAML validation)
- [x] Start forced image build
- [x] Push both tags to `ghcr.io/mokhtarabadi/parse-server`
- [x] Verify push (manifest inspect) + record evidence
- [x] Brain auto pipeline: QA turn → fix loop → review turn
- [ ] Stage + move to qa

## Acceptance Criteria

- [ ] `ghcr.io/mokhtarabadi/parse-server:alpha` and `:7301b3f` pushed and inspectable.
- [ ] Workflows valid YAML; no `docker.io` / `DOCKERHUB_*` references remain in either file.
- [ ] Brain QA verdict + review verdict recorded below.
- [ ] `lint_task_file` passes; ZAC holds (no git mutators by hand).

## Risk & Rollback

- Risk: low. Workflow edits are uncommitted (CI unaffected until merged). Image push is additive (new tags, no overwrite of release tags).
- Rollback: revert workflow hunks; delete pushed tags via GHCR UI if needed (Manager owns it).

## Verification Evidence

- `python3 yaml.safe_load` on both workflows → `YAML_OK`.
- `docker build -t ghcr.io/mokhtarabadi/parse-server:alpha -t ...:7301b3f .` → exit 0.
- `docker push` both tags → exit 0, digest `sha256:65baf9f2…` (856 bytes).
- `docker manifest inspect ...:alpha` → linux/amd64 present, exit 0.
- `grep docker.io|DOCKERHUB` in both workflows → no matches.
- Brain QA: QA_PASSED. F1 auth (GITHUB_TOKEN + packages:write) holds; F2 names/tags hold. Advisory R1: forced alpha image is amd64-only (matches Assumption A2; CI still multi-arch). Advisory R2: GHCR package may default private — could not verify (token lacks read:packages); Manager to check Packages page if public pulls needed. No fix loop required.
- Brain review: PO_REVIEW_PENDING (technically approved; I1/I2 restate QA advisories; no blockers).
- Closure: Manager accept quote 'Approved for closure' received; moving qa → completed via commit_and_clean_task.

## Execution Log & Reasoning

- Assumption A1: GHCR (`ghcr.io`) satisfies "push it to our github".
- Assumption A2: single-arch native build acceptable for forced alpha image (CI still builds multi-arch on release).
- 2026-10-11: task created; workflows migrated; build running; pipeline armed.

## Factual Git Diff

<!-- BEGIN_GIT_DIFF -->
**Factual Git Diff:** Stored in Commit Hash: `816e4524be36e4f7a955d53db0299926ae9f8844`
<!-- END_GIT_DIFF -->
