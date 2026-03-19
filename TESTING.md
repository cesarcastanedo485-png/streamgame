# Testing the TikTok Tarot Overlay

## Quick start

1. **Install and run**
   ```bash
   npm install
   npm run dev
   ```
2. Open **http://localhost:3000** in your browser (this is the overlay — add to OBS as Browser Source).
3. Optional: open **http://localhost:3000/control** in another tab for streamer notes (do not add to OBS).

## Card data (single source)

- **cards.json** is the only source: 78 cards (22 Major Arcana + 14 each of Cups, Pentacles, Swords, Wands).
- Major Arcana use image files from the `cards/` folder (e.g. `0_the_fool.jpg` … `21_the_world.jpg`). Minors use **no image** (placeholder text only) to avoid extra asset work.
- Meanings come from each card’s `upright` and `reversed` in **cards.json**; `advice` and `yes_no` are used where relevant (e.g. yes/no readings, Equilibrium “advice of the dead” fallback).

## Spreads

| Trigger | Spread | Cards |
|--------|--------|--------|
| 1,000 likes (per user) | Yes/No | 1 |
| Share | Two-card | 2 |
| (Future: 3-card, 5-card) | Past/Present/Future, etc. | 3, 5 |
| Universe gift | Celtic 7 | 7 |
| **!equilibrium** in chat or **Equilibrium Spread** button | Santa Muerte Equilibrium | 9 (5 Majors + 1 per Minor suit) |

## Testing Santa Muerte Equilibrium Spread

1. **Manual (no TikTok)**
   - On **http://localhost:3000**, type a question in the “Question for Equilibrium Spread” field and click **Equilibrium Spread**.
   - The overlay should switch to the 9-card grid (positions A–I), show card names (and Major images where present), and in the text area show “Advice of the dead” (from **cards.json** `advice` for position B, or from Grok if `GROK_API_KEY` is set).
   - In the browser console you should see `[Advice of the dead] …` for the B position.

2. **Via TikTok chat**
   - Go live as the user set in `.env` (`TIKTOK_USERNAME`).
   - In chat, type **!equilibrium**.
   - The overlay should show a notification: “@username requested the Santa Muerte Equilibrium Spread. Ask your question in chat now!”
   - Send a second message (your question) from the same account; the 9-card Equilibrium spread should appear as above.

3. **Grid layout**
   - Row 1 (top): D (Advantages), E (Disadvantages).
   - Row 2: F (Emotional), G (Material), H (Mental), I (Creative).
   - Row 3 (bottom): A (Past), B (Present), C (Future).
   - Card B’s “advice of the dead” is in the main text area and in the server console.

## Grok (optional)

- If **GROK_API_KEY** is set in `.env`, the “advice of the dead” for position B uses the Grok API (Santa Muerte–style prompt).
- If not set, the app uses the B card’s **advice** field from **cards.json** (no API, no cost).

## Verify one- and multi-card readings

- **http://localhost:3000/test-reading** — returns one random card and a yes/no-style interpretation (all from **cards.json**).
- Trigger likes/share/Universe (or simulate in code) and send a question in chat to confirm 1-, 2-, and 7-card flows and that interpretations match **cards.json**.
