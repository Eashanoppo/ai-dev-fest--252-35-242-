1. Direction
Editorial minimalism (Dayos reference): typography does the work. Flat neutralsurfaces, 1px borders, ZERO gradients, ZERO emoji, restrained purposeful motion.

2. Color Tokens (CSS vars + Tailwind v4 @theme)
Token	Light	Dark
bg-page	#E5E5E5	#0A0A0A
bg-surface	#FFFFFF	#141414
bg-subtle	#EFEFEF	#1B1B1B
text-primary	#0F0F10	#E5E5E5
text-muted	#6E6E70	#9A9A9E
border	rgba(0,0,0,.10)	rgba(255,255,255,.10)
accent (steel)	#5C6B7A	#8E9DAB
Status (muted, restrained):

Status	Light text/bg	Dark text/bg
OK (green)	#3E7A52 / #E7F0EA	#7FB793 / #182019
Expiry needed (amber)	#96682B / #F2EBDC	#D9B36C / #241D10
Missing, Expired (red)	#A63D40 / #F6E9E9	#D98A8C / #271617
Not provided (gray)	#6E6E70 / #EFEFEF	#9A9A9E / #1B1B1B
Primary button: solid #0F0F10 (light) / solid #E5E5E5 (dark), inverse text.Steel accent ONLY for: focus rings, active language segment, assistant identity.

3. Typography
Stack: Poppins, 'Hind Siliguri', system-ui, sans-serif (Latin → Poppins,Bengali glyphs → Hind Siliguri automatically).

Display: 40/600, tracking -0.02em (English only)
H1 28/600 · H2 20/600 · H3 16/500 · Body 14/400 · Small 13
Kickers: 11/500 uppercase, tracking 0.08em
Bangla: same sizes, line-height 1.7, letter-spacing 0
Numbers: font-variant-numeric: tabular-nums
4. Layout (desktop-first, 1280 max, 8px scale)
TopBar 60px: wordmark "TENDERPACK" + tender-ID chip | EN|বাং segmented,theme toggle, assistant button (steel outline)
TenderHeader card: kicker + display title + meta grid (ID, entity, bidder,deadline badge, date made) + progress strip (Load → Upload → Match → Verify)
Workspace: Requirements list (2fr) + Files panel (1fr), gap 24
Sticky GenerateBar bottom 72px: blocking summary + expandable reasons +Generate / Download button
5. Components
RequirementRow: big tabular order number, title (lang-aware), MANDATORY/OPTIONAL tiny tag, match combobox (unmatched files), pages chip, expirydate input (only when has_expiry + matched), StatusBadge right, unmatch action
UploadZone: dashed 1.5px, drag-over = border-strong + bg-subtle
FileRow: name (truncate), pages, size, duplicate badge (red outline),"→ R03 Trade License" match link, remove icon
GenerateBar reasons: each = "R03 · Trade License · Missing — Match a file"
AssistantDrawer: 400px right, DARK #0A0A0A in BOTH themes (contrast moment),AI glyph header + key-status chip, messages, EN|বাং tab per assistant reply,input + send, speak button with 4-bar equalizer while speaking
SettingsModal: provider (Gemini default), masked key + show/hide, model,test button, note "Key stays in this browser only"
Toasts top-right; EmptyState = display headline + action; skeletons = opacitypulse (NO shimmer gradient)
6. Motion (Framer Motion, easing [0.16,1,0.3,1])
fadeUp 220ms (opacity 0→1, y 10→0); row stagger 40ms
AnimatePresence: drawer x 100%→0 320ms; modal scale .96→1; toast slide
Count-up stats 600ms; button whileTap scale .98; card hover y −2
Assistant: progressive text reveal + blinking caret; equalizer bars scaleY0.3↔1 staggered 120ms ONLY while speaking
prefers-reduced-motion: all disabled. Transform+opacity only.
7. Icons
Inline SVG, 24 grid, stroke 1.75, currentColor: upload, file, x, check,alert, clock, calendar, copy, trash, download, settings, key, send, speaker,stop, sun, moon, globe, chevron, bot. NO emoji anywhere in UI or README.

8. PDF Visual Language
A4. Helvetica (stretch: embedded Poppins/Hind Siliguri). Cover: tender ID 26bold, title 20, meta rows 10.5 with 0.75pt rules, numbered document list.Footer: white 20pt strip, 8pt #333 text, centered: " | Page X of Y".