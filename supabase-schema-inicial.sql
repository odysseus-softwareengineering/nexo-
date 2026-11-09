-- FINANCAS EM FAMILIA | esquema inicial com acesso familiar
-- Execute em um projeto Supabase novo. Revise antes de usar dados reais.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- access_mode: managed = responsável registra; individual = filho possui login.
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  role text not null check (role in ('guardian','child','teen')),
  access_mode text not null default 'managed' check (access_mode in ('managed','individual')),
  allowance numeric(12,2) not null default 0 check (allowance >= 0),
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  member_id uuid references public.family_members(id) on delete set null,
  title text not null,
  category text not null,
  transaction_type text not null check (transaction_type in ('income','expense')),
  amount numeric(12,2) not null check (amount > 0),
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  category text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  month date not null,
  unique (family_id, category, month)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  saved_amount numeric(12,2) not null default 0 check (saved_amount >= 0),
  created_at timestamptz not null default now()
);

-- Funções auxiliares: não recebem family_id do cliente; verificam auth.uid().
create or replace function public.is_family_guardian(target_family uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.family_members fm
  where fm.family_id = target_family and fm.user_id = auth.uid() and fm.role = 'guardian'
); $$;

create or replace function public.is_family_member(target_family uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.family_members fm
  where fm.family_id = target_family and fm.user_id = auth.uid()
); $$;

create or replace function public.is_own_family_member(target_member uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.family_members fm
  where fm.id = target_member and fm.user_id = auth.uid()
); $$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;

-- Perfil: cada usuário acessa apenas o próprio perfil.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Famílias: somente membros consultam; responsáveis administram.
drop policy if exists families_select_member on public.families;
create policy families_select_member on public.families for select to authenticated using (public.is_family_member(id));
drop policy if exists families_insert_creator on public.families;
create policy families_insert_creator on public.families for insert to authenticated with check (created_by = auth.uid());
drop policy if exists families_update_guardian on public.families;
create policy families_update_guardian on public.families for update to authenticated using (public.is_family_guardian(id)) with check (public.is_family_guardian(id));

-- Membros: família vê os perfis; apenas responsável altera configurações.
drop policy if exists members_select_family on public.family_members;
create policy members_select_family on public.family_members for select to authenticated using (public.is_family_member(family_id));
drop policy if exists members_insert_guardian on public.family_members;
create policy members_insert_guardian on public.family_members for insert to authenticated with check (public.is_family_guardian(family_id));
drop policy if exists members_update_guardian on public.family_members;
create policy members_update_guardian on public.family_members for update to authenticated using (public.is_family_guardian(family_id)) with check (public.is_family_guardian(family_id));
drop policy if exists members_delete_guardian on public.family_members;
create policy members_delete_guardian on public.family_members for delete to authenticated using (public.is_family_guardian(family_id));

-- Movimentações: responsável acessa a família; filho acessa apenas registros vinculados ao próprio member_id.
drop policy if exists transactions_select_scoped on public.transactions;
create policy transactions_select_scoped on public.transactions for select to authenticated using (
  public.is_family_guardian(family_id) or
  (public.is_own_family_member(member_id) and exists (
    select 1 from public.family_members fm where fm.id = transactions.member_id and fm.access_mode = 'individual'
  ))
);
drop policy if exists transactions_insert_scoped on public.transactions;
create policy transactions_insert_scoped on public.transactions for insert to authenticated with check (
  created_by = auth.uid() and (
    public.is_family_guardian(family_id) or
    (public.is_own_family_member(member_id) and exists (
      select 1 from public.family_members fm where fm.id = transactions.member_id and fm.family_id = transactions.family_id and fm.access_mode = 'individual'
    ))
  )
);
drop policy if exists transactions_update_scoped on public.transactions;
create policy transactions_update_scoped on public.transactions for update to authenticated using (
  public.is_family_guardian(family_id) or (public.is_own_family_member(member_id) and exists (select 1 from public.family_members fm where fm.id = transactions.member_id and fm.access_mode = 'individual'))
) with check (
  public.is_family_guardian(family_id) or (public.is_own_family_member(member_id) and exists (select 1 from public.family_members fm where fm.id = transactions.member_id and fm.family_id = transactions.family_id and fm.access_mode = 'individual'))
);
drop policy if exists transactions_delete_guardian on public.transactions;
create policy transactions_delete_guardian on public.transactions for delete to authenticated using (public.is_family_guardian(family_id));

-- Orçamentos e metas são geridos pelos responsáveis.
drop policy if exists budgets_select_family on public.budgets;
create policy budgets_select_family on public.budgets for select to authenticated using (public.is_family_member(family_id));
drop policy if exists budgets_manage_guardian on public.budgets;
create policy budgets_manage_guardian on public.budgets for all to authenticated using (public.is_family_guardian(family_id)) with check (public.is_family_guardian(family_id));
drop policy if exists goals_select_family on public.savings_goals;
create policy goals_select_family on public.savings_goals for select to authenticated using (public.is_family_member(family_id));
drop policy if exists goals_manage_guardian on public.savings_goals;
create policy goals_manage_guardian on public.savings_goals for all to authenticated using (public.is_family_guardian(family_id)) with check (public.is_family_guardian(family_id));

-- IMPORTANTE:
-- 1) Convites e vinculação de user_id devem ocorrer por função RPC/Edge Function validada.
-- 2) Não exponha a service_role key no app.
-- 3) Teste cada política com contas de responsável, criança, adolescente e outra família.
-- 4) Para menores, avalie consentimento, transparência, minimização de dados e LGPD.
