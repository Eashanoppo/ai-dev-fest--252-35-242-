# TenderPack - Tender Document Package Builder

Production quality, frontend-only web application built for public procurement document validation and automated PDF package compilation.

Applicant Name: Golam Morshed Eashan Eashan
Registration / Candidate ID: 252-35-242
Contest: AI DevFest Solo Contest
Stack: React 19, TypeScript strict mode, Vite, Tailwind CSS v4, framer-motion, pdf-lib
Deployment Target: Vercel (Static Web App)
Live URL: https://ai-dev-fest-252-35-242.vercel.app

---

## 1. Project Background and Purpose

Preparing tender bid packages is traditionally a manual, repetitive, and error-prone process. Bidders must collect mandatory and optional certificates, ensure documents remain valid through the submission deadline, prevent duplicate uploads, and arrange dozens of pages into the exact order mandated by the procuring entity. A single misplaced or expired document can result in disqualification.

TenderPack solves this problem entirely in the browser. It ingests the tender specification schema, validates uploaded PDF documents, checks expiry deadlines live, flags duplicates via cryptographic SHA-256 hashing, and compiles an audit-ready, single PDF submission package complete with a standardized cover page, index directory, and running footers.

---

## 2. Core Features and Technical Implementation

### 2.1 Schema Ingestion (Task 4.1)
- Accepts requirements.json via drag-and-drop or file selector.
- Features tolerant parsing that handles ISO dates, string booleans, and unseen schemas.
- Automatically sorts document checklist rows by numerical order.

### 2.2 PDF Upload and Validation (Task 4.2)
- Multi-file drag-and-drop upload supporting up to 30 PDF files and 50MB total.
- Strict magic-byte check inspecting the first 1024 bytes for the %PDF header. Renamed or invalid files are rejected with clear bilingual alerts.
- Multi-stage page count inspection using pdf-lib.
- Corrupted or password-protected files are caught gracefully, badged as Unreadable or protected, and prevented from causing application crashes.
- File deletion unlinks matches and cleans up memory buffers.

### 2.3 Strict 1-to-1 Document Matching (Task 4.3)
- Dropdown selector allows pairing each uploaded file with exactly one requirement.
- Enforces strict 1-to-1 matching: assigning an already-matched file to a new requirement cleanly frees its prior assignment.
- Matches can be changed or undone at any time.

### 2.4 Expiry Date Validation (Task 4.4)
- When a document with has_expiry is matched, an ISO date input appears.
- Compares expiry date against the tender submission deadline using chronological string comparison.

### 2.5 Real-Time Status Engine (Section 5)
Every requirement displays exactly one status computed on the fly:
- Missing: Mandatory document with no file matched (Blocks generation).
- Expiry date needed: Document requires an expiry date, but none has been entered (Blocks generation).
- Expired: Expiry date is strictly before the submission deadline (Blocks generation). Same-day expiry is treated as valid.
- Not provided: Optional document with no file matched (Does not block generation).
- OK: Valid file matched and expiry date is on or after the deadline (Permitted).

### 2.6 Duplicate Detection via SHA-256 (Task 4.6)
- In-browser cryptographic hashing via crypto.subtle.digest using SHA-256.
- Detects duplicate files even if renamed.
- Both files receive a visible Duplicate badge.
- Cross-matching duplicate files to different tender requirements is blocked with an explanatory warning.

### 2.7 Package Generation and PDF Assembly (Section 6)
- Generate button remains disabled with an expandable list of reasons whenever any blocking issue exists.
- Page 1: Standardized English cover page on A4 with tender ID, title, procuring entity, bidder name, submission deadline, generation date, and an ordered list of included documents.
- Body pages: Merged in ascending order. Unmatched optional documents are skipped.
- Rule 6.4 Compliant Footers: The visible page box is grown by 20 points at the bottom so that running footers never obscure any document content.
- Running footer rendered on every page including the cover: tender_id | Page X of Y.
- Output file is downloaded as tender_id_Package.pdf.

