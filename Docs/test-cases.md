# 📋 Test Execution Report: Tender Document Package Builder
**Project:** AI DevFest — Tender Document Package Builder  
**Overall Status:** 🟢 **ALL TESTS PASSED (37/37)**  
**Environment:** Frontend-only Web App (Latest Google Chrome)

---

## Phase 1: File Upload & Validation Testing
**Goal:** Ensure the app handles files correctly, enforces limits, and rejects invalid inputs safely.

| TC ID | Test Scenario / Action | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **1.1** | **Valid PDF Upload:** Upload 3 valid PDF files. | App displays file names and correct page counts for each. | ✅ Pass |
| **1.2** | **Invalid File Rejection:** Upload `.jpg`, `.txt`, `.docx`, and a `.jpg` renamed to `.pdf`. | App rejects each with a clear bilingual message. The renamed file is caught by the magic-byte (`%PDF`) check. | ✅ Pass |
| **1.3** | **File Removal:** Click the remove button on an uploaded, matched file. | File removed from the list, its match cleared, and statuses update immediately. | ✅ Pass |
| **1.4** | **Bad/Corrupted Files:** Upload a password-protected or corrupted PDF. | App catches the error, shows "Unreadable or protected file", and does not crash. | ✅ Pass |
| **1.5** | **Limits Enforcement:** Attempt to upload a 31st file, and a set exceeding 50MB total. | Clear bilingual message shown; existing state remains unaffected. | ✅ Pass |

---

## Phase 2: Matching & Duplicate Detection Testing
**Goal:** Ensure the 1-to-1 matching logic and duplicate hashing work flawlessly.

| TC ID | Test Scenario / Action | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **2.1** | **1-to-1 Matching Constraint:** Match File A to Req 1. Try to match File A to Req 2, and File B to Req 1. | App prevents both actions. A file can only have one match; a requirement can only have one file. | ✅ Pass |
| **2.2** | **Duplicate Detection:** Upload the exact same PDF twice under different file names. | Both files are marked "Duplicate" (verified via SHA-256 content hash match). | ✅ Pass |
| **2.3** | **Duplicate Cross-Match Block:** Match File A to R01, then try to match its duplicate File B to R02. | Blocked with an explanation message; duplicates cannot be matched to different documents. | ✅ Pass |
| **2.4** | **Change Match:** Reassign a file from R01 to R03. | R01 is freed instantly, R03 is matched, and all statuses are recomputed. | ✅ Pass |
| **2.5** | **Undo Match:** Unmatch a previously matched requirement. | Status returns to *Missing* (mandatory) or *Not provided* (optional) immediately. | ✅ Pass |

---

## Phase 3: Expiry & Status Engine Testing
**Goal:** Verify every status rule from Section 5, including critical edge cases.

| TC ID | Test Scenario / Action | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **3.1** | **Missing (Mandatory):** Leave a mandatory requirement unmatched. | Status is *Missing*; blocks generation. | ✅ Pass |
| **3.2** | **Expiry Date Needed:** Match a file to a `has_expiry` requirement without entering a date. | Status is *Expiry date needed*; blocks generation. | ✅ Pass |
| **3.3** | **Expired:** Enter an expiry date before the submission deadline. | Status is *Expired*; blocks generation. | ✅ Pass |
| **3.4** | **Same-Day Expiry (Edge Case):** Enter an expiry date exactly equal to the submission deadline. | Status is *OK* — a document expiring on the deadline day is considered valid. | ✅ Pass |
| **3.5** | **Not Provided (Optional):** Leave an optional requirement unmatched. | Status is *Not provided*; does **NOT** block generation. | ✅ Pass |
| **3.6** | **OK:** Match a valid file; enter a future expiry date where required. | Status is *OK*. | ✅ Pass |
| **3.7** | **Optional but Expired:** Match an optional requirement and enter a past expiry date. | Status is *Expired* — still blocks (Section 5 applies to matched documents regardless of mandatory flag). | ✅ Pass |
| **3.8** | **Live Updates:** Make any change (match, unmatch, date entry, remove file). | Every affected status updates immediately; no manual refresh needed. | ✅ Pass |

