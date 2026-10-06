# TenderPack — Tender Document Package Builder

Production-grade, client-side web application for public procurement document verification and package compilation. Built for the AI DevFest solo contest.

---

## 1. Project Overview

- **Applicant Name**: Eashan
- **Registration / Candidate ID**: 252-35-242
- **Deployment Platform**: Vercel (Static Web App)
- **Primary Stack**: React 19, TypeScript (Strict), Vite, Tailwind CSS v4, framer-motion, pdf-lib

---

## 2. Core Functional Requirements Implemented

### 2.1 Load Requirements (FR1)
- Ingests `requirements.json` schemas drag-and-drop or file selection.
- Tolerant validation handles unseen contest packs, default flags, and ISO datetime strings.
- Sorts checklist rows in ascending numerical `order`.

### 2.2 PDF Upload & Inspection (FR2)
- Multi-file drag-and-drop ingestion enforcing maximum 30 files and 50MB total limits.
- Magic-byte verification scans the initial 1024 bytes for the `%PDF` signature; non-PDFs and renamed extensions are caught and rejected with bilingual alerts.
- Multi-stage page counting combines `pdf-lib` structural tree traversal, encryption fallback, and regex leaf validation.
- Corrupted or password-protected PDFs are categorized as "Unreadable or protected" without application crashes.
- File deletion unlinks matches and clears corresponding expiry inputs.

### 2.3 1-to-1 Document Matching (FR3)
- Accessible combobox displays valid, unmatched files plus the currently matched item.
- Enforces strict 1-to-1 matching across all requirements in both UI and state reducer.

### 2.4 Expiry Date Validation (FR4)
- Expiry date input dynamically displays only when a document is matched and `has_expiry = true`.

### 2.5 Status Engine (FR5)
- Recomputed on every state mutation:
  - Missing: Mandatory document without a match (Blocks generation).
  - Not provided: Optional document without a match (Permitted, skipped in compilation).
  - Expiry date needed: Matched with `has_expiry = true` but date is empty (Blocks generation).
  - Expired: Expiry date strictly before deadline (`expiry < deadline`) (Blocks generation).
  - OK: Valid match and expiry date on or after deadline (`expiry >= deadline`) (Permitted).

### 2.6 Duplicate Detection via SHA-256 (FR6)
- File content hashing executed in-browser using `crypto.subtle.digest('SHA-256')`.
- Matching identical files to distinct requirements is blocked with bilingual notification.

### 2.7 Standardized PDF Package Generation (FR7 & FR8)
- Page 1: Formatted English cover page on A4 containing tender ID, title, procuring entity, bidder, submission deadline, creation date, and numbered schedule of documents.
- Body: Merged pages in original document order. Unmatched optional documents are skipped.
- Rule 6.4 Compliant Footers: 20pt white baseline strip with centered 8pt text `<tender_id> | Page X of Y` on every page from 1 to Y.
- Download output named `<tender_id>_Package.pdf`.

### 2.8 Full Bilingual Localization (FR9)
- All labels, buttons, toasts, and dialogs routed through `t()`.
- Supports English and Bangla with `Intl` locale formatting for dates and numerals.

---

## 3. Bonus Features

1. **Auto-Match Engine**: Token overlap algorithm between normalized file names and bilingual titles.
2. **CSV Checklist Export**: RFC-4180 export with UTF-8 BOM (`\uFEFF`) ensuring proper Bengali script rendering in Microsoft Excel.
3. **Index Directory Page**: Generates an automated table of contents with start page numbers after the cover page.
4. **Digital Seal & Signature**: PNG stamp upload with corner placement presets and scale controls.
5. **AI Assistant with Groq & Gemini Support**:
   - Integrated with Groq Cloud (default model: `openai/gpt-oss-20b` or custom models) and Google Gemini (`gemini-2.0-flash`).
   - Context-aware prompt injecting live tender status and blocking issues.
   - Text-to-Speech (TTS) reading with 4-bar equalizer animation and Chrome long-utterance chunking.
   - BYOK architecture storing keys solely in local browser storage.
6. **Project Backup & Restore**: JSON import/export preserving project configuration and match links.

---

## 4. Run Commands

### Development Server
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 5. Test Suite & Verification Matrix

Detailed execution results for all 37 test cases are documented in `Docs/test-cases.md`.

---

## 6. Submission Artifacts

- **Compiled Submission Package**: `output/T-2026-0417_Package.pdf`
- **Sample Requirements**: `public/requirements.json`
- **Sample PDF Pack**: `public/sample-pack/`

---

## 7. AI Tools & Prompt Reference

- **AI Tools Used**: Google Antigravity IDE, Claude 3.5 Sonnet, Gemini 2.0 Flash
- **Most Useful Prompt**:
  > "Analyses Docs/prd.md Docs/design.md first, firstly understand fully them. You are my build partner for a 90-minute solo contest. Build a production-quality web app to this spec. Output COMPLETE files, one per code block, no placeholders, no TODOs. After each milestone, give me a git commit message that includes this prompt reference. Work in this exact order."