-- Execute este arquivo no SQL Editor do Supabase antes de usar o aplicativo.
-- Cada política usa auth.uid(): um usuário nunca pode acessar registros de outro usuário.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14,2) not null check (amount > 0),
  category text not null check (char_length(category) between 1 and 60),
  description text check (char_length(description) <= 140),
  transaction_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  asset_class text not null check (char_length(asset_class) between 1 and 40),
  current_value numeric(14,2) not null check (current_value >= 0),
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
alter table public.investments enable row level security;

create policy "Usuários gerenciam apenas seus lançamentos" on public.transactions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Usuários gerenciam apenas seus investimentos" on public.investments
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
