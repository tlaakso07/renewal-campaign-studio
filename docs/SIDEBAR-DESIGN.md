# Sidebar reference treatment

September 17, 2026. The user requested the supplied Zuops sidebar's glass appearance and fine outline icons, then clarified that its glow must use Renewal Green rather than blue.

- Selected links use a white translucent pill, Renewal Green border and diffused green glow. Black text and outline icons preserve readability. The account avatar uses black on Renewal Green.
- The white sidebar has subtle background blur and a quiet border. The account control uses a lightly tinted translucent surface. Blur is an enhancement; the high-opacity background remains readable without it.
- Icons share a 20px size and 1.65px stroke. Section headers have working disclosure chevrons and keyboard-operable buttons. Active links expose `aria-current="page"`; group buttons expose expansion state.
- The navigation area scrolls independently so company identity and account access remain visible. The selected group opens on navigation, and its selected link is scrolled into view. Existing mobile navigation closes after a route change.
- Navigation accents use the company accent (Renewal Green #6CC14C for this workspace). Renewal's actual artwork and green primary actions/creative brand remain in place. Existing Arial fallback remains intentional pending source-font usage permission.

Verified in Chrome at the default desktop viewport and 390 × 844: Home/Classroom/Settings selection, group collapse and keyboard expansion, navigation scrolling, mobile menu opening and route selection. TypeScript/Vite build passes. This is a local implementation; the hosted review has not been redeployed.
