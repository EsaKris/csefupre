# Asset slots

Every visual asset is referenced from `src/config/images.ts`. Until a file is supplied,
a labelled dashed placeholder appears in its place.

## Logos — `public/assets/logos/`

| Slot | Where it appears | Format |
|---|---|---|
| `logos.fupre` | Navbar, footer, partnership section | **Supplied** (217px PNG, background removed). An SVG or larger PNG would look sharper on high-resolution screens. |
| `logos.ispon` | Footer, partnership section | **Supplied** (cropped, transparent PNG). |

Favicons (`public/favicon-32.png`, `public/apple-touch-icon.png`) are generated from the FUPRE emblem.

## Photographs — `public/assets/images/`

Prefer official FUPRE/CSE photography. Export as WebP or JPEG, longest side about 1600px,
under 300 KB. Set `width` and `height` to the real pixel dimensions.

| Slot | Page | Subject | Crop |
|---|---|---|---|
| `homeHero` | Home, hero | CSE field training exercise, people in PPE on site | 4:5 portrait |
| `homeAbout` | Home, about | Safety briefing in progress | 3:2 |
| `homePractical` | Home, practical training | Inspection, PPE demonstration or equipment check | 4:5 |
| `homeCareers` | Home, careers | CSE graduate in PPE on site | 4:5 |
| `aboutHeader` | About | FUPRE campus or Old TETFund Building | 16:9 |
| `programmesHeader` | Programmes | Classroom or lecture session | 16:9 |
| `coursesHeader` | Courses | Short-course participants | 16:9 |
| `careersHeader` | Careers | Safety officer conducting an inspection | 16:9 |
| `contactHeader` | Contact | Old TETFund Building exterior | 16:9 |

Do not use AI-generated images of people. If stock photography is used temporarily,
record the source and licence in the slot's `credit` field.

## Documents — `public/assets/documents/`

| Item | Config |
|---|---|
| Official admission brochure (PDF) | `site.brochureUrl` in `src/config/site.ts` |

## Content awaiting confirmation

| Item | Location |
|---|---|
| Vision and mission statements | About page (Phase 2) |
| Short course descriptions | `src/config/courses.ts` |
| Ph.D. duration | `src/config/programmes.ts` (`durationMonths: null`) |
| Application fee per programme | `shared/fees.ts` → `APPLICATION_FEES` |
| Individual fee for each short course | `shared/fees.ts` → `COURSE_FEES` |
| Admission deadline | `site.admissions.deadline` |
| Map embed for the Old TETFund Building | `site.contact.mapEmbedUrl` |
| Refund policy wording | Terms page (Phase 2) |
