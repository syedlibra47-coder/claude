// Approximate center coordinates for common Dubai communities/areas.
// Used as a fallback for the listings search-results map when a listing
// doesn't have its own latitude/longitude set — good enough to cluster
// listings by neighborhood without needing per-building geocoding.
// A small random jitter is applied at render time so multiple listings
// in the same community don't stack exactly on top of one another.
window.DUBAI_COMMUNITY_COORDS = {
  "Palm Jumeirah": [25.1124, 55.1390],
  "Dubai Marina": [25.0805, 55.1403],
  "Downtown Dubai": [25.1972, 55.2744],
  "Business Bay": [25.1857, 55.2708],
  "Jumeirah Lake Towers": [25.0693, 55.1417],
  "JLT": [25.0693, 55.1417],
  "Jumeirah Village Circle": [25.0587, 55.2081],
  "JVC": [25.0587, 55.2081],
  "Jumeirah Village Triangle": [25.0498, 55.1949],
  "Dubai Creek Harbour": [25.1972, 55.3435],
  "Arabian Ranches": [25.0515, 55.2708],
  "Dubai Hills Estate": [25.1041, 55.2455],
  "Dubai South": [24.8896, 55.1614],
  "Dubai Silicon Oasis": [25.1264, 55.3773],
  "Al Barsha": [25.1122, 55.2007],
  "Deira": [25.2697, 55.3095],
  "Bur Dubai": [25.2582, 55.2963],
  "Jumeirah": [25.2048, 55.2477],
  "Mirdif": [25.2167, 55.4167],
  "Al Furjan": [25.0244, 55.1467],
  "Damac Hills": [25.0177, 55.2534],
  "International City": [25.1667, 55.4083],
  "Discovery Gardens": [25.0453, 55.1425],
  "The Springs": [25.0597, 55.1908],
  "The Meadows": [25.0656, 55.1806],
  "Emirates Hills": [25.0736, 55.1608],
  "Motor City": [25.0475, 55.2378],
  "Sports City": [25.0403, 55.2222],
  "Town Square": [25.0022, 55.2661],
  "Al Sufouh": [25.1147, 55.1875],
  "City Walk": [25.2072, 55.2589],
  "Bluewaters Island": [25.0794, 55.1189],
  "Al Quoz": [25.1450, 55.2278],
  "Dubai Investment Park": [24.9857, 55.1667],
  "Dubailand": [25.0447, 55.2764],
  "Al Jaddaf": [25.2178, 55.3242],
  "Meydan": [25.1567, 55.3086],
  "Mudon": [25.0225, 55.2456],
  "Nad Al Sheba": [25.1636, 55.3378],
  "Al Warqa": [25.1972, 55.4083],
  "Dubai Festival City": [25.2225, 55.3517],
  "DIFC": [25.2138, 55.2822],
  "Al Barari": [25.0664, 55.2864],
  "Zabeel": [25.2306, 55.3006],
  "Umm Suqeim": [25.1447, 55.2081],
  "Al Wasl": [25.1994, 55.2461],
  "Dubai Sports City": [25.0403, 55.2222],
  "Dubai Studio City": [25.0447, 55.2181],
  "Remraam": [25.0164, 55.2450],
  "Al Karama": [25.2461, 55.3025],
  "Satwa": [25.2258, 55.2647],
  "Culture Village": [25.2211, 55.3336],
  "Dubai Production City": [25.0389, 55.1944],
  "Mina Rashid": [25.2694, 55.2761],
  "Al Mizhar": [25.2286, 55.4172]
};

// Returns [lat, lon] for a community, or null if unknown.
window.getCommunityCoords = function (community) {
  if (!community) return null;
  const exact = window.DUBAI_COMMUNITY_COORDS[community.trim()];
  if (exact) return exact;
  const key = Object.keys(window.DUBAI_COMMUNITY_COORDS).find(
    k => k.toLowerCase() === community.trim().toLowerCase()
  );
  return key ? window.DUBAI_COMMUNITY_COORDS[key] : null;
};
