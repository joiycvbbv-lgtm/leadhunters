-- Sites are created by the app bootstrap on some deployments; define them here too
-- so deploy-time migrations can create version history before the app boots.
create table if not exists sites (
  id bigserial primary key,
  slug text not null unique,
  key_id bigint references access_keys(id) on delete cascade,
  lead_ref text not null default '',
  name text not null default '',
  data text not null,
  kind text not null default 'previa',
  indexable boolean not null default false,
  status text not null default 'ativo',
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);
create index if not exists sites_key_idx on sites (key_id);

create table if not exists site_versions (
  id bigserial primary key,
  site_id bigint not null references sites(id) on delete cascade,
  name text not null default '',
  data text not null,
  kind text not null default 'previa',
  indexable boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists site_versions_site_created_idx on site_versions (site_id, created_at desc, id desc);
