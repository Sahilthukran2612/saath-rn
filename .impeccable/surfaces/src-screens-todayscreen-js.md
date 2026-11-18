---
version: 1
slug: "src-screens-todayscreen-js"
primary_target: "src/screens/TodayScreen.js"
related_targets: ["src/AppShell.js"]
---

# Surface brief: whole app (all roles, all screens) and the suggestion pad

Mode: Operate. Platform: Android (Expo, React Native). Visitors: person (elder, teen, adult), family, neighbour, ASHA, clinician, on cheap phones in daylight, Hindi and English, varying literacy.

Job: do the next care thing, reassure the circle, ask for help; the person also gets a daily pad of suggestion slips (daily habits, care reminders) generated on the phone by fixed rules from their own logged entries. No doses, no diagnosis, offline.

Constraints kept from PRODUCT.md: brick red only for a real alert, targets 56 px or more, body 18 px or more, Mukta, drawn art and Lucide line icons, never colour alone, reduced motion respected, 1.35x large text, Hindi and English parity.

Unresolved: native-speaker Hindi for the new card texts, clinician review of habit and reminder wording, TalkBack walkthrough, device performance of the tear animation.

## Direction contract

THESIS: Care is receipted. Every task, check-in and suggestion is a slip from a bill book, and doing it is stamped, thump, with the day's date. It refuses the pastel wellness card grid and the ring-and-tile dashboard.

OWN-WORLD: Kirana and ration-shop bill books. White bill paper; ballpoint blue ink (#1B3FAE) for type, rules and doodles; violet rubber-stamp ink (#5B2A86) only for the stamp; carbon-pink (#FFD9E4) and slip-yellow (#FFE066) as the second and third copies of a slip; ledger green (#1F6F4A) for done and OK. Perforated tear edges, a slightly rotated stamp with an uneven ink ring and the date inside, hand-drawn ballpoint doodles (walking figure, water glass, plate, foot, phone, medicine strip). Recognisable with all words removed.

STORY: The person sees one next thing and one pad of today's slips, does it, and stamps it. The circle sees stamped slips and changed rows lit until noticed. Nobody reads a chart to know the day went well.

FIRST VIEWPORT: Phone, Today. Greeting and the date in the bill-book header. One big slip filling the width holds the next task, large, with a stamp target; a done task keeps its violet stamp. Below it a pad of three offset slips (white on pink on yellow) of today's suggestions; the top one tears away along its perforation when read or done. Bottom navigation with five destinations. Primary action is the stamp press at 56 px or more.

FORM: Seed reference seed:d6631effbbfa2e8c, assigned direction (list position 6). Signature move: the stamp thump (scale 1.45 to 1 on a critically damped spring, 6 degree rotation, ink bloom, haptic) and the tear-off of a suggestion slip. The world lends type voice, palette, density and these two moves; navigation and controls stay standard Android Material.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
