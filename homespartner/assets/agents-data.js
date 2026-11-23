// Shared agent data — used by agents.html (directory) and agent-detail.html
// (?id=<slug>, profile + their active listings). Add a new agent here (or
// via the admin panel, once Supabase is connected) to add them automatically.

window.AGENTS_DATA = [
  {
    id: "syed-hussain",
    name: "Syed Hussain",
    title: "Property Consultant",
    photoUrl: null,
    phone: "971585210926",
    phoneDisplay: "+971 58 521 0926",
    email: "syed@homespartner.ae",
    languages: ["English"],
    specialties: ["Palm Jumeirah", "Business Bay", "Dubai Marina"],
    bio: "Syed works with buyers, sellers and landlords across Palm Jumeirah, Business Bay and Dubai Marina, helping clients move quickly on the right property with clear, straightforward guidance from first viewing to handover.",
    sortOrder: 0
  },
  {
    id: "syed-usman",
    name: "Syed Usman",
    title: "Property Consultant",
    photoUrl: null,
    phone: "971585880859",
    phoneDisplay: "+971 58 588 0859",
    email: "manager@homespartner.ae",
    languages: ["English"],
    specialties: ["Dubai Marina", "Jumeirah Lake Towers"],
    bio: "Syed focuses on Dubai Marina and Jumeirah Lake Towers, supporting both resale buyers and tenants with a practical, no-pressure approach to finding the right home or investment.",
    sortOrder: 1
  },
  {
    id: "syed-salman-ali",
    name: "Syed Salman Ali",
    title: "Property Consultant",
    photoUrl: null,
    phone: "971545325328",
    phoneDisplay: "+971 54 532 5328",
    email: "salman@homespartner.ae",
    languages: ["English"],
    specialties: ["Downtown Dubai", "Jumeirah Village Circle", "Dubai Creek Harbour"],
    bio: "Syed specialises in Downtown Dubai, Jumeirah Village Circle and Dubai Creek Harbour, guiding clients through both ready and off-plan opportunities across these fast-growing communities.",
    sortOrder: 2
  }
];
