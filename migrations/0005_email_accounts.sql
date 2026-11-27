create table if not exists email_accounts (
  email text primary key,
  password_hash text not null,
  key_id bigint not null unique references access_keys(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists email_auth_attempts (
  scope text primary key,
  attempts int not null default 1,
  reset_at timestamptz not null
);
