# Accessibility and responsive audit — September 17, 2026

This checkpoint used a WCAG 2.2-oriented scan, manual source review and connected Chrome checks. It is evidence for the paths below, not a claim that the entire product has received a certified accessibility conformance audit.

## Verified in this checkpoint

- The shared application shell exposes one main landmark, one labeled primary navigation and a first-focusable skip link. Activating the skip link focuses `main` without changing the hash-routed page.
- SPA navigation updates the document title and an existing polite live region announces the destination.
- Errors and save/loading notices use explicit assertive or polite live behavior. Form controls inspected in the runtime accessibility tree retain names through the shared wrapping-label component.
- Focus indicators use a three-pixel high-contrast outline. Existing motion transitions are disabled by `prefers-reduced-motion`.
- The mobile navigation identifies its controlled sidebar and closes with Escape.
- At an explicit 320×800 viewport, Assets, Video & UGC, Creative Insights, Feed and Classroom each rendered one runtime `h1` and no document-level horizontal overflow. The staff-denied and not-found states now also have a page-level heading.
- Informative asset thumbnails use the asset name as alternative text. Reporting/export tables have captions.
- The two placeholder color pairs that failed normal-text AA were darkened. The audit script now reports both above 4.5:1.
- Generated video outputs already produce durable SRT captions. An authenticated WebVTT endpoint now exposes that exact artifact to browser video tracks in Activity and mapped Performance previews.

## Verification evidence

- Production TypeScript/Vite build passed.
- All 23 automated tests passed, including tenant, reporting, media, recovery and backup boundaries.
- Connected Chrome proved the skip link was the first keyboard target after reload, activation focused `#main-content`, and the `#/assets` route/title were preserved.
- Connected Chrome proved the 320-pixel viewport had `scrollWidth === innerWidth` on the five representative destinations above.
- Connected Chrome proved the mobile sidebar changed from hidden to visible with `aria-expanded=true`, then returned to hidden with `aria-expanded=false` after Escape.

## Open accessibility dependencies

- Supplied reference videos and direct Community video uploads do not yet have a timed-caption ingestion/editor workflow. Their required descriptions are useful alternatives but do not replace captions for dialogue.
- The owned Classroom orientation recording has an exact transcript and burned-in instructional overlays, but still needs a timed caption track.
- A full assistive-technology walkthrough with VoiceOver/NVDA and a browser 200% text-zoom pass remain release checks. Static scanners also report component-file false positives because they cannot resolve the shared React shell or wrapping `<label>` component; those findings were manually evaluated rather than suppressed.

