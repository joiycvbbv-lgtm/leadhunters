-- Licenças (keys), aparelhos, uso diário, dados na nuvem e pedidos (Pix).
-- Aplicado automaticamente no build da Vercel quando DATABASE_URL existe.

create table if not exists access_keys (
  id bigserial primary key,
  key_hash text not null unique,
  key_plain text,
  kind text not null default 'full',
  status text not null default 'ativa',
  buyer text not null default '',
  note text not null default '',
  daily_limit int not null default 30,
  max_devices int not null default 2,
  valid_days int,
  valid_minutes int,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists key_devices (
  key_id bigint not null references access_keys(id) on delete cascade,
  device_id text not null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (key_id, device_id)
);

create table if not exists search_usage (
  key_id bigint not null references access_keys(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (key_id, day)
);

create table if not exists key_data (
  key_id bigint primary key references access_keys(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  plan text not null,
  amount_cents int not null,
  buyer_name text not null default '',
  buyer_email text not null default '',
  buyer_whatsapp text not null default '',
  mp_payment_id text unique,
  qr_code text,
  qr_base64 text,
  status text not null default 'pendente',
  key_id bigint references access_keys(id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- As 50 keys já geradas (só o hash), sem validade e com limite de 30 buscas por dia.
insert into access_keys (key_hash, kind, buyer)
select h, 'full', '' from (values
  ('6fdcb04c82b0e95d3b013e2142cd6461718bbe993facce48edddfe055143d235'),
  ('92c172b682a18c4b6d618b50aaa21d47d828837fa1a8d236c9697963e470007a'),
  ('d040cc305f7d3bd658bfe3a31d8114d91f9b28173ada18997127ba20a2012acc'),
  ('b45cbb788b70ae6569b92e8df4e137bfcfcf324e341bc030154031d7c032f0a3'),
  ('5548f6070d12f71aef8160a35ed852a65c4c8d1f37a6e22bff63cb80a8da683a'),
  ('f371678218acc7e2e87c53f5e4538afb74f5c7b39192eeb42991e6ec10c3affb'),
  ('089ef6a733629a39be4b5daa6393dd76b164c46927d65acb9f11962288f64d22'),
  ('74b200b7ae23f4b224042b11c4400aa5fb6987351132e5dbe952abe6447f5b9d'),
  ('783d588d76a0ae62e619b944fc9936920092d6299c73bbc6e3a827dc0d5adab1'),
  ('528edca946cf0e86c9990fa4344a3e580ef37bf3a4763f90cf22a701738a8a36'),
  ('59a5fd578ec9ebd9487ecc1bf389c8584a4e5300c16453073cfa09bd60a5b778'),
  ('a6e3787ad67976e06aabbcf6b84f7ff3ffa674ae63d0904152e9adfa18349e0e'),
  ('79f1e360f461dbbbca8ef806c46fca30738c91e8967aecc9db7f879d6f0f8c05'),
  ('8a5541a45876f275a19992ac48f8f4a5c5951d40bf0f5e84c2ae2e3c4182c5ee'),
  ('501023e7058d0ef30ec4ff3eb4bcec3633b732bf1936164f105ebc71aeb57530'),
  ('5bc5688db57c3022845c8b37bef51a4ddc831c79f49d2a2cf0a4b77729282d9b'),
  ('78cf6ff4f3289d1909f4a6d4bddd775c1a5bfb990b136fb58a102e33dc013618'),
  ('473faf9b040551f105f7425aa283e1994dd0d0ebf19fdd607d8fe63e12acb884'),
  ('482ad5f5963d25285541b1b830ce9d03a852dc6da4814f2245e4e0d4409913ed'),
  ('8bf9b662cbb4f975bd5f86402d24f8ec8873dc202363d6901717d3d1befee956'),
  ('fa6e4cf70291c0d5e1f73cc92ba091af3a2462e1e16c71d8000e609135434977'),
  ('b8dbaa7e627f4d1bb8f6bffeecf19c21974fd4fa77a5eaf647750d035a6064e1'),
  ('6873d67f5c5e686941d620762cf951dc9c58c3c837646e7b3eca7650f787a80f'),
  ('cc882fada094cc31b3b068e26bcd57bef1cf4048171a9d27e8bb43f0bc1bf78e'),
  ('1c8f2995e1ba424f1445fb436abca5cad39bf83ddcff169aee77cd12eab39f24'),
  ('23b93d0a28d6d43078ce2795a2281cbca705245d4f74b2aa524280bf532c13e7'),
  ('99f553e516bb69c102fb86df570525b97e62bd4aeb67d808d9570f45a7596ec9'),
  ('43002e4acccabbe44dadca46017cc6eab21b7bbdab70ab3e59795c887283c804'),
  ('39b21177f99c9f8860a5c94d3674175ca0d38c66d55a7b05c7e0234813ab419e'),
  ('1a5ed0f722f40136ec8e7987cfbb0d593f93872b82681d9e2239c711e250163d'),
  ('12104e8aadb27db497c5f81dbd416a4f0c0c9d789c753fc20b30d2a32b6749e2'),
  ('60fd053fc7a095a19f8f5fa0da747f43b0f7d680d0efd1d4c90cacc5ada535f1'),
  ('9c5aad4f1d76836571f978113dacaab899180bda8e230c03e2e1aa5f4e92c85e'),
  ('7f51183c6792c2186705e456bb6e9a9486c6a5c0daf87022e73d7778cf8a6b00'),
  ('f75f5dee5f37800272f9d05ab963315ffdf5366fe924a0fb75d877c2c38c3a2f'),
  ('83495a915e152dbe07df3bd466a2d4b49bfb330b01ea0a57aa8cf70c36fb1da8'),
  ('ffe351a97b65ff55fa90b34b7cdd5795fe30dcf4c72876f034dea1d9f5314211'),
  ('74fe71dd9c0785b984c4f94d82a69600c4c9cc90e02e4f2796531e173a2ebe1c'),
  ('288e36d4dd3562da3c53ba54323d6215fcd8c0c130bb6ace44457d149e04a645'),
  ('1bf4aa007afd8238864d8da4e78bda5274aca277ad0a5a6feb4830558883a51a'),
  ('498c6a124b3b94826ea9e9987f3f9a243649eb409b890921da03b08d07ed40b3'),
  ('688244a4115f386c242d1ce24913d9dab839a7183c8206a32cc4d72ead61f865'),
  ('5b78689828530d1d90a1ff60831dc1bf9755d1051ae73ca223b2f1f14169dff9'),
  ('6249a3abd18058518aa6e6a4e888f7a7c5e7037367d88cc314fe566b7636a927'),
  ('3df21143db3c7419e278717cf111fea685f9146077d6c8aa75449cf0197e0286'),
  ('a72533bf988094599ae206b09cf312242bee298ffbec0209f034254c585a38c5'),
  ('1397ae2cf3a8e1e1fa90d4815136c8034943223abfc966f587da3cf59799fa77'),
  ('d028a6d6302a156f7f3368849c723b3d82f29be94c4792f9c43c236652dbd2ee'),
  ('a5fcaecadf1745f7ae316946511145d7c376a9bf771ccf45286468eab09dc366'),
  ('abe0019eb67d4fde6ed95bfab1949e27466da039436ff5792f07ee8e9d8854e1')
) as v(h)
on conflict (key_hash) do nothing;

-- Key de teste: 5 minutos a partir do primeiro login, 1 aparelho.
insert into access_keys (key_hash, kind, max_devices, valid_minutes, daily_limit, buyer)
values ('933f94fcde457fb5701b1761006f85cb0a4f3f454c9fe57a7b44f5e47c9d5d2c', 'test', 1, 5, 10, 'Teste')
on conflict (key_hash) do nothing;
