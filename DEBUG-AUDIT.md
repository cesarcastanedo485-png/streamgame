# Debug Audit Report — All Tabs

**Date:** 2025-03-19  
**Scope:** Live (launch) → Control → Library (The Dex) → Capabilities → all spread pages

---

## 1. Live Tab (index.html) — Launch / Overlay

### Issues found & fixed

| Issue | Fix |
|-------|-----|
| `statusEl`, `notificationEl` could be null in WS handlers | Added null checks before assigning `textContent` / `classList` |
| `getWebSocketUrl` might not exist if `backend-url.js` fails | Fallback to `(location.protocol === "https:" ? "wss:" : "ws:") + "//" + location.host` |
| Button click handlers — missing button would throw | Replaced individual handlers with loop + null check on `btn` |
| `renderReading` — `payload` or `cards` could be malformed | Added `!payload` guard, `Array.isArray(payload.cards)` fallback |
| `renderReading` — `cardsEl` null | Early return if `!cardsEl` |
| `renderReading` — `userEl`, `questionEl`, `aiTextEl`, `hintEl` null | Wrapped in `if (el)` before use |
| `renderEquilibrium` — `payload` or `grid` null | Added guards, null checks for `userEl`, `questionEl`, `aiTextEl`, `hintEl` |
| `showNotification` — `notificationEl` null | Guard at start of function |

### Remaining (low risk)

- `tarotResolvePath` used in attuning — from `site-base.js`; if missing, could throw. Mitigated by script load order.
- `apiUrl` used in `doReading` — from `backend-url.js`; same-origin fallback if not set.

---

## 2. Control Tab (control.html)

### Issues found & fixed

| Issue | Fix |
|-------|-----|
| `el` (bulletin) null when loading from localStorage | Wrapped in `if (el)` before `el.value` and `addEventListener` |
| `input` null when setting value | `if (input) input.value = ...` |
| `getBackendBaseUrl` / `setBackendBaseUrl` might not exist | `typeof ... === "function"` checks |
| Save/Clear buttons null | `if (saveBtn)` / `if (clearBtn)` before `addEventListener` |
| `v` from null `input` | `(input && input.value ? input.value : "").trim()` |

---

## 3. Library Tab (library.html) — The Dex

### Issues found & fixed

| Issue | Fix |
|-------|-----|
| `loadDecks` — `deckSelect` null | `if (deckSelect)` before `innerHTML` |
| `loadCards` — `cardsGrid` null | Early return if `!cardsGrid` |
| `loadStaticDefaultDeck` — `buildStaticDefaultCardRows` undefined | `(typeof ... === "function" ? ... : null) || []` |
| `loadStaticDefaultDeck` — `notice`, `newDeckBtn`, `deckSelect` null | Added null checks |
| `loadStaticDefaultDeck` — `c.key`, `c.name` undefined | `c?.key ?? ""`, `c?.name ?? "Unknown"` |
| Error fallback — `cardsGrid` null | `if (cardsGrid)` before `innerHTML` |
| `apiUrl` might not exist | `typeof apiUrl === "function" ? apiUrl(...) : "/api/..."` |
| Event listeners on null elements | `if (fileInput)`, `if (cardsGrid)`, `if (deckSelect)`, `if (newDeckBtn)` before `addEventListener` |

### Previously fixed (earlier session)

- `loadDecks` / `loadCards` response validation
- Deck switch error handling
- `escapeAttr` / `escapeHtml` usage

---

## 4. Capabilities Tab (capabilities.html + capabilities.js)

### Already implemented

- Null-safe `$()` helper
- `getStored` / `setStored` try/catch
- `loadConfig` error handling
- Google OAuth null checks
- `sendEmail` / `postToYouTube` token validation
- Form submit try/catch with `finally` for loading state
- `showResult`, `showError`, `clearError` with null checks

### No additional fixes needed

---

## 5. Spread Pages (yesno, two-card, 3-card, 5-card, 7-card, equilibrium)

### Structure

- Static HTML with nav, no heavy JS
- `link-base.js` runs on DOMContentLoaded
- No dynamic DOM that could throw

### Status

- No critical issues; spread pages are mostly static.
- Card slots are placeholders; Live tab drives the actual readings via WebSocket.

---

## 6. Server (server.js)

### Previously fixed

- Static root fallback (`docs/` when `public/` missing)
- `cards.json` load in try/catch
- `rawDeck` empty-array fallback
- `getAdviceOfTheDead` null-safe
- `/api/decks/active`, `/api/decks` error handling
- `/api/capabilities/config` added

---

## 7. Shared Scripts

### backend-url.js

- `norm()` handles null/empty
- `getBackendBaseUrl` / `setBackendBaseUrl` in try/catch
- `getWebSocketUrl` try/catch for invalid URL
- `tarotMediaUrl` returns `""` for null `file`

### site-base.js

- `tarotResolvePath` returns `pathname` if invalid
- `TAROT_BASE_PATH` fallback to `""`

### link-base.js

- Runs only when `document.querySelectorAll` exists
- Handles `readyState` for early run

---

## Summary

| Tab | Critical fixes | Status |
|-----|----------------|--------|
| Live | 8 | ✅ Done |
| Control | 5 | ✅ Done |
| Library | 10+ | ✅ Done |
| Capabilities | 0 (already robust) | ✅ OK |
| Spreads | 0 | ✅ OK |
| Server | 6 (earlier) | ✅ Done |

All identified null-safety, error-handling, and async-lifecycle issues have been addressed.

---

## 8. Routing & Link Fixes (2025-03-20)

### Problem

- All spread pages linked to `/spread/yesno`, `/spread/celtic-seven`, etc.
- When using a **static file server** (e.g. Live Server, GitHub Pages without rewrites), those paths 404 because there are no files at `docs/spread/yesno` etc.
- The actual files are `spread-yesno.html`, `spread-celtic-seven.html`, etc.

### Fix applied

- Updated **all** HTML files to use `.html` paths:
  - `/spread/yesno` → `/spread-yesno.html`
  - `/spread/two-card` → `/spread-two-card.html`
  - `/spread/past-present-future` → `/spread-past-present-future.html`
  - `/spread/path-of-five` → `/spread-path-of-five.html`
  - `/spread/celtic-seven` → `/spread-celtic-seven.html`
  - `/spread/equilibrium` → `/spread-equilibrium.html`
- Files updated: `index.html`, `library.html`, `control.html`, `capabilities.html`, `mordecai.html`, and all 6 spread pages.

### Notes

- The Node server still has explicit routes for `/spread/yesno` etc. and serves the same files; both styles work when the server runs.
- `404.html` keeps the old→new mapping for GitHub Pages and other hosts that serve it on 404.
- **`/library`, `/control`, `/capabilities`, `/mordecai`** remain as path-style links; they work with the Node server. For pure static hosting without 404.html rewrites, those could be updated to `.html` later if needed.

### 7-card Celtic layout

- Cards are in a horizontal row (positions 1–7); this is a simplified 7-position spread, not the full 10-card Celtic Cross.
- Layout matches other spread pages and is intentional for the live overlay use case.