---

## Phase 4: Package Generation & PDF Rules Testing
**Goal:** Verify the generated PDF follows Section 6 exactly.

| TC ID | Test Scenario / Action | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **4.1** | **Generation Gate:** Attempt to generate while blocking statuses exist, then resolve them. | Button disabled with a list of reasons; enabled once all blockers are clear. | ✅ Pass |
| **4.2** | **Cover Page:** Generate a package and inspect page 1. | English cover showing tender ID, title, procuring entity, bidder, deadline, date made, and numbered document list in order. | ✅ Pass |
| **4.3** | **Document Order:** Inspect the package body. | Documents sorted by `order`, all pages included, original page order preserved. | ✅ Pass |
| **4.4** | **Footer Format:** Check every page, including the cover. | Footer exactly `<tender_id> \| Page X of Y`, readable, at the bottom, not covering content. | ✅ Pass |
| **4.5** | **Skip Optional:** Generate with an optional requirement unmatched. | That document is completely absent from the final package. | ✅ Pass |
| **4.6** | **Total Page Count:** Manually count: 1 (cover) + sum of included document pages. | `Y` in the footer matches the manual count exactly. | ✅ Pass |
| **4.7** | **Download Filename:** Download the generated package. | File saved exactly as `<tender_id>_Package.pdf`. | ✅ Pass |

---

## Phase 5: Language & Theme Testing
**Goal:** Confirm full bilingual support, theme behavior, and state persistence.

| TC ID | Test Scenario / Action | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **5.1** | **Complete Language Switch:** Toggle EN \| বাং across every screen and state. | Every label, button, placeholder, toast, and error message switches — no English leftovers in Bangla mode. | ✅ Pass |
| **5.2** | **Document Titles Per Language:** Switch language on the requirements list. | Titles render from `title_bn` in Bangla, and `title_en` in English. | ✅ Pass |
| **5.3** | **Persistence:** Set language and theme, reload, and switch mid-work. | Preferences persist; work state survives a mid-task switch. | ✅ Pass |
| **5.4** | **Dark Mode Readability:** Review all statuses, badges, and the assistant in dark mode. | All text readable with proper contrast. | ✅ Pass |

---

## Phase 6: AI Assistant Testing (Bonus)
**Goal:** Verify assistant behavior and Rulebook §5.5 compliance.

| TC ID | Test Scenario / Action | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **6.1** | **Works Without a Key:** Use the entire app with no API key configured. | All main features work; assistant shows a key setup prompt. | ✅ Pass |
| **6.2** | **Key Safety:** Enter an API key, inspect `localStorage` and the repository. | Key stored only in the browser; never in code, repo, or network URL logs. | ✅ Pass |
| **6.3** | **Bilingual Reply:** Ask the assistant a question. | One answer rendered with EN \| বাং tabs, both complete and accurate. | ✅ Pass |
| **6.4** | **English Voice-Over:** Press speak on an assistant reply, then stop. | Browser voice reads the English reply; stops immediately; does not read Bangla text. | ✅ Pass |
| **6.5** | **Context Awareness:** Ask "Why is Generate disabled?". | Assistant lists the actual blocking documents from the live state. | ✅ Pass |

---

## Phase 7: Bonus & Persistence Testing
**Goal:** Verify advanced bonus features and autosave capabilities.

| TC ID | Test Scenario / Action | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **7.1** | **CSV Export:** Export the checklist; open in Excel. | Bangla text renders correctly (UTF-8 BOM applied). | ✅ Pass |
| **7.2** | **Auto-Match:** Upload files named after document titles and run auto-match. | Correct suggestions applied; manual matches remain untouched. | ✅ Pass |
| **7.3** | **Autosave:** Reload the page mid-task, re-select the same files. | Matches, expiry dates, and statuses restored; files re-linked by name and size. | ✅ Pass |

***
**Sign-off:** All critical paths, edge cases, and bonus features have been validated. The application is ready for judge evaluation.