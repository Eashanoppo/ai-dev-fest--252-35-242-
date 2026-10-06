1. Problem
Office staff must turn scattered PDFs into one verified, correctly orderedtender package: match files to requirements, enter expiry dates, catchduplicates/expired/missing documents, then generate a cover-paged, footered,combined PDF — fully in-browser, in Bangla and English.

2. Success Criteria (judges' focus)
Correct Section-5 status for every document on an UNSEEN pack
PDF follows Section 6 exactly (order, cover, page numbers)
Non-technical user completes the flow unaided in either language
3. Functional Requirements
FR1 Load (4.1): pick/drag requirements.json; validate; show tender meta +requirements sorted by order. Missing title_bn → fallback title_en.Invalid JSON → bilingual error toast. Nothing hardcoded (unseen pack).FR2 Upload (4.2): multi-file + drag. Reject non-PDFs (magic bytes "%PDF",not extension alone) with clear message. Enforce ≤30 files, ≤50MB total.Page count via pdf-lib. Parse failure → file marked "Unreadable orprotected", excluded from matching. Removable; removal clears its match.FR3 Match (4.3): per-requirement combobox of available files; strictly 1:1;changeable/undoable at any time.FR4 Expiry (4.4): date input visible only when has_expiry && matched.FR5 Status (4.5): pure function, recomputed on EVERY state change: if (!matched) return mandatory ? MISSING(block) : NOT_PROVIDED(ok) if (has_expiry && !expiry) return EXPIRY_NEEDED(block) if (has_expiry && expiry < deadline) return EXPIRED(block) // same-day = OK return OK ISO YYYY-MM-DD string comparison (lexicographic = chronological).FR6 Duplicates (4.6): SHA-256 (crypto.subtle) per file; same hash = duplicate group; badge every member; BLOCK matching group members to different requirements (toast explains why).FR7 Generate (4.7): disabled while any blocking status; expandable reason list. Build: cover page → [index page, bonus] → included docs sorted by order, all pages, skip optional-without-file. Y = 1 [+1] + Σ included pages, precomputed. Footer on EVERY page: " | Page X of Y" (white 20pt strip, 8pt #333, centered). Progress feedback during assembly.FR8 Download (4.8): Blob download, filename "_Package.pdf".FR9 i18n (4.9): full dictionary, every string (labels, placeholders, toasts, errors, empty states, assistant); toggle persisted; doc titles from title_bn/title_en; localized dates/numbers via Intl.FR10 Assistant (bonus, §5.5): Gemini BYO key (localStorage only, never logged/committed); context-aware system prompt (tender + status summary); replies in BOTH languages (JSON {en, bn}); English-only TTS with sentence chunking; app fully functional without it.

4. Package Spec
Cover (English): tender ID, title, procuring entity, bidder, submissiondeadline, date made, numbered list of included documents in order.Body: included docs by order, original page order. Footer: every page.Index (bonus): after cover; entry per doc = start page (2 + Σ previous pages).

5. Data Model (TypeScript)
Requirement {id, order, title_en, title_bn?, mandatory, has_expiry}UploadedFile {id, name, size, hash, pageCount, valid, matchedTo?}ProjectState {tender, files(meta only), matches: reqId→fileId,expiry: reqId→string, lang, theme}Persistence: autosave project to localStorage (debounced), files re-linkedby name+size on re-upload (bonus "save and reopen").

6. Bonus Roadmap (priority order)
P1: Auto-match (token overlap of normalized filename vs titles, greedy, threshold, never overwrite manual matches, toast "review suggestions")P1: CSV export (UTF-8 BOM; columns: document, file, pages, expiry, status)P1: Bad-file handling (free — already in FR2 try/catch)P1: AI assistant (FR10 — signature feature)P2: Index page · P2: project export/import JSON · P2: Bangla on cover (canvas render with Hind Siliguri → PNG embed — guarantees correct shaping, pdf-lib cannot shape Bengali conjuncts)P3: Seal/signature PNG placementCUT ORDER if time runs out (last first): seal → Bangla cover → index →assistant streaming → assistant (keep CSV + auto-match)

7. Edge Cases & Test Matrix
expiry == deadline → OK · optional matched+expired → blocks (suggest unmatch)
duplicate pair: one matched, second match attempt → blocked with reason
file removed while matched → status returns to Missing/Not provided
renamed non-PDF (.pdf extension, no %PDF header) → rejected
password-protected/damaged PDF → "Unreadable" state, no crash
re-upload after removal · 31st file / 50MB+1 → clear bilingual message
missing title_bn → title_en fallback · 0 requirements → guarded
8. Submission Extras (DO NOT FORGET)
output/_Package.pdf — generated from sample pack AFTER resolvingits problems (match correct files, enter valid expiry dates)
screenshots/ — at least one showing document statuses (both languages ideal)
README: name+reg, live link, run commands, features, known problems,AI tools, most useful prompt