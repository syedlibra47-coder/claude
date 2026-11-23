// Shared office data — used by contact.html for both the office cards
// and the animated world-map pins (via latitude/longitude + geo-projection.js).

window.OFFICES_DATA = [
  {
    id: "dubai-hq",
    badgeLabel: "Main Office",
    title: "Dubai Headquarters",
    address: "Office M-55, The Curve Building, Sheikh Zayed Road, Al Quoz 3, Dubai, UAE",
    phone: "97144456705",
    phoneDisplay: "+971 4 445 6705",
    email: "info@homespartner.ae",
    byAppointmentNote: null,
    mapLabel: "DUBAI — MAIN OFFICE",
    latitude: 25.2048,
    longitude: 55.2708,
    isHub: true,
    sortOrder: 0
  },
  {
    id: "uk-office",
    badgeLabel: "UK Office",
    title: "United Kingdom",
    address: "London office serving UK residential sales, lettings and overseas investment advisory for clients relocating to or investing in Dubai.",
    phone: null,
    phoneDisplay: null,
    email: "info@homespartner.ae",
    byAppointmentNote: "By appointment — enquire via the form below",
    mapLabel: "LONDON",
    latitude: 51.5074,
    longitude: -0.1278,
    isHub: false,
    sortOrder: 1
  },
  {
    id: "pakistan-office",
    badgeLabel: "Pakistan Office",
    title: "Karachi, Pakistan",
    address: "Office No. 601, Ebrahim Estates Building, Shahrah-e-Faisal, Karachi, Pakistan",
    phone: null,
    phoneDisplay: null,
    email: "info@homespartner.ae",
    byAppointmentNote: null,
    mapLabel: "KARACHI",
    latitude: 24.8607,
    longitude: 67.0011,
    isHub: false,
    sortOrder: 2
  },
  {
    id: "india-office",
    badgeLabel: "India Office",
    title: "Ahmedabad, India",
    address: "A-325, Sun South Street, B/S Aarvi 156, Near Bopal Fire Station, South Bopal, Ahmedabad – 380058, Gujarat, India",
    phone: null,
    phoneDisplay: null,
    email: "info@homespartner.ae",
    byAppointmentNote: null,
    mapLabel: "AHMEDABAD",
    latitude: 23.0225,
    longitude: 72.5714,
    isHub: false,
    sortOrder: 3
  }
];
