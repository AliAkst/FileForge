# Project Tasks

This file contains the complete backlog for FileForge. Tasks are organized by phase.

## Phase 1: Walking Skeleton
- [x] T-001 [infra] Setup directory structure and configuration (env, settings) | acceptance: directory structure matches CLAUDE.md, .env.example exists, and settings are loadable.
- [ ] T-002 [domain] Define core domain entities and ports (Job, ConversionResult, Converter) | acceptance: `backend/app/domain/` contains the protocol/interface definitions with NO third-party imports.
- [ ] T-003 [infra] Implement Converter registry and auto-discovery | acceptance: A decorator `@register_converter` can be used and the registry can list all discovered converters in a module.
- [ ] T-004 [infra] Implement DOCX to PDF converter (using LibreOffice/soffice) | acceptance: A functional converter class exists that can convert a sample DOCX to PDF.
- [ ] T-005 [app] Implement SubmitConversion use case | acceptance: Use case accepts conversion request and returns a Job ID.
- [ ] T-006 [app] Implement GetJobStatus use case | acceptance: Use case returns the current state of a job.
- [ ] T-007 [presentation] Implement FastAPI router and schemas for conversion/jobs | acceptance: API endpoints `/api/v1/convert` and `/api/v1/jobs/{id}` are available and follow RFC 7807 for errors.
- [ ] T-008 [infra] Implement minimal in-memory JobRepository and FileStorage | acceptance: Jobs and files can be stored and retrieved in RAM/local disk for initial testing.
- [ ] T-009 [infra] Implement `scripts/check.py` (ruff, mypy, pytest) | acceptance: Command runs all three and exits 0 on success, non-zero on failure.
- [ ] T-010 [frontend] Setup React + Vite + Tailwind boilerplate | acceptance: Frontend dev server runs and displays a "Hello World" page with Tailwind styling.
- [ ] T-011 [frontend] Implement minimal file dropzone component | acceptance: User can drag and drop a file into the browser.
- [ ] T-012 [integration] End-to-end test: Submit DOCX -> Get Status -> Download PDF | acceptance: A single end-to-end flow works from frontend to backend and back.

## Phase 2: Core Converters (MVP)
- [ ] T-013 [infra] Implement PDF to DOCX converter | acceptance: Successful conversion of PDF to DOCX.
- [ ] T-014 [infra] Implement PDF to XLSX converter (table extraction) | acceptance: Successful extraction of tables from PDF to XLSX.
- [ ] T-015 [infra] Implement XLSX to PDF converter | acceptance: Successful conversion of XLSX to PDF.
- [ ] T-016 [infra] Implement XLSX <-> CSV converter | acceptance: Bidirectional conversion works.
- [ ] T-017 [infra] Implement PPTX to PDF converter | acceptance: Successful conversion of PPTX to PDF.
- [ ] T-018 [infra] Implement PDF to PNG/JPG converter | acceptance: Successful conversion of PDF pages to images.
- [ ] T-019 [infra] Implement PNG/JPG to PDF converter | acceptance: Successful conversion of images to a single PDF.
- [ ] T-020 [infra] Implement HTML to PDF converter | acceptance: Successful conversion of HTML content to PDF.
- [ ] T-021 [infra] Implement TXT to PDF/DOCX converter | acceptance: Successful conversion of plain text.

## Phase 3: PDF Tools
- [ ] T-022 [infra] Implement PDF Merge tool | acceptance: Merges multiple PDFs into one.
- [ ] T-023 [infra] Implement PDF Split tool | acceptance: Splits a PDF into individual pages/ranges.
- [ ] T-024 [infra] Implement PDF Extract Pages tool | acceptance: Extracts specific page ranges.
- [ ] T-025 [infra] Implement PDF Rotate tool | acceptance: Rotates PDF pages.
- [ ] T-026 [infra] Implement PDF Compress tool | acceptance: Reduces PDF file size.
- [ ] T-027 [infra] Implement PDF Protect/Unlock tool | acceptance: Adds/removes password protection.
- [ ] T-028 [infra] Implement PDF Watermark tool | acceptance: Adds text/image watermarks.

## Phase 4: Frontend UX
- [ ] T-029 [frontend] Implement Batch conversion UI | acceptance: User can select multiple files and see a queue/list.
- [ ] T-030 [frontend] Implement Live progress bar/status | acceptance: Real-time updates for conversion progress.
- [ ] T-031 [frontend] Implement Conversion History view | acceptance: User can see previous successful conversions.
- [ ] T-032 [frontend] Implement Dark Mode | acceptance: Toggle between light and dark themes.
- [ ] T-033 [frontend] Implement i18n (TR/EN) | acceptance: Switch language updates all UI strings.

## Phase 5: Robustness & Async
- [ ] T-034 [infra] Implement Redis-based Queue adapter | acceptance: Jobs are persisted in Redis.
- [ ] T-035 [infra] Implement worker process (Celery/Task-runner) | acceptance: A separate process picks up jobs from Redis and executes converters.
- [ ] T-036 [app] Implement Auto-cleanup service | acceptance: Files and job records are deleted after the retention period.
- [ ] T-037 [infra] Implement S3-compatible storage adapter | acceptance: Files can be stored in an S3 bucket.
- [ ] T-038 [security] Implement file validation (magic bytes, extension) | acceptance: Rejects files that don't match their extension.
- [ ] T-039 [security] Implement size limits and rate limiting | acceptance: Prevents oversized uploads and API abuse.
- [ ] T-040 [security] Implement filename sanitizing | acceptance: Prevents path traversal and malicious filenames.

## Phase 6: DevOps & CI/CD
- [ ] T-041 [docker] Create Dockerfile for API | acceptance: API image builds and runs.
- [ ] T-042 [docker] Create Dockerfile for Worker | acceptance: Worker image builds and runs.
- [ ] T-043 [docker] Create docker-compose.yml (api, worker, redis, web) | acceptance: `docker-compose up` starts the whole stack.
- [ ] T-044 [ci] Setup GitHub Actions workflow | acceptance: Code is automatically linted and tested on push.
- [ ] T-045 [docs] Complete README.md | acceptance: Clear instructions for local setup and running the app.

## Phase 7: Extras
- [ ] T-046 [infra] Implement OCR (ocrmypdf) | acceptance: Scanned PDFs become searchable.
- [ ] T-047 [ops] Implement Health/Metrics endpoint | acceptance: `/health` returns status of all services.