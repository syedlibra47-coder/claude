# Design: HomesPartner homepage

The look is a sales gallery. Each launch is shown as a white architect's model on a round plinth, with a brass plaque beside it. Everything else on the page stays quiet: white ground, navy text, gold only as trim.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--p-ink` | `#20275c` (HomesPartner Blue) | text, primary buttons, model massing |
| `--p-muted` | `#4b5172` | secondary text; 7.9:1 on white |
| `--p-bg` | `#ffffff` | page ground (light mode only, by client decision) |
| `--stone` | `#f3f4f8` | picture frames: plans, guide covers, the board |
| `--gold-1` / `--gold-2` | `#e2c980` / `#b59e5a` | the brass gradient: logo, plinth ring, bar caps, rules |
| `--gold-text` | `#715e30` | small gold labels ("For sale", "Figure to be confirmed"); 6.2:1 on white |

- **Type:** Poppins throughout. Light (300) for body text, Medium (500) for names and labels, Semibold (600) for headings.
- **Radius:** soft (6–8px).
- **Shadow:** a single soft shadow, on the plaque only.

## Rules

- Gold is never used as text colour for body copy and never fills a large area. It is trim only.
- Every listing and launch opens WhatsApp with its ref and URL in the message.
- Pictures are drawn by us until the client's photographs arrive:
  - renders of the models (`assets/model.js` → `assets/models/*.webp`)
  - drawn floor plans
  - an area map
  - a route diagram
  - guide covers
- Motion:
  - the hero enters once
  - the model turns slowly (pause button; drag to turn) and swaps with a camera move
  - the advisor statement lights up word by word
  - hover states come from the kit's motion layer
  - reduced motion and phones get stills
- Each section is one screen at 1440×900, except Ready homes, which is two. Splits sit on the hero's 5|7 line.
