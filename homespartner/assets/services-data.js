// Shared services data — used by services.html (full page) and the
// homepage service-card grid. Add a new object here (or via the admin
// panel, once Supabase is connected) to create a new service automatically.

window.SERVICES_DATA = [
  {
    id: "buying",
    icon: "home",
    title: "Buying",
    cardSummary: "Find and secure your ideal home or investment property with expert market guidance, negotiation and full transaction support.",
    pageHeading: "Find and Secure Your Next Property",
    pageDescription: "Whether it's a first home, an upgrade or an investment, we match you to the right property and carry the transaction through to keys-in-hand — with expert market guidance and firm negotiation on your side.",
    checklist: [
      "Search brief matched to budget, area and must-haves",
      "Off-market and pre-launch access through our developer relationships",
      "Viewings coordinated across our own portfolio and the wider market",
      "Offer negotiation and full transaction management through to Title Deed transfer",
      "Mortgage and conveyancing referrals"
    ],
    ctaLabel: "Browse Properties for Sale",
    ctaHref: "listings.html",
    sortOrder: 0
  },
  {
    id: "rent",
    icon: "calendar",
    title: "Rent",
    cardSummary: "A curated portfolio of rental homes and apartments across Dubai, matched to your lifestyle and budget.",
    pageHeading: "A Home Matched to Your Lifestyle",
    pageDescription: "From studios to family villas, we shortlist rentals against your lifestyle and budget, then handle the paperwork so you can move in without the back-and-forth.",
    checklist: [
      "Curated shortlist matched to lifestyle, budget and move-in date",
      "Viewings scheduled around your availability",
      "Tenancy contract and Ejari registration handled for you",
      "Renewal negotiation support if you stay beyond your first term"
    ],
    ctaLabel: "Browse Rentals",
    ctaHref: "listings.html",
    sortOrder: 1
  },
  {
    id: "sell",
    icon: "sign",
    title: "Sell",
    cardSummary: "A free, no-obligation valuation followed by professional photography, listing and negotiation through to handover.",
    pageHeading: "List With Confidence, Sell at the Right Price",
    pageDescription: "We start with an honest, data-backed valuation — then handle marketing, buyer screening and negotiation so your sale closes cleanly and at the best achievable price.",
    checklist: [
      "Free, no-obligation market valuation",
      "Professional photography and floor plans",
      "Listing across our network and major property portals",
      "Qualified buyer screening and viewing management",
      "Offer negotiation through to handover"
    ],
    ctaLabel: "Get a Free Valuation",
    ctaHref: "index.html#contact",
    sortOrder: 2
  },
  {
    id: "offplan-projects",
    icon: "blueprint",
    title: "Off-Plan Projects",
    cardSummary: "Exclusive access to pre-launch and under-construction developments with flexible payment plans and high growth potential.",
    pageHeading: "Invest Early, With Flexible Payment Plans",
    pageDescription: "Exclusive access to pre-launch and under-construction developments from trusted developers, with investor-friendly payment plans and strong capital appreciation potential.",
    checklist: [
      "Access to pre-launch allocations before public release",
      "Independent comparison across developers and payment plans",
      "Escrow-protected, RERA-registered developments only",
      "Construction updates and handover support"
    ],
    ctaLabel: "Browse Off-Plan Projects",
    ctaHref: "offplan-listings.html",
    sortOrder: 3
  },
  {
    id: "property-management",
    icon: "clock",
    title: "Property Management",
    cardSummary: "Tenant sourcing, rent collection, lease renewals and owner reporting — your asset run hands-free, year-round.",
    pageHeading: "Your Asset, Run Hands-Free",
    pageDescription: "From tenant sourcing to owner reporting, we manage your Dubai property year-round so you get the return without the day-to-day involvement — wherever in the world you are.",
    checklist: [
      "Tenant sourcing, screening and lease management",
      "Rent collection and monthly owner statements",
      "Lease renewals and market rate reviews",
      "Maintenance coordination and emergency call-outs",
      "Ejari renewal, DEWA and service charge administration"
    ],
    ctaLabel: "Manage With Us",
    ctaHref: "index.html#contact",
    sortOrder: 4
  },
  {
    id: "property-maintenance",
    icon: "wrench",
    title: "Property Maintenance",
    cardSummary: "AC servicing, repairs, cleaning and handyman visits on call — so your property stays guest- and tenant-ready.",
    pageHeading: "Guest- and Tenant-Ready, On Call",
    pageDescription: "AC servicing, repairs, cleaning and handyman visits — booked on demand or scheduled year-round, so your property stays in show-ready condition between tenancies or guests.",
    checklist: [
      "AC servicing and deep cleaning",
      "Plumbing, electrical and handyman call-outs",
      "Pre-tenancy turnover cleaning and snagging",
      "On-call emergency response"
    ],
    ctaLabel: "Book Maintenance",
    ctaHref: "index.html#contact",
    sortOrder: 5
  }
];
