# Quiet Ledger design system

## Product and purpose
Quiet Ledger is a worker-first, anonymous workplace listening desk. A person proves they are eligible for an active listening window and that they have not already contributed, without exposing identity, tenure, wallet address, private note, or credential. The interface must make the privacy boundary understandable before it asks for any action.

## Direction — Japanese editorial calm
Use Japanese editorial principles as an information-design approach: generous negative space, precise baseline rhythm, restrained ink colors, vertical dividers, short considered copy, and moments of quiet. Do not use cultural icons, flags, calligraphy, or stereotyped decoration. The experience should feel like a well-designed public-interest journal rather than a crypto dashboard.

## Tokens
- Canvas: #F3F0E8 (warm paper); surfaces #FCFBF7 and #E9E4D9; ink #18231F; muted ink #6D746D.
- Accent: vermilion #C6452D only for decisions/action; moss #3F5B4B for verified/private-safe states; gold #B68A39 for caution.
- Fonts: `Newsreader` for editorial display headings; `IBM Plex Sans` for UI/body; `IBM Plex Mono` for proof and receipt metadata.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72, 96px. Max content width 1280px.
- Radius: mostly 0px. Use 2px only for small controls, 12px only for notification/assistive panels. Borders are 1px solid #CFC8BA.
- Shadows: no floating-card shadows. Use thin rules, background shifts and occasional 8px 8px 0 #18231F offset on key action panels.

## Layout
Desktop uses a narrow left rail (wordmark + index), main reading column, and a quiet right evidence rail. Mobile collapses to a sticky compact header and vertically stacked evidence. The key proof journey is a numbered editorial sequence: requirement, private material, disclosure, wallet, proof, finalized receipt.

## Components
- Numbered section labels use mono uppercase, 11px, wide tracking.
- Buttons are rectangular, precise and visibly focused; the primary button is vermilion with cream text.
- A privacy boundary diagram uses two adjacent bands: LOCAL / PRIVATE and LEDGER / PUBLIC, joined only by a narrow proof aperture.
- The receipt is typographic and verifiable, never a fake transaction: pending, rejected, DUST, proving-service, and indexer states are explicit.

## Motion and accessibility
Use Framer Motion for 180–300ms fades/rule draws and proof steps. Respect `prefers-reduced-motion`; no continuous animation in that mode. Use `:focus-visible` 3px vermilion outlines, 4.5:1 contrast minimum, semantic landmarks, keyboard controls, and status updates through `aria-live`.

## Requested page
Build the main worker flow: a calm, responsive service page showing an active listening window, a local-only credential indicator, a visible disclosure checklist, a wallet/network selector (1AM preferred), proving progress, public aggregate metrics, and a bounded Gemini explanation panel. Use ONLY these fonts, colors, spacing, and component styles. Do not introduce gradients, glass effects, neon, generic crypto motifs, or new color families.
