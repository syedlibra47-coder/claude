// Curated background/accent palettes — chosen for contrast/readability and
// brand cohesion, so picking any of these is guaranteed to look intentional.
// Typography (heading/body/data font + color) is controlled separately and
// far more freely under Theme > Typography — see THEME_FONT_SUGGESTIONS
// below, which is just a helpful shortlist, not a restriction: any Google
// Fonts family name works.

window.THEME_PALETTES = {
  "navy-gold": {
    label: "Navy & Gold",
    tokens: {
      "--navy": "#1F275C", "--navy-deep": "#12173D", "--navy-soft": "#2E3878",
      "--gold": "#C9AF6C", "--gold-light": "#E4CE93", "--gold-dark": "#A98A45",
      "--gray": "#6B6B70", "--ink": "#1B1D28",
      "--paper": "#FFFFFF", "--paper-flat": "#F7F8FB", "--line": "#E4E6EE"
    }
  },
  "charcoal-emerald": {
    label: "Charcoal & Emerald",
    tokens: {
      "--navy": "#1C2622", "--navy-deep": "#0F1613", "--navy-soft": "#2B3A34",
      "--gold": "#2F8F6B", "--gold-light": "#5CBA95", "--gold-dark": "#1F6B4D",
      "--gray": "#6B7370", "--ink": "#16201C",
      "--paper": "#EDEFE8", "--paper-flat": "#F7F8F4", "--line": "#DCE0D6"
    }
  },
  "terracotta-cream": {
    label: "Terracotta & Cream",
    tokens: {
      "--navy": "#6B3A2E", "--navy-deep": "#4A2720", "--navy-soft": "#8A5142",
      "--gold": "#D98E4A", "--gold-light": "#F0BC85", "--gold-dark": "#B06B2C",
      "--gray": "#8A7F76", "--ink": "#2E211B",
      "--paper": "#F5EDE3", "--paper-flat": "#FBF6EF", "--line": "#E8D9C8"
    }
  },
  "midnight-rosegold": {
    label: "Midnight & Rose Gold",
    tokens: {
      "--navy": "#221B2E", "--navy-deep": "#150F1E", "--navy-soft": "#362B45",
      "--gold": "#C98B7A", "--gold-light": "#E3B3A5", "--gold-dark": "#A8695A",
      "--gray": "#7A7580", "--ink": "#1E1820",
      "--paper": "#F1E9E7", "--paper-flat": "#FAF5F3", "--line": "#E3D6D2"
    }
  }
};

// Shortlist per role, shown as <datalist> suggestions in the admin Theme
// tab — the input still accepts any Google Fonts family name typed in.
window.THEME_FONT_SUGGESTIONS = {
  heading: [
    "Fraunces", "Playfair Display", "DM Serif Display", "Merriweather", "Lora",
    "Cormorant Garamond", "Libre Baskerville", "Crimson Text", "Poppins", "Marcellus",
    "Bricolage Grotesque", "Instrument Serif", "Bodoni Moda", "Newsreader",
    "Spectral", "Big Shoulders Display", "Prata", "Domine", "Young Serif",
    "Faustina", "Gilda Display", "Abril Fatface", "Cardo", "EB Garamond",
    "Petrona", "Zilla Slab", "Vollkorn", "Frank Ruhl Libre"
  ],
  body: [
    "Manrope", "Inter", "DM Sans", "Work Sans", "Nunito Sans", "Source Sans 3",
    "Outfit", "Karla", "Mulish", "Poppins", "Plus Jakarta Sans", "Sora",
    "Figtree", "Albert Sans", "Urbanist", "Instrument Sans", "Lexend", "Onest",
    "Public Sans", "IBM Plex Sans", "Rubik", "Hanken Grotesk", "Space Grotesk",
    "Epilogue", "Be Vietnam Pro", "Red Hat Text", "Schibsted Grotesk", "Geist",
    "Open Sans", "Roboto"
  ],
  data: [
    "IBM Plex Mono", "JetBrains Mono", "Roboto Mono", "Space Mono",
    "Source Code Pro", "Fira Code", "Inconsolata", "DM Mono", "Red Hat Mono",
    "Martian Mono", "Overpass Mono", "Azeret Mono", "Spline Sans Mono",
    "Ubuntu Mono", "PT Mono", "Cousine", "Anonymous Pro", "Courier Prime",
    "Fragment Mono", "Geist Mono", "Chivo Mono"
  ],
  card: [
    "Manrope", "Inter", "DM Sans", "Work Sans", "Nunito Sans", "Source Sans 3",
    "Outfit", "Karla", "Poppins", "Fraunces", "Plus Jakarta Sans", "Sora",
    "Figtree", "Albert Sans", "Urbanist", "Instrument Sans", "Public Sans",
    "Rubik", "Space Grotesk", "Epilogue", "Be Vietnam Pro", "Schibsted Grotesk",
    "Open Sans", "Roboto"
  ],
  blog: [
    "Manrope", "Inter", "DM Sans", "Work Sans", "Nunito Sans", "Source Sans 3",
    "Outfit", "Karla", "Poppins", "Fraunces", "Plus Jakarta Sans", "Sora",
    "Figtree", "Albert Sans", "Urbanist", "Instrument Sans", "Public Sans",
    "Rubik", "Space Grotesk", "Epilogue", "Be Vietnam Pro", "Schibsted Grotesk",
    "Open Sans", "Roboto"
  ],
  form: [
    "Manrope", "Inter", "DM Sans", "Work Sans", "Nunito Sans", "Source Sans 3",
    "Outfit", "Karla", "Poppins", "Plus Jakarta Sans", "Sora", "Figtree",
    "Albert Sans", "Urbanist", "Instrument Sans", "Public Sans", "Rubik",
    "Space Grotesk", "Epilogue", "Be Vietnam Pro", "Schibsted Grotesk",
    "Open Sans", "Roboto"
  ]
};
