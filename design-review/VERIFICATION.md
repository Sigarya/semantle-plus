# Redesign verification — 17 November 2026

Work remains local on `redesign/visual-ux-refresh`. No production deployment.

## Implemented
- Single compact guess table: the latest guess is first and highlighted; all remaining guesses retain similarity ordering and their chronological numbers. Duplicate guesses do not create another row.
- Original gameplay terminology and copy retained. Sample-rank text is always visible, with explicit spaces, commas, a final period and bidirectional isolation around scores.
- Shared compact single-player/multiplayer result presentation. Sticky guess composer, 16px mobile input, and reduced-motion support.
- Hebrew/RTL calendar reused by the multiplayer lobby and archive. Unavailable dates are disabled. Archive dates use `dd/MM/yyyy`; clearing the filter returns all dates.
- Archive: fixed, balanced columns, equal action sizes, 30 results per page, loading feedback, keyboard-focus restoration and reduced-motion-aware scrolling on page changes.
- Google Play link verified against Sigarya's listing (`xyz.sigarya.semantle.twa`). Download action belongs in the upper installation banner, not the navigation. Native PWA install remains available when the browser provides its install event. Banner respects dismissal and standalone mode.
- Shared forms/dialogs and article layouts refined; service-worker update listeners and intervals cleaned up on unmount. Leaderboard callback stabilized to avoid repeating its page fetch on every provider update.

## Observed checks
- Local browser: desktop and mobile layout inspected, including a measured 390px viewport. The 320px override was not reliably honored by the browser; it is not counted as verified.
- Both original games inspected at mobile width. Their compact guess rows informed the final layout.
- Single-player: saved guesses, near/far results, duplicate handling and validation checked across this redesign session.
- Multiplayer: created a room for 15/11/2026 through the new calendar, joined from a second tab, submitted a guess, and observed the same guess and player name in the first tab. Both test participants left the room.
- Archive calendar: selecting 15/11/2026 displayed exactly that date; clearing restored the full list. Pagination was checked: 30 rows plus header, then records 31–60 beginning 17/10/2026.
- Sample-rank paragraph read from the rendered DOM confirmed correct spacing and punctuation.
- Public game, archive, lobby, About, Contact and leaderboard rendered and inspected. Profile, administration and other protected UI were reviewed in source; no authenticated submission was performed.
- TypeScript and Vite production build passed. Generated service-worker assets were produced.
- Repository ESLint has 21 existing errors. All 19 errors in `src` were compared with HEAD and were already present; the other two are in the existing Supabase function and Tailwind config. These were not treated as a passing repository lint check.

## Still required for release confidence
- Real Android/iOS keyboard and safe-area testing; installed PWA/Google Play app launch and native installation prompts; production service-worker update behavior.
- Authenticated profile/admin flows and a complete win/replay regression with current production data.
- Resolve or explicitly accept the pre-existing repository lint errors before declaring the whole repository release-clean.

## Current screenshots
- `final-mobile-game.jpg`: compact game and visible sample-rank paragraph.
- `final-install-banner.jpg`: upper banner with Google Play action (native PWA prompt unavailable in this local browser).
- `final-history-calendar.jpg`: Hebrew calendar.
- `final-history-table.jpg`: mobile archive table.
- `final-history-desktop.jpg`: desktop archive table.