### 2.8 Full Bilingual Localization (Task 4.9)
- Complete interface translation in English and Bengali.
- Instant switching via the top bar toggle (EN | বাং).
- Titles display from title_bn when Bengali is selected, falling back to title_en.
- Numbers and dates formatted using Intl locales.

---

## 3. Bonus Features

- Auto-Match Engine: Uses Dice token similarity and requirement identifiers to suggest matches automatically without overwriting existing assignments.
- CSV Checklist Export: Exports the complete status checklist with a UTF-8 BOM prefix, ensuring Bengali script renders correctly in Excel.
- Document Index Page: Adds a table of contents page after the cover listing the exact start page number for each document.
- Digital Seal and Signature: Lets users upload a PNG seal image, choose scopes (all pages, first page of each doc, last page of each doc, or custom ranges), position it in any corner, and adjust its scale.
- AI Assistant: Powered by Groq Cloud with default model openai/gpt-oss-20b (also supports Gemini). Features dual-language JSON responses, live context awareness, progressive typewriter reveal, and SpeechSynthesis voice-over with a 4-bar equalizer animation.
- State Persistence and Project Backup: Autosaves project state to browser localStorage and allows full JSON project export/import.

---

## 4. Getting Started and Commands

Prerequisites: Node.js (version 18 or newer) and npm.

### Install Dependencies
npm install

### Start Local Development Server
npm run dev

The app will be available locally at http://localhost:5173/

### Run Automated Test Suite
npm test

Runs the Vitest test suite covering the status engine, matching rules, PDF inspection, CSV export, and PDF compilation.

### Build for Production
npm run build

Runs TypeScript compiler checks (tsc -b) followed by Vite production bundling into the dist/ directory.

---

## 5. Automated and Manual Test Cases

Below is the verification matrix corresponding to the test cases in Docs/test-cases.md.

### Phase 1: File Upload and Validation
- TC 1.1: Valid PDF Upload - Displays file name and accurate page counts. Status: Passed (Automated Vitest + Manual Chrome).
- TC 1.2: Invalid File Rejection - Rejects non-PDFs and renamed files via %PDF magic bytes. Status: Passed (Automated Vitest).
- TC 1.3: File Removal - Removing a file unlinks matches and updates status immediately. Status: Passed (Automated Vitest).
- TC 1.4: Bad or Corrupted Files - Corrupted or password-protected files are flagged as unreadable without crashing. Status: Passed (Automated Vitest).
- TC 1.5: Limits Enforcement - Rejects uploads exceeding 30 files or 50MB total. Status: Passed (Manual Chrome).

### Phase 2: Matching and Duplicate Detection
- TC 2.1: 1-to-1 Matching Constraint - Reassigning a file frees the prior requirement. Status: Passed (Automated Vitest).
- TC 2.2: Duplicate Detection - Identical files are tagged as duplicates via SHA-256 hash. Status: Passed (Automated Vitest + Manual Chrome).
- TC 2.3: Duplicate Cross-Match Block - Prevents matching duplicate files to different requirements. Status: Passed (Automated Vitest).
- TC 2.4: Change Match - Reassigning a file updates statuses across all affected requirements. Status: Passed (Automated Vitest).
- TC 2.5: Undo Match - Unmatching resets status to Missing or Not provided. Status: Passed (Automated Vitest).

