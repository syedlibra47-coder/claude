# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Homepage concept is built as static HTML/CSS/JS (single file, fonts inlined). The production site is planned on WordPress with a real-estate theme (Houzez) on the client's existing cPanel hosting; the static concept is the visual reference for that build.

## Users

Primary: off-plan property investors buying into new Dubai developer projects, including UK and other overseas buyers reached through homespartner.co.uk. They compare launches, handover dates and payment plans, and want one trusted person to guide the purchase remotely.

Secondary: people looking to buy or rent a ready home in Dubai now, and owners who want to list a property.

## Product Purpose

HomesPartner Real Estate (homespartner.ae) is a Dubai brokerage. The site lets visitors browse ready listings for sale and rent, browse off-plan projects filtered by developer and area, read market insights, and reach an agent quickly. Success is a qualified enquiry: a WhatsApp message or form submission tied to a specific listing or project.

## Positioning

- Off-plan specialist: access to developer launches, allocations and payment plans.
- Personal service: one partner handles the deal from first call to keys.
- UK–UAE desk: a dedicated service for UK-based buyers investing in Dubai (homespartner.co.uk).

## Operating Context

- Every listing and project carries a WhatsApp button whose pre-filled message includes the listing reference and URL, so the agency knows which listing generated the lead.
- Staff upload listings (sale/rent) and off-plan projects themselves through the CMS; projects are filterable by developer.
- Information architecture follows the reference site metropolitan.realestate: Buy, Rent, Off-Plan (New Projects), Areas, Developers, Insights/Blog, About, Contact; project URLs follow /area/project-name/.

## Capabilities and Constraints

- Listings for sale and rent; off-plan projects with developer filter; areas; blog; contact form; WhatsApp per listing.
- Google reviews integration (client has a Google Business profile; reviews not yet supplied).
- Achievements/awards section (client will supply).
- Real photography not yet supplied; this environment cannot fetch stock photos, so imagery is illustrated until real photos arrive.
- Undecided: main WhatsApp number, RERA/ORN licence number.

## Brand Commitments

Source: Homes Partner Brand Guidelines PDF (supplied by client).
- Logo: three overlapping diamond outlines — navy, gold gradient, navy — with the wordmark "Homes" (navy) "Partner" (gold) and "REAL ESTATE" tracked below. Use the full logo; do not move, recolour, outline, add shadows or change the font. Use the positive (navy/gold) version on light backgrounds.
- Colours: HomesPartner Blue #20275C (Pantone P 100-16 U) is the primary colour; HomesPartner Gold gradient #E2C980 → #B59E5A (Pantone P 8-4 U / P 12-5 U); HomesPartner White.
- Typeface: Poppins (Light and Semibold specified).
- Client direction: light mode only, white background; dark mode rejected for the brand.

## Evidence on Hand

- Brand guideline PDF and logo (in conversation; logo recreated as SVG).
- No real listing photos, testimonials, awards, or verified statistics yet.
- Client data taken from the client's site repo (syedlibra47-coder/homespartner-website, assets/*-data.js): head office (The Curve Building, Sheikh Zayed Road, Al Quoz 3), +971 4 445 6705, info@homespartner.ae, desks in London, Karachi and Ahmedabad, trading since 2007; figures 4 offices, 1,200+ properties closed, 15+ years combined experience, 98% client satisfaction; off-plan projects, ready listings (refs HP-xxxx) and listing photographs.
- WhatsApp: the client's site has a placeholder number; the concept uses consultant Syed Hussain's mobile (+971 58 521 0926) until a main WhatsApp number is confirmed.
- Still missing: Google reviews (held in the client's Supabase database, unreachable from the build environment), awards, RERA/ORN and trade licence numbers. Several developer names in the client's off-plan data (Meridian Developments, Skyline Properties, Waterline Estates, Horizon Estates) look like sample entries and need confirming.

## Product Principles

1. Off-plan first: the homepage leads with new projects, developers and payment plans.
2. Every visual leads to a conversation: each listing or project is one tap from a WhatsApp chat about that exact item.
3. One partner, not a portal: the voice is a named, accountable advisor, not a listings aggregator.
4. Serve the overseas buyer: clear for someone buying remotely from the UK.
5. Never fabricate proof: no invented reviews, awards or numbers presented as real.

## Accessibility & Inclusion

WCAG 2.1 AA contrast for all text (verified ratios recorded in DESIGN.md). Respect prefers-reduced-motion.
