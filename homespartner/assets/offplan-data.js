// Shared off-plan project data — used by offplan-listings.html (grid) and
// offplan-detail.html (?id=<slug>). Add a new object here to create a new
// project card + detail page automatically; no new HTML file needed.

window.OFFPLAN_DATA = {
  "the-archive-dlrc": {
    id: "the-archive-dlrc",
    title: "The Archive",
    developer: "Imtiaz",
    community: "Dubai Land Residence Complex (DLRC)",
    city: "Dubai",
    status: "New Launch",
    statusBadge: "badge--gold",
    category: "Apartments",
    tags: ["Studios", "Apartments"],
    price: 666000,
    priceLabel: "AED 666,000",
    handover: "Q3 2028",
    roi: "5%",
    hero: "assets/photos/interior-living.jpg",
    gallery: ["assets/photos/interior-living.jpg", "assets/photos/interior-kitchen.jpg", "assets/photos/interior-dining.jpg", "assets/photos/dubai-marina-towers.jpg"],
    description: "A two-storey lobby library with 10,000 physical books and a private reading nook built into every home — The Archive brings a literary theme to Dubai Land Residence Complex. Studios, one, two and three-bedroom homes sit within a resort-style podium built for slow mornings and long evenings.",
    unitTypes: [
      { type: "Studio", size: "from 360 sq.ft", price: "from AED 666,000" },
      { type: "1 Bed Compact", size: "from 546 sq.ft", price: "from AED 890,000" },
      { type: "1 Bed Executive", size: "from 600 sq.ft", price: "from AED 960,000" },
      { type: "2 Bed", size: "from 1,022 sq.ft", price: "from AED 1,450,000" },
      { type: "3 Bed", size: "from 1,305 sq.ft", price: "from AED 1,890,000" }
    ],
    paymentPlans: [
      {
        label: "50/50",
        segments: [
          { name: "On Booking", pct: 20 },
          { name: "During Construction", pct: 30 },
          { name: "On Handover", pct: 50 }
        ],
        note: "Plus 4% DLD fee + admin fee on booking."
      },
      {
        label: "60/40",
        segments: [
          { name: "On Booking", pct: 20 },
          { name: "During Construction", pct: 40 },
          { name: "Post-Handover (3 yrs)", pct: 40 }
        ],
        note: "Post-handover balance in quarterly 3.3% instalments over 3 years."
      }
    ],
    amenities: ["Grand Arrival Library", "Writer's Rooms", "Reading Lounge", "Gymnasium", "Rooftop Adult Pool", "Rooftop Children's Pool", "Outdoor Cinema", "Mini Golf", "Kids' Play Area", "Pet Area", "Landscaped Garden", "BBQ Lounge", "Relaxation Lounges"],
    locationHighlights: [
      { label: "Dubai Academic City", time: "5 min" },
      { label: "Dubai Outlet Mall", time: "5 min" },
      { label: "IMG Worlds of Adventure", time: "10 min" },
      { label: "Global Village", time: "10 min" },
      { label: "Mohammed Bin Rashid Library", time: "15 min" },
      { label: "Downtown Dubai", time: "20 min" },
      { label: "Dubai International Airport", time: "20 min" }
    ],
    developerBlurb: "Imtiaz is a Dubai-based developer known for design-led residential communities that pair strong amenities with investor-friendly payment plans."
  },

  "marina-gold-residences": {
    id: "marina-gold-residences",
    title: "Marina Gold Residences",
    developer: "Meridian Developments",
    community: "Dubai Marina",
    city: "Dubai",
    status: "New Launch",
    statusBadge: "badge--gold",
    category: "Apartments",
    tags: ["Apartments", "Townhouses"],
    price: 890000,
    priceLabel: "AED 890,000",
    handover: "Q4 2027",
    roi: "6.2%",
    hero: "assets/photos/hero-dubai-marina.jpg",
    gallery: ["assets/photos/hero-dubai-marina.jpg", "assets/photos/dubai-marina-towers.jpg", "assets/photos/interior-living.jpg", "assets/photos/interior-kitchen.jpg"],
    description: "A twin-tower marina address with full-height glazing over the yacht basin, Marina Gold Residences pairs hotel-style amenities with flexible layouts across one, two and three-bedroom apartments and duplex townhouses.",
    unitTypes: [
      { type: "1 Bed", size: "from 780 sq.ft", price: "from AED 890,000" },
      { type: "2 Bed", size: "from 1,180 sq.ft", price: "from AED 1,380,000" },
      { type: "3 Bed Townhouse", size: "from 1,950 sq.ft", price: "from AED 2,650,000" }
    ],
    paymentPlans: [
      {
        label: "20/80",
        segments: [
          { name: "On Booking", pct: 20 },
          { name: "On Handover", pct: 80 }
        ],
        note: "Plus 4% DLD fee + admin fee on booking."
      }
    ],
    amenities: ["Infinity Pool", "Marina-Facing Gym", "Yacht Club Lounge", "Kids' Pool & Play Area", "Padel Court", "Co-Working Lounge", "Concierge Service", "Landscaped Podium Garden"],
    locationHighlights: [
      { label: "Marina Walk", time: "2 min" },
      { label: "JBR Beach", time: "5 min" },
      { label: "Palm Jumeirah", time: "10 min" },
      { label: "Dubai Marina Mall", time: "3 min" },
      { label: "Downtown Dubai", time: "20 min" }
    ],
    developerBlurb: "Meridian Developments focuses on waterfront residential towers across Dubai's key marina and canal communities."
  },

  "downtown-horizon-towers": {
    id: "downtown-horizon-towers",
    title: "Downtown Horizon Towers",
    developer: "Skyline Properties",
    community: "Downtown Dubai",
    city: "Dubai",
    status: "Selling Fast",
    statusBadge: "badge--navy",
    category: "Apartments",
    tags: ["Apartments", "Penthouses"],
    price: 1400000,
    priceLabel: "AED 1.4M",
    handover: "Q2 2026",
    roi: "5.5%",
    hero: "assets/photos/burj-khalifa.jpg",
    gallery: ["assets/photos/burj-khalifa.jpg", "assets/photos/interior-living.jpg", "assets/photos/business-bay.jpg", "assets/photos/interior-kitchen.jpg"],
    description: "Direct Burj Khalifa and fountain views from a boulevard address, Downtown Horizon Towers is nearing completion with move-in ready interiors and a sky-lounge podium overlooking the Opera District.",
    unitTypes: [
      { type: "1 Bed", size: "from 850 sq.ft", price: "from AED 1,400,000" },
      { type: "2 Bed", size: "from 1,320 sq.ft", price: "from AED 2,100,000" },
      { type: "Penthouse", size: "from 2,800 sq.ft", price: "from AED 6,500,000" }
    ],
    paymentPlans: [
      {
        label: "40/60",
        segments: [
          { name: "On Booking", pct: 40 },
          { name: "On Handover", pct: 60 }
        ],
        note: "Plus 4% DLD fee + admin fee on booking."
      }
    ],
    amenities: ["Burj Khalifa View Infinity Pool", "Sky Lounge", "Gymnasium", "Cinema Room", "Business Centre", "Valet Parking", "24/7 Concierge", "Kids' Club"],
    locationHighlights: [
      { label: "Dubai Mall", time: "3 min" },
      { label: "Burj Khalifa", time: "3 min" },
      { label: "Dubai Opera", time: "5 min" },
      { label: "Business Bay", time: "5 min" },
      { label: "DXB Airport", time: "15 min" }
    ],
    developerBlurb: "Skyline Properties delivers premium high-rise residences in Dubai's most established boulevard and business districts."
  },

  "creek-vista-heights": {
    id: "creek-vista-heights",
    title: "Creek Vista Heights",
    developer: "Waterline Estates",
    community: "Dubai Creek Harbour",
    city: "Dubai",
    status: "Pre-Launch",
    statusBadge: "badge--gold",
    category: "Villas",
    tags: ["Villas", "Waterfront"],
    price: 750000,
    priceLabel: "AED 750,000",
    handover: "Q1 2028",
    roi: "6.8%",
    hero: "assets/photos/palm-jumeirah.jpg",
    gallery: ["assets/photos/palm-jumeirah.jpg", "assets/photos/interior-living.jpg", "assets/photos/interior-dining.jpg", "assets/photos/dubai-marina-towers.jpg"],
    description: "Creek Vista Heights sits directly on the Dubai Creek Harbour promenade with Downtown skyline views across the water — a mix of waterfront apartments and townhouse-style villas with an investor-friendly 10% entry point.",
    unitTypes: [
      { type: "1 Bed", size: "from 720 sq.ft", price: "from AED 750,000" },
      { type: "3 Bed Villa", size: "from 2,400 sq.ft", price: "from AED 3,200,000" },
      { type: "4 Bed Villa", size: "from 3,100 sq.ft", price: "from AED 4,100,000" }
    ],
    paymentPlans: [
      {
        label: "10/90",
        segments: [
          { name: "On Booking", pct: 10 },
          { name: "On Handover", pct: 90 }
        ],
        note: "Plus 4% DLD fee + admin fee on booking."
      }
    ],
    amenities: ["Creek Promenade Access", "Infinity Pool", "Private Beach Lagoon", "Gymnasium", "Kids' Play Area", "Cycling Track", "Retail Boulevard", "24/7 Security"],
    locationHighlights: [
      { label: "Creek Promenade", time: "1 min" },
      { label: "Ras Al Khor Wildlife Sanctuary", time: "5 min" },
      { label: "Downtown Dubai", time: "12 min" },
      { label: "DXB Airport", time: "10 min" },
      { label: "Dubai Creek Tower Site", time: "3 min" }
    ],
    developerBlurb: "Waterline Estates specialises in waterfront master communities along Dubai's creek and coastal corridors."
  },

  "business-bay-skyline": {
    id: "business-bay-skyline",
    title: "Business Bay Skyline",
    developer: "Meridian Developments",
    community: "Business Bay",
    city: "Dubai",
    status: "Almost Sold Out",
    statusBadge: "badge--navy",
    category: "Apartments",
    tags: ["Apartments", "Offices"],
    price: 1100000,
    priceLabel: "AED 1.1M",
    handover: "Q3 2025",
    roi: "5.9%",
    hero: "assets/photos/business-bay.jpg",
    gallery: ["assets/photos/business-bay.jpg", "assets/photos/interior-kitchen.jpg", "assets/photos/interior-dining.jpg", "assets/photos/burj-khalifa.jpg"],
    description: "Nearing handover on the Business Bay canal, Skyline pairs mixed-use apartments and boutique office floors with canal-boardwalk access — a near-complete asset with a fast 60/40 close for buyers who want certainty.",
    unitTypes: [
      { type: "1 Bed", size: "from 810 sq.ft", price: "from AED 1,100,000" },
      { type: "2 Bed", size: "from 1,240 sq.ft", price: "from AED 1,780,000" },
      { type: "Office Suite", size: "from 450 sq.ft", price: "from AED 980,000" }
    ],
    paymentPlans: [
      {
        label: "60/40",
        segments: [
          { name: "On Booking", pct: 60 },
          { name: "On Handover", pct: 40 }
        ],
        note: "Plus 4% DLD fee + admin fee on booking."
      }
    ],
    amenities: ["Canal Boardwalk Access", "Rooftop Pool", "Gymnasium", "Business Lounge", "Retail Podium", "Covered Parking", "24/7 Security", "Smart Home System"],
    locationHighlights: [
      { label: "Business Bay Canal", time: "1 min" },
      { label: "Downtown Dubai", time: "5 min" },
      { label: "Dubai Mall", time: "8 min" },
      { label: "DIFC", time: "8 min" },
      { label: "DXB Airport", time: "15 min" }
    ],
    developerBlurb: "Meridian Developments focuses on waterfront residential towers across Dubai's key marina and canal communities."
  },

  "jvc-skyline-residences": {
    id: "jvc-skyline-residences",
    title: "JVC Skyline Residences",
    developer: "Horizon Estates",
    community: "Jumeirah Village Circle",
    city: "Dubai",
    status: "Under Construction",
    statusBadge: "badge--navy",
    category: "Apartments",
    tags: ["Apartments", "Studios"],
    price: 580000,
    priceLabel: "AED 580,000",
    handover: "Q2 2027",
    roi: "7.1%",
    hero: "assets/photos/interior-kitchen.jpg",
    gallery: ["assets/photos/interior-kitchen.jpg", "assets/photos/dubai-marina-towers.jpg", "assets/photos/interior-living.jpg", "assets/photos/interior-dining.jpg"],
    description: "An entry-level investment play in JVC's cluster park district, Skyline Residences offers studios and one-bedroom apartments with strong rental yields and a light 30/70 payment structure.",
    unitTypes: [
      { type: "Studio", size: "from 410 sq.ft", price: "from AED 580,000" },
      { type: "1 Bed", size: "from 680 sq.ft", price: "from AED 820,000" },
      { type: "2 Bed", size: "from 1,050 sq.ft", price: "from AED 1,190,000" }
    ],
    paymentPlans: [
      {
        label: "30/70",
        segments: [
          { name: "On Booking", pct: 30 },
          { name: "During Construction", pct: 20 },
          { name: "On Handover", pct: 50 }
        ],
        note: "Plus 4% DLD fee + admin fee on booking."
      }
    ],
    amenities: ["Rooftop Pool", "Gymnasium", "Cluster Park Access", "Kids' Play Area", "BBQ Deck", "Retail at Podium", "Covered Parking", "24/7 Security"],
    locationHighlights: [
      { label: "Circle Mall", time: "3 min" },
      { label: "Dubai Marina", time: "15 min" },
      { label: "Al Maktoum Airport", time: "20 min" },
      { label: "Downtown Dubai", time: "18 min" },
      { label: "DXB Airport", time: "25 min" }
    ],
    developerBlurb: "Horizon Estates delivers accessible, high-yield residential projects across Dubai's fast-growing suburban communities."
  },

  "palm-beach-collection": {
    id: "palm-beach-collection",
    title: "Palm Beach Collection",
    developer: "Waterline Estates",
    community: "Palm Jumeirah",
    city: "Dubai",
    status: "Pre-Launch",
    statusBadge: "badge--gold",
    category: "Villas",
    tags: ["Villas", "Apartments"],
    price: 2800000,
    priceLabel: "AED 2.8M",
    handover: "Q4 2028",
    roi: "5.2%",
    hero: "assets/photos/dubai-marina-towers.jpg",
    gallery: ["assets/photos/dubai-marina-towers.jpg", "assets/photos/interior-living.jpg", "assets/photos/palm-jumeirah.jpg", "assets/photos/interior-kitchen.jpg"],
    description: "A rare new-build release on Palm Jumeirah's trunk, Palm Beach Collection offers beachfront apartments and signature villas with private pools, aimed at end-users and legacy investors alike.",
    unitTypes: [
      { type: "2 Bed Apartment", size: "from 1,650 sq.ft", price: "from AED 2,800,000" },
      { type: "4 Bed Villa", size: "from 4,200 sq.ft", price: "from AED 9,500,000" },
      { type: "5 Bed Signature Villa", size: "from 5,800 sq.ft", price: "from AED 14,200,000" }
    ],
    paymentPlans: [
      {
        label: "20/80",
        segments: [
          { name: "On Booking", pct: 20 },
          { name: "During Construction", pct: 30 },
          { name: "On Handover", pct: 50 }
        ],
        note: "Plus 4% DLD fee + admin fee on booking."
      }
    ],
    amenities: ["Private Beach Access", "Private Villa Pools", "Beach Club", "Marina Berths", "Gymnasium & Spa", "Kids' Club", "Concierge Service", "24/7 Security"],
    locationHighlights: [
      { label: "Palm Beach", time: "1 min" },
      { label: "Atlantis The Palm", time: "8 min" },
      { label: "Dubai Marina", time: "10 min" },
      { label: "Downtown Dubai", time: "20 min" },
      { label: "DXB Airport", time: "30 min" }
    ],
    developerBlurb: "Waterline Estates specialises in waterfront master communities along Dubai's creek and coastal corridors."
  },

  "al-furjan-green-homes": {
    id: "al-furjan-green-homes",
    title: "Al Furjan Green Homes",
    developer: "Horizon Estates",
    community: "Al Furjan",
    city: "Dubai",
    status: "Selling Fast",
    statusBadge: "badge--navy",
    category: "Townhouses",
    tags: ["Townhouses", "Villas"],
    price: 1650000,
    priceLabel: "AED 1.65M",
    handover: "Q1 2027",
    roi: "6.4%",
    hero: "assets/photos/interior-dining.jpg",
    gallery: ["assets/photos/interior-dining.jpg", "assets/photos/interior-kitchen.jpg", "assets/photos/business-bay.jpg", "assets/photos/hero-dubai-marina.jpg"],
    description: "A family-first townhouse community in Al Furjan with private gardens, a central park spine and Metro access — Al Furjan Green Homes is built for buyers who want space without leaving the city.",
    unitTypes: [
      { type: "3 Bed Townhouse", size: "from 1,980 sq.ft", price: "from AED 1,650,000" },
      { type: "4 Bed Townhouse", size: "from 2,450 sq.ft", price: "from AED 2,150,000" }
    ],
    paymentPlans: [
      {
        label: "40/60",
        segments: [
          { name: "On Booking", pct: 40 },
          { name: "On Handover", pct: 60 }
        ],
        note: "Plus 4% DLD fee + admin fee on booking."
      }
    ],
    amenities: ["Central Community Park", "Shared Swimming Pool", "Gymnasium", "Kids' Play Area", "Jogging Track", "Retail Plaza", "Covered Parking (2)", "24/7 Security"],
    locationHighlights: [
      { label: "Al Furjan Metro Station", time: "3 min" },
      { label: "Ibn Battuta Mall", time: "8 min" },
      { label: "Dubai Marina", time: "12 min" },
      { label: "Al Maktoum Airport", time: "15 min" },
      { label: "DXB Airport", time: "25 min" }
    ],
    developerBlurb: "Horizon Estates delivers accessible, high-yield residential projects across Dubai's fast-growing suburban communities."
  }
};