### Phase 3: Expiry and Status Engine
- TC 3.1: Missing (Mandatory) - Unmatched mandatory document shows Missing and blocks generation. Status: Passed (Automated Vitest).
- TC 3.2: Expiry Date Needed - has_expiry requirement without date shows Expiry date needed and blocks. Status: Passed (Automated Vitest).
- TC 3.3: Expired - Expiry date before submission deadline shows Expired and blocks. Status: Passed (Automated Vitest).
- TC 3.4: Same-Day Expiry - Document expiring on the exact deadline date shows OK. Status: Passed (Automated Vitest).
- TC 3.5: Not Provided (Optional) - Unmatched optional document shows Not provided and does not block. Status: Passed (Automated Vitest).
- TC 3.6: OK Status - Valid file with future expiry date shows OK. Status: Passed (Automated Vitest).
- TC 3.7: Optional but Expired - Matched optional document with past expiry date blocks generation. Status: Passed (Automated Vitest).
- TC 3.8: Live Updates - All statuses update instantly on any mutation. Status: Passed (Automated Vitest).

### Phase 4: Package Generation and PDF Rules
- TC 4.1: Generation Gate - Generate button is disabled while blockers exist, and enabled when resolved. Status: Passed (Automated Vitest).
- TC 4.2: Cover Page - Page 1 is an English A4 cover with tender metadata and document list. Status: Passed (Automated Vitest).
- TC 4.3: Document Order - Included documents are merged in ascending order. Status: Passed (Automated Vitest).
- TC 4.4: Footer Format - Every page features tender_id | Page X of Y without obscuring content. Status: Passed (Automated Vitest).
- TC 4.5: Skip Optional - Unmatched optional documents are omitted from the final PDF. Status: Passed (Automated Vitest).
- TC 4.6: Total Page Count - Total pages Y in footer matches cover plus included document pages. Status: Passed (Automated Vitest).
- TC 4.7: Download Filename - File downloads named tender_id_Package.pdf. Status: Passed (Automated Vitest).

### Phase 5: Language and Theme
- TC 5.1: Complete Language Switch - Every label, button, and toast switches between English and Bengali. Status: Passed (Manual Chrome).
- TC 5.2: Document Titles - Titles render in Bengali when active and English otherwise. Status: Passed (Manual Chrome).
- TC 5.3: Persistence - Language and theme preferences persist across reloads. Status: Passed (Manual Chrome).
- TC 5.4: Dark Mode Readability - High-contrast editorial dark theme across all views. Status: Passed (Manual Chrome).

### Phase 6: AI Assistant
- TC 6.1: Works Without a Key - Entire core application functions without requiring an API key. Status: Passed (Manual Chrome).
- TC 6.2: Key Safety - API keys are stored only in localStorage and never sent to external servers. Status: Passed (Manual Chrome).
- TC 6.3: Bilingual Replies - Assistant outputs responses in both English and Bengali tabs. Status: Passed (Manual Chrome).
- TC 6.4: English Voice-Over - Speech synthesis reads only English text and stops immediately on command. Status: Passed (Manual Chrome).
- TC 6.5: Context Awareness - Assistant accurately references current blockers and tender details. Status: Passed (Manual Chrome).

### Phase 7: Bonus and Persistence
- TC 7.1: CSV Export - Checklist CSV export with UTF-8 BOM opens cleanly in Excel. Status: Passed (Automated Vitest).
- TC 7.2: Auto-Match - Applies suggested matches while leaving manual choices intact. Status: Passed (Automated Vitest).
- TC 7.3: Autosave and Re-linking - Re-uploading matching files restores prior saved matches. Status: Passed (Automated Vitest).

---

## 6. Submission Artifacts

- Compiled Final PDF Package: output/T-2026-0417_Package.pdf
- Sample Requirements: public/requirements.json
- Sample Documents: public/sample-pack/
- Screenshots: screenshots/

---

## 7. AI Tools and Prompt Reference

- Primary AI Assistance: Google Antigravity IDE
- AI Model for Assistant Feature: Groq Cloud (openai/gpt-oss-20b)
- Benchmark Prompt Used During Construction:
  You are my build partner for a 90-minute solo contest. Build a production-quality web app to this spec. Output COMPLETE files, one per code block, no placeholders, no TODOs. After each milestone, give me a git commit message that includes this prompt reference.