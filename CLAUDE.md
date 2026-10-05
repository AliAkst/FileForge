# FileForge — local-first file conversion app

## Mission
A user-friendly app for the most common business file conversions. The user drags & drops
(or picks) files, chooses/auto-detects the target format, and downloads the result.
Everything is self-hosted. Uploaded files are auto-deleted after a retention period (default 60 min).

## Scope
Conversions (MVP): PDF→DOCX, DOCX→PDF, PDF→XLSX (table extraction), XLSX→PDF, XLSX↔CSV,
PPTX→PDF, PDF→PNG/JPG, PNG/JPG→PDF, HTML→PDF, TXT→PDF/DOCX.
PDF tools: merge, split, extract pages, rotate, compress, protect/unlock, watermark,
OCR (scanned PDF → searchable PDF / DOCX, languages tur+eng).
UX extras: multi-file batch + ZIP download, live progress, conversion history, auto-delete
countdown, dark mode, TR/EN i18n, strict validation (extension + magic bytes + size limit).

## Stack (changing it requires an ADR in docs/DECISIONS.md)
- Backend: Python 3.12, FastAPI, Pydantic v2, uvicorn, pytest, ruff, mypy.
- Converters: pdf2docx, python-docx, openpyxl, pandas, pdfplumber, pikepdf, pypdfium2,
  img2pdf, Pillow, ocrmypdf (tesseract tur+eng); LibreOffice headless (soffice) for Office→PDF.
- Frontend: React + TypeScript + Vite + Tailwind, react-dropzone, TanStack Query, i18next, vitest.
- Infra: Docker + docker-compose (api, worker, redis, web/nginx), GitHub Actions CI.
- Log every dependency and its license in docs/LICENSES.md (flag AGPL/GPL).

## Architecture — Clean Architecture, dependencies point INWARD only
backend/app/domain/          entities, value objects, ports (interfaces). NO third-party imports.
backend/app/application/     use cases: SubmitConversion, GetJobStatus, ListCapabilities,
                             DownloadResult, CleanupExpired
backend/app/infrastructure/  converters/ (one file per converter), storage/, queue/, config/
backend/app/presentation/    FastAPI routers, request/response schemas, DI wiring
backend/tests/{unit,integration,fixtures}
frontend/src/{features,components,api,i18n}
docker/, scripts/, docs/

### Extensibility contract (MOST IMPORTANT RULE)
- Every conversion implements the `Converter` port: id, supported source formats, target format,
  options schema, `convert(input_path, output_dir, options) -> ConversionResult`.
- Converters self-register with `@register_converter`; the registry auto-discovers modules in
  infrastructure/converters/.
- `GET /api/v1/capabilities` lists all conversions with option schemas. The frontend builds its
  UI from it. => A new conversion = ONE new file + tests + a line in docs.
  ZERO changes to API routes, use cases or frontend.
- Job lifecycle: queued → running → succeeded | failed | expired.
- Queue and storage are ports with swappable adapters (in-process → Redis; local disk → S3 later).
- API is versioned (/api/v1), uses ONE error format (RFC 7807 problem details), OpenAPI enabled.
- One check command for everything: `python scripts/check.py` (ruff + mypy + pytest, plus
  frontend lint/tsc/vitest once frontend exists). It must exit non-zero on any failure.

## Team (subagents in .claude/agents/)
architect, backend-dev, frontend-dev, devops, tester, reviewer, debugger.
YOU (the main session) are the ORCHESTRATOR. Subagents cannot call other subagents, so only you
delegate (Task tool). Do not write production code yourself except trivial one-line edits.
When delegating, always pass: task id + text, acceptance criteria, and the exact file paths involved.
Fallback: if delegation fails twice, act as that role yourself — read .claude/agents/<role>.md
and follow it — then continue.

## DEV LOOP (repeat per task)
1. PICK    first "- [~]" task in docs/TASKS.md, else first "- [ ]". Mark it "- [~]".
2. DESIGN  if the task adds a new module/interface/endpoint → architect. Otherwise skip.
3. BUILD   backend-dev / frontend-dev / devops (they also write unit tests for their code).
4. TEST    tester runs `python scripts/check.py`, adds edge-case tests, reports PASS/FAIL.
5. FIX     on FAIL → debugger → TEST again. Max 3 rounds, then mark "- [!]", write the blocker
           in docs/PROGRESS.md, commit WIP, go to step 1.
6. REVIEW  reviewer inspects `git diff`. CHANGES_REQUESTED → debugger/dev → TEST → REVIEW (max 2 rounds).
7. CLOSE   mark "- [x]", append to docs/PROGRESS.md (date, task id, summary, files), then
           `git commit -m "feat(T-012): ..."` (conventional commits, one commit per task).
Every 5th completed task: ARCHITECTURE AUDIT — reviewer checks layer violations, duplication,
leaky abstractions; architect turns findings into new tasks at the top of the backlog.

## Phases (backlog in docs/TASKS.md, format: `- [ ] T-001 [area] description | acceptance: ...`)
1 Walking skeleton: repo, config, Converter port + registry, ONE converter (DOCX→PDF) end-to-end
  via API, minimal frontend dropzone, check.py, first tests.
2 Core converters (all MVP conversions).   3 PDF tools.
4 Frontend UX: dropzone, batch, progress, history, dark mode, i18n.
5 Async jobs, storage + auto-cleanup, security (limits, magic bytes, rate limit, filename sanitizing),
  Redis worker adapter.
6 Docker/compose, CI, README, end-to-end smoke test.
7 Extras: OCR, watermark, optional API keys, metrics/health, anything cheap that adds value.

## Rules for working with a small local model (IMPORTANT)
- ONE task at a time; each task ≤ 5 files / ~150 changed lines. Split bigger tasks first.
- Never read the whole repo. Use Glob/Grep, open only the files you need.
- State lives in files (TASKS.md, PROGRESS.md, DECISIONS.md), not in your memory. Re-read them when unsure.
- Never claim success without having seen the real command output.
- Never delete/skip/weaken tests to get green. Converters are tested on real sample files
  (generated by scripts/make_fixtures.py), not only with mocks.
- Write complete files. No placeholders like "TODO", "pass  # implement", or "...rest of code".
- Prefer boring, well-known solutions. No new dependency without a docs/LICENSES.md entry.
- Same error 3 times → stop, mark the task "[!]", note the blocker, move on.
- Do not ask the user questions. Make a reasonable assumption and log it in docs/DECISIONS.md.
- If context gets large, run /compact (state is safe in files).

## Definition of Done
check.py passes · new code has tests · reviewer verdict APPROVE · docs updated if behavior or
architecture changed · task closed in TASKS.md and PROGRESS.md · committed.