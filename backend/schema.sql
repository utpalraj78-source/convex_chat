
-- Users Table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  email text unique not null,
  password text not null,
  role text default 'user',
  avatar text default '',
  verified boolean default false,
  otp text,
  otp_expiry bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages Table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  "from" uuid references public.users(id) not null,
  "to" text not null, -- Can be a user UUID or a group ID string
  type text default 'text',
  text text,
  file_url text,
  file_name text,
  file_size bigint,
  audio text,
  duration int,
  read boolean default false,
  is_encrypted boolean default false,
  is_private boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (Optional, but good practice)
alter table public.users enable row level security;
alter table public.messages enable row level security;

-- Policies (Open for now since backend handles auth, but can be locked down)
create policy "Allow all access for backend" on public.users for all using (true);
create policy "Allow all access for backend" on public.messages for all using (true);
