// ============================================================
// Loads listings + off-plan projects from Supabase (live, admin-editable)
// and falls back to the static assets/listings-data.js / offplan-data.js
// files if Supabase isn't configured yet or a fetch fails.
//
// Exposes window.dataReady — a Promise every page script should
// `await` before reading window.LISTINGS_DATA / window.OFFPLAN_DATA.
// ============================================================
// Applies a curated background/accent palette (see assets/theme-presets.js)
// plus per-role typography (font + color, independently for headings, body
// text, data/prices, listing & project cards, blog/video cards and the
// listing-page enquiry form) to every page, by overriding the :root CSS
// custom properties defined in styles.css and lazily loading whichever
// Google Fonts are chosen. Safe to call with only one argument, or with
// defaults — it's a no-op wherever there's nothing to set.
window.applyTheme = function (paletteKey, typography) {
  const palette = window.THEME_PALETTES && window.THEME_PALETTES[paletteKey];
  const tokens = Object.assign({}, palette ? palette.tokens : {});

  // role key -> [font token(s), color token, fallback font stack]
  const roleMap = {
    heading: [['--font-serif', '--font-head'], '--heading-color', 'Georgia, serif'],
    body: [['--font-body'], '--body-color', "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"],
    data: [['--font-mono'], '--data-color', "'SF Mono', ui-monospace, monospace"],
    card: [['--font-card'], '--card-color', "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"],
    blog: [['--font-blog'], '--blog-color', "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"],
    form: [['--font-form'], '--form-color', "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"]
  };

  const families = [];
  if (typography) {
    Object.keys(roleMap).forEach(role => {
      const [fontTokens, colorToken, fallback] = roleMap[role];
      const font = typography[role + 'Font'];
      const color = typography[role + 'Color'];
      if (font) {
        const stack = `'${font}', ${fallback}`;
        fontTokens.forEach(t => { tokens[t] = stack; });
        families.push(font);
      }
      if (color) tokens[colorToken] = color;
    });
  }

  if (!Object.keys(tokens).length) return;

  const css = ':root {\n' + Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`).join('\n') + '\n}';
  let styleTag = document.getElementById('theme-override-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'theme-override-style';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = css;

  const uniqueFamilies = [...new Set(families)];
  if (uniqueFamilies.length) {
    const href = 'https://fonts.googleapis.com/css2?' +
      uniqueFamilies.map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`).join('&') + '&display=swap';
    let fontLink = document.getElementById('theme-google-fonts');
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'theme-google-fonts';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    if (fontLink.href !== href) fontLink.href = href;
  }
};

