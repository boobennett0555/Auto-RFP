-- ============================================================
-- RFP Studio — Supabase Schema
-- Run this in your Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ── Company settings (one shared row) ──────────────────────
create table if not exists company_settings (
  id            integer primary key default 1,
  company       text,
  tagline       text,
  primary_color text default '#0f2744',
  accent        text default '#c49a2a',
  email         text,
  phone         text,
  website       text,
  updated_at    timestamptz default now()
);
-- Seed with one default row
insert into company_settings (id) values (1)
  on conflict (id) do nothing;

-- ── Knowledge base ─────────────────────────────────────────
create table if not exists knowledge_base (
  id          uuid primary key default uuid_generate_v4(),
  question    text not null,
  answer      text not null,
  category    text default 'Other',
  source_rfp  text,
  created_at  timestamptz default now()
);
create index if not exists kb_category_idx on knowledge_base(category);

-- ── RFP Responses ──────────────────────────────────────────
create table if not exists rfp_responses (
  id          uuid primary key default uuid_generate_v4(),
  hospital    text not null,
  title       text,
  due_date    date,
  status      text default 'draft',
  raw_rfp     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── RFP Sections ───────────────────────────────────────────
create table if not exists rfp_sections (
  id          uuid primary key default uuid_generate_v4(),
  rfp_id      uuid references rfp_responses(id) on delete cascade,
  title       text not null,
  question    text,
  category    text default 'Other',
  answer      text default '',
  images      jsonb default '[]'::jsonb,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);
create index if not exists sections_rfp_id_idx on rfp_sections(rfp_id);

-- ── Row Level Security ─────────────────────────────────────
-- All authenticated users on your team can read/write everything.
-- Since you control who gets magic links, this is team-only.

alter table company_settings  enable row level security;
alter table knowledge_base     enable row level security;
alter table rfp_responses      enable row level security;
alter table rfp_sections       enable row level security;

create policy "team_all" on company_settings  for all using (auth.role() = 'authenticated');
create policy "team_all" on knowledge_base     for all using (auth.role() = 'authenticated');
create policy "team_all" on rfp_responses      for all using (auth.role() = 'authenticated');
create policy "team_all" on rfp_sections       for all using (auth.role() = 'authenticated');

-- ── Storage bucket for images ──────────────────────────────
-- Run this separately in the Supabase Dashboard:
-- Storage > New Bucket > name: "rfp-images" > Public: ON
-- (or run via SQL below — requires storage schema)
insert into storage.buckets (id, name, public)
  values ('rfp-images', 'rfp-images', true)
  on conflict (id) do nothing;

create policy "team_upload" on storage.objects
  for insert with check (bucket_id = 'rfp-images' and auth.role() = 'authenticated');

create policy "public_read" on storage.objects
  for select using (bucket_id = 'rfp-images');

create policy "team_delete" on storage.objects
  for delete using (bucket_id = 'rfp-images' and auth.role() = 'authenticated');
