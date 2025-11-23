-- Create profiles table for user information
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  company_name text not null,
  main_product text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  primary key (id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to update updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();