window.dataReady = (async function () {
  const configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes('PASTE_') && !window.SUPABASE_ANON_KEY.includes('PASTE_') &&
    window.supabase;

  if (!configured) {
    return; // static data files (if included) already populated window.LISTINGS_DATA / OFFPLAN_DATA
  }

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  function listingFromRow(row) {
    return {
      id: row.id,
      title: row.title,
      community: row.community,
      city: row.city,
      type: row.type,
      category: row.category,
      price: row.price,
      priceLabel: row.price_label,
      priceSuffix: row.price_suffix || undefined,
      beds: row.beds,
      baths: row.baths,
      sqft: row.sqft,
      tags: row.tags || [],
      hero: row.hero,
      gallery: row.gallery && row.gallery.length ? row.gallery : [row.hero],
      description: row.description,
      amenities: row.amenities || [],
      featured: row.featured,
      permitNumber: row.permit_number || '',
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      agent: {
        name: row.agent_name,
        phone: row.agent_phone,
        phoneDisplay: row.agent_phone_display,
        email: row.agent_email
      }
    };
  }

  function offplanFromRow(row) {
    return {
      id: row.id,
      title: row.title,
      developer: row.developer,
      community: row.community,
      city: row.city,
      status: row.status,
      statusBadge: row.status_badge,
      category: row.category,
      tags: row.tags || [],
      price: row.price,
      priceLabel: row.price_label,
      handover: row.handover,
      roi: row.roi,
      hero: row.hero,
      gallery: row.gallery && row.gallery.length ? row.gallery : [row.hero],
      description: row.description,
      unitTypes: row.unit_types || [],
      paymentPlans: row.payment_plans || [],
      amenities: row.amenities || [],
      locationHighlights: row.location_highlights || [],
      developerBlurb: row.developer_blurb,
      featured: row.featured,
      permitNumber: row.permit_number || ''
    };
  }

  function serviceFromRow(row) {
    return {
      id: row.id,
      icon: row.icon,
      title: row.title,
      cardSummary: row.card_summary,
      pageHeading: row.page_heading,
      pageDescription: row.page_description,
      checklist: row.checklist || [],
      ctaLabel: row.cta_label,
      ctaHref: row.cta_href,
      sortOrder: row.sort_order
    };
  }

  function officeFromRow(row) {
    return {
      id: row.id,
      badgeLabel: row.badge_label,
      title: row.title,
      address: row.address,
      phone: row.phone || null,
      phoneDisplay: row.phone_display || null,
      email: row.email || null,
      byAppointmentNote: row.by_appointment_note || null,
      mapLabel: row.map_label,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      isHub: row.is_hub,
      sortOrder: row.sort_order
    };
  }

  function faqFromRow(row) {
    return { id: row.id, question: row.question, answer: row.answer, sortOrder: row.sort_order };
  }

  function contactContentFromRow(row) {
    return {
      heroEyebrow: row.hero_eyebrow, heroHeading: row.hero_heading, heroSubtitle: row.hero_subtitle,
      introEyebrow: row.intro_eyebrow, introHeading: row.intro_heading,
      introParagraph1: row.intro_paragraph_1, introParagraph2: row.intro_paragraph_2,
      networkEyebrow: row.network_eyebrow, networkHeading: row.network_heading, networkSubtitle: row.network_subtitle,
      formEyebrow: row.form_eyebrow, formHeading: row.form_heading, formSubtitle: row.form_subtitle,
      faqEyebrow: row.faq_eyebrow, faqHeading: row.faq_heading,
      whatsappNumber: row.whatsapp_number, generalPhone: row.general_phone, generalEmail: row.general_email
    };
  }

  function agentFromRow(row) {
    return {
      id: row.id, name: row.name, title: row.title, photoUrl: row.photo_url || null,
      phone: row.phone, phoneDisplay: row.phone_display, email: row.email,
      languages: row.languages || [], specialties: row.specialties || [],
      bio: row.bio || '', sortOrder: row.sort_order
    };
  }

  function testimonialFromRow(row) {
    return {
      id: row.id, authorName: row.author_name, authorContext: row.author_context,
      rating: row.rating, reviewText: row.review_text, source: row.source,
      agentId: row.agent_id, featured: row.featured, sortOrder: row.sort_order
    };
  }

  function popupBannerFromRow(row) {
    return {
      id: row.id, title: row.title, imageUrl: row.image_url, imageAlt: row.image_alt,
      linkUrl: row.link_url, width: row.width, height: row.height,
      targetScope: row.target_scope, targetPages: row.target_pages || [],
      autoDismissSeconds: row.auto_dismiss_seconds, reshowAfterSeconds: row.reshow_after_seconds,
      nextPopupDelaySeconds: row.next_popup_delay_seconds,
      active: row.active, sortOrder: row.sort_order
    };
  }

  function jobListingFromRow(row) {
    return {
      id: row.id, title: row.title, location: row.location, department: row.department || null,
      jobType: row.job_type, experienceLevel: row.experience_level || null,
      description: row.description || '', isActive: row.is_active, sortOrder: row.sort_order
    };
  }

  function careersContentFromRow(row) {
    return {
      heroEyebrow: row.hero_eyebrow, heroHeading: row.hero_heading, heroSubtitle: row.hero_subtitle,
      whyJoinEyebrow: row.why_join_eyebrow, whyJoinHeading: row.why_join_heading, whyJoinIntro: row.why_join_intro,
      valueProps: row.value_props || [],
      valuesEyebrow: row.values_eyebrow, valuesHeading: row.values_heading, coreValues: row.core_values || [],
      jobsEyebrow: row.jobs_eyebrow, jobsHeading: row.jobs_heading, jobsSubtitle: row.jobs_subtitle,
      cvEyebrow: row.cv_eyebrow, cvHeading: row.cv_heading, cvSubtitle: row.cv_subtitle, cvEmail: row.cv_email,
      faqEyebrow: row.faq_eyebrow, faqHeading: row.faq_heading, faqs: row.faqs || []
    };
  }

  function siteChromeFromRow(row) {
    return {
      navLinks: row.nav_links || [],
      whyusLabel: row.whyus_label, whyusHref: row.whyus_href, whyusSubmenu: row.whyus_submenu || [],
      contactLabel: row.contact_label, contactHref: row.contact_href,
      ctaText: row.cta_text, ctaHref: row.cta_href,
      footerBlurb: row.footer_blurb, footerEmail: row.footer_email,
      footerColumns: row.footer_columns || [], footerCopyright: row.footer_copyright,
      reraBrokerNumber: row.rera_broker_number || '', tradeLicenseNumber: row.trade_license_number || '',
      registeredOfficeAddress: row.registered_office_address || ''
    };
  }

  function homepageContentFromRow(row) {
    return {
      heroBadgeText: row.hero_badge_text, heroHeading: row.hero_heading, heroSubtitle: row.hero_subtitle,
      heroBgType: row.hero_bg_type, heroBgImage: row.hero_bg_image, heroBgVideoId: row.hero_bg_video_id,
      heroOverlayColor: row.hero_overlay_color, heroOverlayOpacity: row.hero_overlay_opacity,
      heroSearchPlaceholder: row.hero_search_placeholder, heroFilters: row.hero_filters || [],
      stats: row.stats || [], quickActions: row.quick_actions || [],
      servicesEyebrow: row.services_eyebrow, servicesHeading: row.services_heading, servicesSubtitle: row.services_subtitle,
      listingsEyebrow: row.listings_eyebrow, listingsHeading: row.listings_heading, listingsSubtitle: row.listings_subtitle,
      offplanEyebrow: row.offplan_eyebrow, offplanHeading: row.offplan_heading, offplanSubtitle: row.offplan_subtitle,
      offplanFeatures: row.offplan_features || [],
      officesEyebrow: row.offices_eyebrow, officesHeading: row.offices_heading, officesSubtitle: row.offices_subtitle,
      youtubeEyebrow: row.youtube_eyebrow, youtubeHeading: row.youtube_heading, youtubeSubtitle: row.youtube_subtitle,
      whyusEyebrow: row.whyus_eyebrow, whyusHeading: row.whyus_heading, whyusSubtitle: row.whyus_subtitle, whyusItems: row.whyus_items || [],
      ctaHeading: row.cta_heading, ctaSubtitle: row.cta_subtitle,
      footerBlurb: row.footer_blurb
    };
  }

  try {
    const [listingsRes, offplanRes, servicesRes, officesRes, faqsRes, contactContentRes, agentsRes, jobListingsRes, careersContentRes, siteSettingsRes, homepageContentRes, siteChromeRes, pageHeadersRes, testimonialsRes, popupBannersRes] = await Promise.all([
      client.from('listings').select('*').order('created_at', { ascending: false }),
      client.from('offplan_projects').select('*').order('created_at', { ascending: false }),
      client.from('services').select('*').order('sort_order', { ascending: true }),
      client.from('offices').select('*').order('sort_order', { ascending: true }),
      client.from('faqs').select('*').order('sort_order', { ascending: true }),
      client.from('contact_page_content').select('*').eq('id', 'main').maybeSingle(),
      client.from('agents').select('*').order('sort_order', { ascending: true }),
      client.from('job_listings').select('*').order('sort_order', { ascending: true }),
      client.from('careers_page_content').select('*').eq('id', 'main').maybeSingle(),
      client.from('site_settings').select('*').eq('id', 'main').maybeSingle(),
      client.from('homepage_content').select('*').eq('id', 'main').maybeSingle(),
      client.from('site_chrome').select('*').eq('id', 'main').maybeSingle(),
      client.from('page_headers').select('*'),
      client.from('testimonials').select('*').order('sort_order', { ascending: true }),
      client.from('popup_banners').select('*').order('sort_order', { ascending: true })
    ]);

    if (!listingsRes.error && listingsRes.data) {
      const data = {};
      listingsRes.data.forEach(row => { data[row.id] = listingFromRow(row); });
      if (Object.keys(data).length) window.LISTINGS_DATA = data;
    }
    if (!offplanRes.error && offplanRes.data) {
      const data = {};
      offplanRes.data.forEach(row => { data[row.id] = offplanFromRow(row); });
      if (Object.keys(data).length) window.OFFPLAN_DATA = data;
    }
    if (!servicesRes.error && servicesRes.data && servicesRes.data.length) {
      window.SERVICES_DATA = servicesRes.data.map(serviceFromRow);
    }
    if (!officesRes.error && officesRes.data && officesRes.data.length) {
      window.OFFICES_DATA = officesRes.data.map(officeFromRow);
    }
    if (!faqsRes.error && faqsRes.data && faqsRes.data.length) {
      window.FAQS_DATA = faqsRes.data.map(faqFromRow);
    }
    if (!contactContentRes.error && contactContentRes.data) {
      window.CONTACT_CONTENT_DATA = contactContentFromRow(contactContentRes.data);
    }
    if (!agentsRes.error && agentsRes.data && agentsRes.data.length) {
      window.AGENTS_DATA = agentsRes.data.map(agentFromRow);
    }
    if (!jobListingsRes.error && jobListingsRes.data) {
      window.JOB_LISTINGS_DATA = jobListingsRes.data.map(jobListingFromRow);
    }
    if (!careersContentRes.error && careersContentRes.data) {
      window.CAREERS_CONTENT_DATA = careersContentFromRow(careersContentRes.data);
    }
    if (!homepageContentRes.error && homepageContentRes.data) {
      window.HOMEPAGE_CONTENT_DATA = homepageContentFromRow(homepageContentRes.data);
    }
    if (!siteChromeRes.error && siteChromeRes.data) {
      window.SITE_CHROME_DATA = siteChromeFromRow(siteChromeRes.data);
    }
    if (!pageHeadersRes.error && pageHeadersRes.data) {
      const map = {};
      pageHeadersRes.data.forEach(row => {
        map[row.page_id] = {
          bgType: row.bg_type, bgColor: row.bg_color, bgImage: row.bg_image, bgVideoId: row.bg_video_id,
          overlayColor: row.overlay_color, overlayOpacity: row.overlay_opacity,
          bannerImage: row.banner_image, bannerLink: row.banner_link,
          bannerHeight: row.banner_height, bannerHeightMobile: row.banner_height_mobile
        };
      });
      window.PAGE_HEADERS_DATA = map;
    }
    if (!testimonialsRes.error && testimonialsRes.data) {
      window.TESTIMONIALS_DATA = testimonialsRes.data.map(testimonialFromRow);
    }
    if (!popupBannersRes.error && popupBannersRes.data) {
      window.POPUP_BANNERS_DATA = popupBannersRes.data.map(popupBannerFromRow);
    }
    if (!siteSettingsRes.error && siteSettingsRes.data) {
      const s = siteSettingsRes.data;
      window.SITE_SETTINGS_DATA = {
        colorPalette: s.color_palette,
        typography: {
          headingFont: s.heading_font, headingColor: s.heading_color,
          bodyFont: s.body_font, bodyColor: s.body_color,
          dataFont: s.data_font, dataColor: s.data_color,
          cardFont: s.card_font, cardColor: s.card_color,
          blogFont: s.blog_font, blogColor: s.blog_color,
          formFont: s.form_font, formColor: s.form_color
        }
      };
    }
    if (window.SITE_SETTINGS_DATA && window.applyTheme) {
      window.applyTheme(window.SITE_SETTINGS_DATA.colorPalette, window.SITE_SETTINGS_DATA.typography);
    }
  } catch (err) {
    console.warn('Supabase fetch failed, using static fallback data.', err);
  }
})();
