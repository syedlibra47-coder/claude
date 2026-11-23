-- ============================================================
-- HomesPartner Real Estate — Supabase schema
-- Run this once in your Supabase project: SQL Editor > New query > paste > Run
-- ============================================================

-- ===== LISTINGS (ready properties for sale/rent) =====
create table if not exists listings (
  id text primary key,                 -- url slug, e.g. "palm-vista-villa"
  title text not null,
  community text not null,
  city text not null default 'Dubai',
  type text not null check (type in ('sale', 'rent')),
  category text not null,              -- Villa, Apartment, Studio, Loft...
  price numeric not null,
  price_label text not null,           -- "AED 2,150,000"
  price_suffix text,                   -- "/month" for rentals, null for sale
  beds text not null,                  -- "4" or "Studio"
  baths text not null,
  sqft text not null,
  tags jsonb not null default '[]',    -- ["Villa", "Sea View", "Private Pool"]
  hero text not null,                  -- main image URL
  gallery jsonb not null default '[]', -- array of image URLs
  description text not null default '',
  amenities jsonb not null default '[]',
  agent_name text not null default '',
  agent_phone text not null default '',
  agent_phone_display text not null default '',
  agent_email text not null default '',
  featured boolean not null default false,   -- show on homepage carousel
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== OFF-PLAN PROJECTS =====
create table if not exists offplan_projects (
  id text primary key,
  title text not null,
  developer text not null,
  community text not null,
  city text not null default 'Dubai',
  status text not null,                -- "New Launch", "Selling Fast", ...
  status_badge text not null default 'badge--gold',  -- badge--gold | badge--navy
  category text not null,              -- Apartments, Villas, Townhouses
  tags jsonb not null default '[]',
  price numeric not null,
  price_label text not null,
  handover text not null,              -- "Q3 2028"
  roi text not null default '',
  hero text not null,
  gallery jsonb not null default '[]',
  description text not null default '',
  unit_types jsonb not null default '[]',      -- [{type, size, price}]
  payment_plans jsonb not null default '[]',    -- [{label, segments:[{name,pct}], note}]
  amenities jsonb not null default '[]',
  location_highlights jsonb not null default '[]',  -- [{label, time}]
  developer_blurb text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===== Row Level Security =====
alter table listings enable row level security;
alter table offplan_projects enable row level security;

-- Anyone (including logged-out site visitors) can read
create policy "Public can view listings" on listings for select using (true);
create policy "Public can view offplan projects" on offplan_projects for select using (true);

-- Only logged-in admin users can add/edit/delete
create policy "Authenticated can insert listings" on listings for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update listings" on listings for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete listings" on listings for delete using (auth.role() = 'authenticated');

create policy "Authenticated can insert offplan" on offplan_projects for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update offplan" on offplan_projects for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete offplan" on offplan_projects for delete using (auth.role() = 'authenticated');

-- Keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger listings_set_updated_at before update on listings
  for each row execute function set_updated_at();
create trigger offplan_set_updated_at before update on offplan_projects
  for each row execute function set_updated_at();

-- ===== SERVICES (Services page + homepage service cards) =====
create table if not exists services (
  id text primary key,                 -- slug, e.g. "buying" -> services.html#buying
  icon text not null default 'home',   -- key into window.ICON_LIBRARY (assets/icon-library.js)
  title text not null,                 -- "Buying"
  card_summary text not null,          -- short description on the homepage grid card
  page_heading text not null,          -- large heading on the full services.html section
  page_description text not null,      -- paragraph on the full services.html section
  checklist jsonb not null default '[]',  -- ["What's included" bullet points]
  cta_label text not null,             -- "Start Buying"
  cta_href text not null,              -- "listings.html", "offplan-listings.html", "index.html#contact"...
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table services enable row level security;

create policy "Public can view services" on services for select using (true);
create policy "Authenticated can insert services" on services for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update services" on services for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete services" on services for delete using (auth.role() = 'authenticated');

create trigger services_set_updated_at before update on services
  for each row execute function set_updated_at();

-- ===== CONTACT PAGE TEXT (single row of editable headings/paragraphs) =====
create table if not exists contact_page_content (
  id text primary key default 'main',
  hero_eyebrow text not null default '',
  hero_heading text not null default '',
  hero_subtitle text not null default '',
  intro_eyebrow text not null default '',
  intro_heading text not null default '',
  intro_paragraph_1 text not null default '',
  intro_paragraph_2 text not null default '',
  network_eyebrow text not null default '',
  network_heading text not null default '',
  network_subtitle text not null default '',
  form_eyebrow text not null default '',
  form_heading text not null default '',
  form_subtitle text not null default '',
  faq_eyebrow text not null default '',
  faq_heading text not null default '',
  updated_at timestamptz not null default now()
);

alter table contact_page_content enable row level security;
create policy "Public can view contact page content" on contact_page_content for select using (true);
create policy "Authenticated can update contact page content" on contact_page_content for update using (auth.role() = 'authenticated');
create policy "Authenticated can insert contact page content" on contact_page_content for insert with check (auth.role() = 'authenticated');
create trigger contact_content_set_updated_at before update on contact_page_content
  for each row execute function set_updated_at();

-- ===== OFFICES (contact page office cards + world map pins) =====
create table if not exists offices (
  id text primary key,                 -- slug, e.g. "dubai-hq"
  badge_label text not null,           -- "Main Office", "UK Office"...
  title text not null,                 -- "Dubai Headquarters"
  address text not null default '',
  phone text,                          -- optional, digits only e.g. 97144456705
  phone_display text,                  -- optional, e.g. "+971 4 445 6705"
  email text,
  by_appointment_note text,            -- optional, shown instead of phone if no phone
  map_label text not null default '',  -- text shown on the world map next to the pin
  latitude numeric,                    -- optional; if set (with longitude), shows a pin on the map
  longitude numeric,
  is_hub boolean not null default false,  -- the "Dubai" style central hub office
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table offices enable row level security;
create policy "Public can view offices" on offices for select using (true);
create policy "Authenticated can insert offices" on offices for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update offices" on offices for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete offices" on offices for delete using (auth.role() = 'authenticated');
create trigger offices_set_updated_at before update on offices
  for each row execute function set_updated_at();

-- ===== FAQS (contact page FAQ accordion) =====
create table if not exists faqs (
  id text primary key,                 -- slug, e.g. "main-office-location"
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table faqs enable row level security;
create policy "Public can view faqs" on faqs for select using (true);
create policy "Authenticated can insert faqs" on faqs for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update faqs" on faqs for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete faqs" on faqs for delete using (auth.role() = 'authenticated');
create trigger faqs_set_updated_at before update on faqs
  for each row execute function set_updated_at();

-- ===== AGENTS (team directory + individual profile pages) =====
create table if not exists agents (
  id text primary key,                 -- slug, e.g. "syed-hussain" -> agent-detail.html?id=syed-hussain
  name text not null,
  title text not null default 'Property Consultant',
  photo_url text,                      -- optional; falls back to initials avatar if empty
  phone text not null,                 -- digits only, e.g. 971585210926
  phone_display text not null,         -- e.g. "+971 58 521 0926"
  email text not null,
  languages jsonb not null default '[]',   -- ["English", "Urdu"]
  specialties jsonb not null default '[]', -- ["Dubai Marina", "Palm Jumeirah"]
  bio text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table agents enable row level security;
create policy "Public can view agents" on agents for select using (true);
create policy "Authenticated can insert agents" on agents for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update agents" on agents for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete agents" on agents for delete using (auth.role() = 'authenticated');
create trigger agents_set_updated_at before update on agents
  for each row execute function set_updated_at();

-- ===== CAREERS PAGE TEXT (single row, mirrors contact_page_content) =====
create table if not exists careers_page_content (
  id text primary key default 'main',
  hero_eyebrow text not null default '',
  hero_heading text not null default '',
  hero_subtitle text not null default '',
  why_join_eyebrow text not null default '',
  why_join_heading text not null default '',
  why_join_intro text not null default '',
  value_props jsonb not null default '[]',   -- [{icon, title, description}]
  values_eyebrow text not null default '',
  values_heading text not null default '',
  core_values jsonb not null default '[]',   -- [{title, tagline}]
  jobs_eyebrow text not null default '',
  jobs_heading text not null default '',
  jobs_subtitle text not null default '',
  cv_eyebrow text not null default '',
  cv_heading text not null default '',
  cv_subtitle text not null default '',
  cv_email text not null default 'info@homespartner.ae',
  faq_eyebrow text not null default '',
  faq_heading text not null default '',
  faqs jsonb not null default '[]',          -- [{question, answer}]
  updated_at timestamptz not null default now()
);

alter table careers_page_content enable row level security;
create policy "Public can view careers page content" on careers_page_content for select using (true);
create policy "Authenticated can update careers page content" on careers_page_content for update using (auth.role() = 'authenticated');
create policy "Authenticated can insert careers page content" on careers_page_content for insert with check (auth.role() = 'authenticated');
create trigger careers_content_set_updated_at before update on careers_page_content
  for each row execute function set_updated_at();

-- ===== JOB LISTINGS (careers page open positions) =====
create table if not exists job_listings (
  id text primary key,                 -- slug, e.g. "property-consultant-dubai"
  title text not null,
  location text not null default 'Dubai, UAE',
  department text,                     -- optional, e.g. "Sales", "Off-Plan"
  job_type text not null default 'Full-time',  -- "Full-time", "Onsite", "Remote"...
  experience_level text,               -- optional, e.g. "Entry level", "Senior"
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table job_listings enable row level security;
create policy "Public can view job listings" on job_listings for select using (true);
create policy "Authenticated can insert job listings" on job_listings for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update job listings" on job_listings for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete job listings" on job_listings for delete using (auth.role() = 'authenticated');
create trigger job_listings_set_updated_at before update on job_listings
  for each row execute function set_updated_at();

-- ===== SITE SETTINGS (site-wide theme: color palette + font pairing) =====
create table if not exists site_settings (
  id text primary key default 'main',
  color_palette text not null default 'navy-gold',     -- key into assets/theme-presets.js PALETTES
  font_pairing text not null default 'fraunces-manrope', -- key into assets/theme-presets.js FONT_PAIRINGS
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;
create policy "Public can view site settings" on site_settings for select using (true);
create policy "Authenticated can update site settings" on site_settings for update using (auth.role() = 'authenticated');
create policy "Authenticated can insert site settings" on site_settings for insert with check (auth.role() = 'authenticated');
create trigger site_settings_set_updated_at before update on site_settings
  for each row execute function set_updated_at();

-- ===== HOMEPAGE CONTENT (single row covering every text section on index.html) =====
create table if not exists homepage_content (
  id text primary key default 'main',
  hero_badge_text text not null default '',
  hero_heading text not null default '',
  hero_subtitle text not null default '',
  stats jsonb not null default '[]',            -- [{number, suffix, label}] x4
  quick_actions jsonb not null default '[]',     -- [{icon, title, description, href}] x4
  services_eyebrow text not null default '',
  services_heading text not null default '',
  services_subtitle text not null default '',
  listings_eyebrow text not null default '',
  listings_heading text not null default '',
  listings_subtitle text not null default '',
  offplan_eyebrow text not null default '',
  offplan_heading text not null default '',
  offplan_subtitle text not null default '',
  offplan_features jsonb not null default '[]', -- [{title, description}] x3
  offices_eyebrow text not null default '',
  offices_heading text not null default '',
  offices_subtitle text not null default '',
  youtube_eyebrow text not null default '',
  youtube_heading text not null default '',
  youtube_subtitle text not null default '',
  whyus_eyebrow text not null default '',
  whyus_heading text not null default '',
  whyus_subtitle text not null default '',
  whyus_items jsonb not null default '[]',      -- [{title, description}] x4
  cta_heading text not null default '',
  cta_subtitle text not null default '',
  footer_blurb text not null default '',
  updated_at timestamptz not null default now()
);

alter table homepage_content enable row level security;
create policy "Public can view homepage content" on homepage_content for select using (true);
create policy "Authenticated can update homepage content" on homepage_content for update using (auth.role() = 'authenticated');
create policy "Authenticated can insert homepage content" on homepage_content for insert with check (auth.role() = 'authenticated');
create trigger homepage_content_set_updated_at before update on homepage_content
  for each row execute function set_updated_at();

-- ===== TYPOGRAPHY: per-role font + color, on top of the color palette =====
alter table site_settings add column if not exists heading_font text not null default 'Fraunces';
alter table site_settings add column if not exists heading_color text not null default '#1F275C';
alter table site_settings add column if not exists body_font text not null default 'Manrope';
alter table site_settings add column if not exists body_color text not null default '#1B1D28';
alter table site_settings add column if not exists data_font text not null default 'IBM Plex Mono';
alter table site_settings add column if not exists data_color text not null default '#1F275C';
alter table site_settings add column if not exists card_font text not null default 'Manrope';
alter table site_settings add column if not exists card_color text not null default '#1F275C';
alter table site_settings add column if not exists blog_font text not null default 'Manrope';
alter table site_settings add column if not exists blog_color text not null default '#1F275C';
alter table site_settings add column if not exists form_font text not null default 'Manrope';
alter table site_settings add column if not exists form_color text not null default '#1F275C';

-- ===== CONTACT PAGE: general WhatsApp/phone/email used site-wide =====
alter table contact_page_content add column if not exists whatsapp_number text not null default '971500000000';
alter table contact_page_content add column if not exists general_phone text not null default '';
alter table contact_page_content add column if not exists general_email text not null default 'info@homespartner.ae';

-- ===== HOMEPAGE HERO: background media + search filters =====
alter table homepage_content add column if not exists hero_bg_type text not null default 'image';
alter table homepage_content add column if not exists hero_bg_image text not null default 'assets/photos/hero-dubai-marina.jpg';
alter table homepage_content add column if not exists hero_bg_video_id text not null default '';
alter table homepage_content add column if not exists hero_search_placeholder text not null default 'Dubai Marina, Palm Jumeirah, Downtown…';
alter table homepage_content add column if not exists hero_filters jsonb not null default '[]';
alter table homepage_content add column if not exists hero_overlay_color text not null default '#1F275C';
alter table homepage_content add column if not exists hero_overlay_opacity int not null default 80;

-- ===== SITE CHROME (header nav + footer, shared across every page) =====
create table if not exists site_chrome (
  id text primary key default 'main',
  nav_links jsonb not null default '[]',        -- [{label, href}] Services/Listings/Off-Plan/Offices
  whyus_label text not null default 'Why Us',
  whyus_href text not null default 'index.html#why',
  whyus_submenu jsonb not null default '[]',     -- [{label, href}] Agents/Careers
  contact_label text not null default 'Contact',
  contact_href text not null default 'contact.html',
  cta_text text not null default 'Get in Touch',
  cta_href text not null default 'index.html#contact',
  footer_blurb text not null default '',
  footer_email text not null default '',
  footer_columns jsonb not null default '[]',    -- [{heading, links:[{label, href}]}]
  footer_copyright text not null default '',
  updated_at timestamptz not null default now()
);

alter table site_chrome enable row level security;
create policy "Public can view site chrome" on site_chrome for select using (true);
create policy "Authenticated can update site chrome" on site_chrome for update using (auth.role() = 'authenticated');
create policy "Authenticated can insert site chrome" on site_chrome for insert with check (auth.role() = 'authenticated');
create trigger site_chrome_set_updated_at before update on site_chrome
  for each row execute function set_updated_at();

-- ============================================================
-- USER ROLES (super_admin / admin / agent) -- run after everything above
-- ============================================================
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'agent' check (role in ('super_admin', 'admin', 'agent')),
  agent_id text references agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_profiles enable row level security;

-- security definer so RLS on user_profiles itself doesn't recurse when
-- other policies call this to check "what role is the current user".
create or replace function current_user_role() returns text
language sql security definer stable
set search_path = public
as $$
  select role from user_profiles where id = auth.uid();
$$;

-- the agent's own listing email, so listing RLS can check "is this my row".
create or replace function current_agent_email() returns text
language sql security definer stable
set search_path = public
as $$
  select a.email from user_profiles up
  join agents a on a.id = up.agent_id
  where up.id = auth.uid();
$$;

create policy "Users can view own profile" on user_profiles for select
  using (id = auth.uid() or current_user_role() in ('admin', 'super_admin'));

-- The "not exists" clause only ever matters once, for the very first row:
-- it lets the first logged-in user create their own super_admin profile
-- (nobody else has a role yet to authorize it). Every insert after that
-- requires an existing admin/super_admin.
create policy "Admins can insert profiles" on user_profiles for insert
  with check (
    current_user_role() in ('admin', 'super_admin')
    or not exists (select 1 from user_profiles)
  );

create policy "Admins can update profiles" on user_profiles for update
  using (current_user_role() = 'super_admin' or (current_user_role() = 'admin' and role <> 'super_admin'))
  with check (current_user_role() = 'super_admin' or (current_user_role() = 'admin' and role <> 'super_admin'));

create policy "Admins can delete profiles" on user_profiles for delete
  using (current_user_role() = 'super_admin' or (current_user_role() = 'admin' and role <> 'super_admin'));

create trigger user_profiles_set_updated_at before update on user_profiles
  for each row execute function set_updated_at();

-- ===== Re-scope every existing table's write access to admin/super_admin
-- (previously any logged-in user could write anywhere). Listings gets an
-- extra carve-out so an agent can update only their own rows. =====

drop policy if exists "Authenticated can insert listings" on listings;
drop policy if exists "Authenticated can update listings" on listings;
drop policy if exists "Authenticated can delete listings" on listings;
create policy "Admins can insert listings" on listings for insert
  with check (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can delete listings" on listings for delete
  using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins and own agent can update listings" on listings for update
  using (current_user_role() in ('admin', 'super_admin') or (current_user_role() = 'agent' and agent_email = current_agent_email()))
  with check (current_user_role() in ('admin', 'super_admin') or (current_user_role() = 'agent' and agent_email = current_agent_email()));

drop policy if exists "Authenticated can insert offplan" on offplan_projects;
drop policy if exists "Authenticated can update offplan" on offplan_projects;
drop policy if exists "Authenticated can delete offplan" on offplan_projects;
create policy "Admins can insert offplan" on offplan_projects for insert with check (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update offplan" on offplan_projects for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can delete offplan" on offplan_projects for delete using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can insert services" on services;
drop policy if exists "Authenticated can update services" on services;
drop policy if exists "Authenticated can delete services" on services;
create policy "Admins can insert services" on services for insert with check (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update services" on services for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can delete services" on services for delete using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can update contact page content" on contact_page_content;
drop policy if exists "Authenticated can insert contact page content" on contact_page_content;
create policy "Admins can update contact page content" on contact_page_content for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can insert contact page content" on contact_page_content for insert with check (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can insert offices" on offices;
drop policy if exists "Authenticated can update offices" on offices;
drop policy if exists "Authenticated can delete offices" on offices;
create policy "Admins can insert offices" on offices for insert with check (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update offices" on offices for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can delete offices" on offices for delete using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can insert faqs" on faqs;
drop policy if exists "Authenticated can update faqs" on faqs;
drop policy if exists "Authenticated can delete faqs" on faqs;
create policy "Admins can insert faqs" on faqs for insert with check (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update faqs" on faqs for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can delete faqs" on faqs for delete using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can insert agents" on agents;
drop policy if exists "Authenticated can update agents" on agents;
drop policy if exists "Authenticated can delete agents" on agents;
create policy "Admins can insert agents" on agents for insert with check (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update agents" on agents for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can delete agents" on agents for delete using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can update careers page content" on careers_page_content;
drop policy if exists "Authenticated can insert careers page content" on careers_page_content;
create policy "Admins can update careers page content" on careers_page_content for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can insert careers page content" on careers_page_content for insert with check (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can insert job listings" on job_listings;
drop policy if exists "Authenticated can update job listings" on job_listings;
drop policy if exists "Authenticated can delete job listings" on job_listings;
create policy "Admins can insert job listings" on job_listings for insert with check (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update job listings" on job_listings for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can delete job listings" on job_listings for delete using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can update site settings" on site_settings;
drop policy if exists "Authenticated can insert site settings" on site_settings;
create policy "Admins can update site settings" on site_settings for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can insert site settings" on site_settings for insert with check (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can update homepage content" on homepage_content;
drop policy if exists "Authenticated can insert homepage content" on homepage_content;
create policy "Admins can update homepage content" on homepage_content for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can insert homepage content" on homepage_content for insert with check (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Authenticated can update site chrome" on site_chrome;
drop policy if exists "Authenticated can insert site chrome" on site_chrome;
create policy "Admins can update site chrome" on site_chrome for update using (current_user_role() in ('admin', 'super_admin'));
create policy "Admins can insert site chrome" on site_chrome for insert with check (current_user_role() in ('admin', 'super_admin'));

-- ============================================================
-- PAGE HEADER BACKGROUNDS
-- One row per secondary page — the banner behind each page's title
-- (e.g. "All Listings", "Buy Off-Plan Property in Dubai") can be left
-- on the built-in navy gradient ('default'), or set to a flat color,
-- an uploaded image, or a YouTube video.
-- ============================================================
create table if not exists page_headers (
  page_id text primary key,
  bg_type text not null default 'default',
  bg_color text not null default '#1F275C',
  bg_image text,
  bg_video_id text,
  overlay_color text not null default '#1F275C',
  overlay_opacity int not null default 70,
  banner_image text,
  banner_link text,
  banner_height int not null default 400,
  banner_height_mobile int not null default 250
);

alter table page_headers add column if not exists overlay_color text not null default '#1F275C';
alter table page_headers add column if not exists overlay_opacity int not null default 70;
alter table page_headers add column if not exists banner_image text;
alter table page_headers add column if not exists banner_link text;
alter table page_headers add column if not exists banner_height int not null default 400;
alter table page_headers add column if not exists banner_height_mobile int not null default 250;

insert into page_headers (page_id) values
  ('listings'), ('offplan'), ('services'), ('agents'), ('careers'), ('contact')
on conflict (page_id) do nothing;

alter table page_headers enable row level security;

drop policy if exists "Public can view page headers" on page_headers;
create policy "Public can view page headers" on page_headers for select using (true);

drop policy if exists "Admins can update page headers" on page_headers;
create policy "Admins can update page headers" on page_headers for update using (current_user_role() in ('admin', 'super_admin'));
drop policy if exists "Admins can insert page headers" on page_headers;
create policy "Admins can insert page headers" on page_headers for insert with check (current_user_role() in ('admin', 'super_admin'));

-- ============================================================
-- CUSTOM PAGES (admin-built pages: neighborhood guides, blog
-- posts, campaign landing pages). Each page is a title + an
-- ordered JSON array of content blocks (heading, text, image,
-- gallery, video, button, feature grid, image/text split, etc.),
-- rendered by assets/page-blocks-render.js on custom-page.html.
-- ============================================================
create table if not exists custom_pages (
  slug text primary key,
  title text not null,
  seo_description text not null default '',
  status text not null default 'draft', -- 'draft' | 'published'
  layout jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table custom_pages enable row level security;

drop policy if exists "Public can view published custom pages" on custom_pages;
create policy "Public can view published custom pages" on custom_pages for select
  using (status = 'published' or current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can insert custom pages" on custom_pages;
create policy "Admins can insert custom pages" on custom_pages for insert
  with check (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can update custom pages" on custom_pages;
create policy "Admins can update custom pages" on custom_pages for update
  using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can delete custom pages" on custom_pages;
create policy "Admins can delete custom pages" on custom_pages for delete
  using (current_user_role() in ('admin', 'super_admin'));

drop trigger if exists custom_pages_set_updated_at on custom_pages;
create trigger custom_pages_set_updated_at before update on custom_pages
  for each row execute function set_updated_at();

-- ============================================================
-- LEGAL / COMPLIANCE (Dubai RERA advertising requirements)
-- Site-wide broker/license details shown in the footer, plus a
-- per-listing Trakheesi/DLD advertising permit number.
-- ============================================================
alter table site_chrome add column if not exists rera_broker_number text not null default '';
alter table site_chrome add column if not exists trade_license_number text not null default '';
alter table site_chrome add column if not exists registered_office_address text not null default '';

alter table listings add column if not exists permit_number text not null default '';
alter table offplan_projects add column if not exists permit_number text not null default '';

-- ============================================================
-- LISTING MAP COORDINATES (optional per-listing override)
-- If left blank, the search-results map falls back to the listing's
-- community center via assets/dubai-community-coords.js.
-- ============================================================
alter table listings add column if not exists latitude numeric;
alter table listings add column if not exists longitude numeric;

-- ============================================================
-- LEADS (property enquiries + valuation requests)
-- One table, discriminated by lead_type, so admin has a single place
-- to work every inbound lead rather than forms disappearing into
-- nothing (the "Request a Viewing" form previously didn't save
-- anywhere at all — this fixes that) or being scattered across tables.
-- ============================================================
create table if not exists leads (
  id bigint generated always as identity primary key,
  lead_type text not null default 'enquiry', -- enquiry | valuation
  name text not null,
  phone text not null default '',
  email text not null default '',
  message text not null default '',
  listing_id text,                     -- set for property enquiries
  listing_title text not null default '',
  address text not null default '',    -- set for valuation requests
  property_type text not null default '',
  bedrooms text not null default '',
  size_sqft text not null default '',
  status text not null default 'new',  -- new | contacted | closed
  created_at timestamptz not null default now()
);

alter table leads enable row level security;

drop policy if exists "Anyone can submit a lead" on leads;
create policy "Anyone can submit a lead" on leads for insert with check (true);

drop policy if exists "Admins can view leads" on leads;
create policy "Admins can view leads" on leads for select using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can update leads" on leads;
create policy "Admins can update leads" on leads for update using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can delete leads" on leads;
create policy "Admins can delete leads" on leads for delete using (current_user_role() in ('admin', 'super_admin'));

-- Point the "Sell" service's CTA at the new dedicated valuation form
-- instead of the generic contact section (also used by the homepage
-- services strip, so this needs the full path, not a bare anchor).
update services set cta_href = 'services.html#valuation' where id = 'sell';

-- ============================================================
-- SAVED SEARCHES (email alert requests from the listings search page)
-- Reuses the leads table (lead_type = 'saved_search') so admin has one
-- place to see every inbound request. No automated "new listing"
-- emails go out yet — that needs an email-sending service (Resend,
-- SendGrid, etc.) wired up separately; for now these land as leads
-- for the team to action manually.
-- ============================================================
alter table leads alter column name set default '';
alter table leads add column if not exists search_criteria jsonb;

-- ============================================================
-- TESTIMONIALS (client reviews shown on the homepage and agent pages)
-- Admin-managed since we don't have Google Places API credentials to
-- pull live Google Reviews. "source" records where a review actually
-- came from (e.g. copied in from Google) for honesty/attribution.
-- ============================================================
create table if not exists testimonials (
  id bigint generated always as identity primary key,
  author_name text not null,
  author_context text not null default '', -- e.g. "Buyer, Dubai Marina"
  rating int not null default 5,
  review_text text not null,
  source text not null default 'Google', -- Google | Direct | ...
  agent_id text references agents(id) on delete set null,
  featured boolean not null default false, -- show on homepage
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;

drop policy if exists "Public can view testimonials" on testimonials;
create policy "Public can view testimonials" on testimonials for select using (true);

drop policy if exists "Admins can insert testimonials" on testimonials;
create policy "Admins can insert testimonials" on testimonials for insert
  with check (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can update testimonials" on testimonials;
create policy "Admins can update testimonials" on testimonials for update
  using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can delete testimonials" on testimonials;
create policy "Admins can delete testimonials" on testimonials for delete
  using (current_user_role() in ('admin', 'super_admin'));

-- ============================================================
-- NEWSLETTER SUBSCRIBERS (footer signup)
-- No automated sending sequence is wired up yet - that needs an
-- email-sending service (Resend, Mailchimp, etc.) - so this table is
-- just a reliable capture point for the team to export/import into
-- whatever email tool gets connected later.
-- ============================================================
create table if not exists newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

drop policy if exists "Anyone can subscribe" on newsletter_subscribers;
create policy "Anyone can subscribe" on newsletter_subscribers for insert with check (true);

drop policy if exists "Admins can view subscribers" on newsletter_subscribers;
create policy "Admins can view subscribers" on newsletter_subscribers for select
  using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can delete subscribers" on newsletter_subscribers;
create policy "Admins can delete subscribers" on newsletter_subscribers for delete
  using (current_user_role() in ('admin', 'super_admin'));

-- ============================================================
-- POPUP BANNERS (promotional image popups, site-wide or per-page)
-- ============================================================
create table if not exists popup_banners (
  id bigint generated always as identity primary key,
  title text not null default '',
  image_url text not null default '',
  image_alt text not null default '',
  link_url text not null default '',
  width int not null default 480,
  height int not null default 600,
  target_scope text not null default 'all',      -- 'all' | 'specific'
  target_pages jsonb not null default '[]',       -- e.g. ['index.html','listings.html']
  auto_dismiss_seconds int not null default 0,    -- 0 = stays until closed manually
  reshow_after_seconds int not null default 0,    -- how long after closing before it's eligible again; 0 = every visit
  next_popup_delay_seconds int not null default 0, -- wait after this one closes before the next queued popup appears
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table popup_banners add column if not exists reshow_after_seconds int not null default 0;
alter table popup_banners add column if not exists next_popup_delay_seconds int not null default 0;

alter table popup_banners enable row level security;

drop policy if exists "Public can view active popup banners" on popup_banners;
create policy "Public can view active popup banners" on popup_banners for select
  using (active = true or current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can insert popup banners" on popup_banners;
create policy "Admins can insert popup banners" on popup_banners for insert
  with check (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can update popup banners" on popup_banners;
create policy "Admins can update popup banners" on popup_banners for update
  using (current_user_role() in ('admin', 'super_admin'));

drop policy if exists "Admins can delete popup banners" on popup_banners;
create policy "Admins can delete popup banners" on popup_banners for delete
  using (current_user_role() in ('admin', 'super_admin'));

drop trigger if exists popup_banners_set_updated_at on popup_banners;
create trigger popup_banners_set_updated_at before update on popup_banners
  for each row execute function set_updated_at();

-- ============================================================
-- STORAGE (run after the tables above)
-- Creates a public bucket for property photos, uploadable only
-- by logged-in admins, viewable by everyone.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

create policy "Public can view property photos" on storage.objects
  for select using (bucket_id = 'property-photos');
create policy "Authenticated can upload property photos" on storage.objects
  for insert with check (bucket_id = 'property-photos' and auth.role() = 'authenticated');
create policy "Authenticated can delete property photos" on storage.objects
  for delete using (bucket_id = 'property-photos' and auth.role() = 'authenticated');
