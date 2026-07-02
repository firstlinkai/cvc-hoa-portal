-- ============================================================================
-- Ciudad Verde Calamba HOA Portal — Database Layer (idempotent migration)
-- Targets: Supabase PostgreSQL
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ────────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role_tier as enum
    ('sys_admin', 'president', 'vice_president', 'doc_controller', 'board_member', 'regular_member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status_tier as enum
    ('pending_approval', 'active', 'deactivated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.doc_category_tier as enum
    ('Notice', 'Announcement', 'Minutes of Meeting');
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ────────────────────────────────────────────────────────────────────────────

-- Profiles linked 1:1 to auth.users. Email is denormalized here so the
-- notification pipeline can resolve recipients without paging auth.users.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  first_name text not null,
  last_name text not null,
  phase text not null,
  block text not null,
  lot text not null,
  role public.user_role_tier not null default 'regular_member',
  status public.account_status_tier not null default 'pending_approval',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Per-category sequences powering the human-readable tracking numbers.
create sequence if not exists public.document_seq_notice start with 1;
create sequence if not exists public.document_seq_announcement start with 1;
create sequence if not exists public.document_seq_mom start with 1;

create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  tracking_number text unique not null default '',
  title text not null,
  category public.doc_category_tier not null,
  storage_url text not null,          -- object path inside the hoa-documents bucket
  file_name text not null default '',
  mime_type text not null default '',
  file_size bigint not null default 0,
  uploaded_by uuid references public.profiles(id) not null,
  is_published boolean not null default false,
  notify_members boolean not null default false,  -- broadcast opt-in captured at upload
  notified_at timestamptz,                        -- set once the broadcast has been sent
  created_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz
);

create index if not exists idx_documents_category on public.documents (category);
create index if not exists idx_documents_published on public.documents (is_published, published_at desc);
create index if not exists idx_profiles_status on public.profiles (status);
create index if not exists idx_profiles_role on public.profiles (role);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. HELPER FUNCTIONS (SECURITY DEFINER — avoid recursive RLS on profiles)
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.get_my_role()
returns public.user_role_tier
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_status()
returns public.account_status_tier
language sql stable security definer
set search_path = public
as $$
  select status from public.profiles where id = auth.uid();
$$;

grant execute on function public.get_my_role() to authenticated, anon;
grant execute on function public.get_my_status() to authenticated, anon;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────

-- 4a. Auto-generated tracking numbers: CV-NOTICE-2026-001 / CV-ANNC-… / CV-MOM-…
--     nextval() is atomic, so concurrent inserts can never collide.
create or replace function public.generate_tracking_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  seq_val int;
  prefix text;
  year_val text;
begin
  year_val := to_char(now(), 'YYYY');
  if NEW.category = 'Notice' then
    seq_val := nextval('public.document_seq_notice');
    prefix := 'CV-NOTICE-';
  elsif NEW.category = 'Announcement' then
    seq_val := nextval('public.document_seq_announcement');
    prefix := 'CV-ANNC-';
  else
    seq_val := nextval('public.document_seq_mom');
    prefix := 'CV-MOM-';
  end if;

  NEW.tracking_number := prefix || year_val || '-' || lpad(seq_val::text, 3, '0');
  return NEW;
end;
$$;

drop trigger if exists tr_documents_tracking_id on public.documents;
create trigger tr_documents_tracking_id
  before insert on public.documents
  for each row execute function public.generate_tracking_number();

-- 4b. Keep updated_at fresh on profiles.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at := timezone('utc', now());
  return NEW;
end;
$$;

drop trigger if exists tr_profiles_touch on public.profiles;
create trigger tr_profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 4c. Fine-grained role/status change rules that RLS alone cannot express.
--     * sys_admin: unrestricted.
--     * president: may not touch sys_admin or other president accounts.
--     * vice_president: may assign roles while APPROVING (pending -> active)
--       but is forbidden from any other status transition (no deactivate /
--       reactivate — "account management" is president/sys_admin only).
--     * everyone else: may never change role or status.
--     Service-role connections (auth.uid() is null) bypass — the application
--     layer authorizes those calls explicitly before using the admin client.
create or replace function public.enforce_profile_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.user_role_tier;
begin
  if actor_id is null then
    return NEW;
  end if;

  select role into actor_role from public.profiles where id = actor_id;

  if actor_role = 'sys_admin' then
    return NEW;
  end if;

  if NEW.role = 'sys_admin' and OLD.role <> 'sys_admin' then
    raise exception 'Only the System Admin can grant the sys_admin role.';
  end if;

  if actor_role = 'president' then
    if OLD.role in ('sys_admin', 'president') and OLD.id <> actor_id
       and (NEW.status is distinct from OLD.status or NEW.role is distinct from OLD.role) then
      raise exception 'The President cannot modify System Admin or other President accounts.';
    end if;
    return NEW;
  end if;

  if actor_role = 'vice_president' then
    if NEW.status is distinct from OLD.status
       and not (OLD.status = 'pending_approval' and NEW.status = 'active') then
      raise exception 'The Vice President cannot activate or deactivate member accounts.';
    end if;
    if OLD.role in ('sys_admin', 'president') and NEW.role is distinct from OLD.role then
      raise exception 'The Vice President cannot change executive roles.';
    end if;
    return NEW;
  end if;

  if NEW.role is distinct from OLD.role or NEW.status is distinct from OLD.status then
    raise exception 'You are not authorized to change roles or account statuses.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists tr_profiles_guard on public.profiles;
create trigger tr_profiles_guard
  before update on public.profiles
  for each row execute function public.enforce_profile_update_rules();

-- ────────────────────────────────────────────────────────────────────────────
-- 5. ATOMIC PUBLISH (row lock shields the publish + broadcast decision
--    against concurrent double-publish race conditions)
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.publish_document(doc_id uuid)
returns public.documents
language plpgsql
as $$
declare
  doc public.documents;
begin
  -- SECURITY INVOKER: RLS select/update policies of the caller apply.
  select * into doc from public.documents where id = doc_id for update;

  if not found then
    raise exception 'DOCUMENT_NOT_FOUND';
  end if;

  if doc.is_published then
    raise exception 'ALREADY_PUBLISHED';
  end if;

  update public.documents
     set is_published = true,
         published_at = timezone('utc', now())
   where id = doc_id
   returning * into doc;

  return doc;
end;
$$;

grant execute on function public.publish_document(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

-- Profiles: readable by any authenticated user (community directory).
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated
  using (true);

-- Profiles: a user may insert their own row at registration time only in the
-- default pending/regular state (server-side provisioning uses service role).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (
    id = auth.uid()
    and role = 'regular_member'
    and status = 'pending_approval'
  );

-- Profiles: only executive roles may update rows; the tr_profiles_guard
-- trigger enforces the finer-grained rules (VP cannot manage statuses, etc.).
drop policy if exists "profiles_update_executives" on public.profiles;
create policy "profiles_update_executives" on public.profiles
  for update to authenticated
  using (public.get_my_role() in ('sys_admin', 'president', 'vice_president'))
  with check (public.get_my_role() in ('sys_admin', 'president', 'vice_president'));

-- Documents: SELECT
--   * account must be active
--   * published docs: everyone, EXCEPT Minutes of Meeting which are hidden
--     from regular members (board-level clearance required)
--   * unpublished docs: visible to the uploader and to the approval chain
drop policy if exists "documents_select_visibility" on public.documents;
create policy "documents_select_visibility" on public.documents
  for select to authenticated
  using (
    public.get_my_status() = 'active'
    and (
      (
        is_published = true
        and (
          category in ('Notice', 'Announcement')
          or public.get_my_role() in
            ('sys_admin', 'president', 'vice_president', 'doc_controller', 'board_member')
        )
      )
      or uploaded_by = auth.uid()
      or public.get_my_role() in ('sys_admin', 'president', 'vice_president')
    )
  );

-- Documents: INSERT — content ingestion roles only, always as themselves,
-- always starting unpublished (pending_review staging state).
drop policy if exists "documents_insert_uploaders" on public.documents;
create policy "documents_insert_uploaders" on public.documents
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and public.get_my_status() = 'active'
    and public.get_my_role() in ('sys_admin', 'president', 'vice_president', 'doc_controller')
    and is_published = false
  );

-- Documents: UPDATE — publishing/reviewing is an executive action.
drop policy if exists "documents_update_executives" on public.documents;
create policy "documents_update_executives" on public.documents
  for update to authenticated
  using (
    public.get_my_status() = 'active'
    and public.get_my_role() in ('sys_admin', 'president', 'vice_president')
  )
  with check (
    public.get_my_status() = 'active'
    and public.get_my_role() in ('sys_admin', 'president', 'vice_president')
  );

-- Documents: DELETE — sys_admin only (audit trail preservation).
drop policy if exists "documents_delete_sysadmin" on public.documents;
create policy "documents_delete_sysadmin" on public.documents
  for delete to authenticated
  using (public.get_my_role() = 'sys_admin');

-- ────────────────────────────────────────────────────────────────────────────
-- 7. STORAGE — private bucket with MIME whitelist + 10MB hard cap
-- ────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hoa-documents',
  'hoa-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object paths follow "<category-slug>/<uuid>-<filename>"; the first folder
-- segment carries the clearance level ('minutes-of-meeting' = board only).
drop policy if exists "hoa_docs_insert_uploaders" on storage.objects;
create policy "hoa_docs_insert_uploaders" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'hoa-documents'
    and public.get_my_status() = 'active'
    and public.get_my_role() in ('sys_admin', 'president', 'vice_president', 'doc_controller')
  );

drop policy if exists "hoa_docs_read_clearance" on storage.objects;
create policy "hoa_docs_read_clearance" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'hoa-documents'
    and public.get_my_status() = 'active'
    and (
      (storage.foldername(name))[1] <> 'minutes-of-meeting'
      or public.get_my_role() in
        ('sys_admin', 'president', 'vice_president', 'doc_controller', 'board_member')
    )
  );

drop policy if exists "hoa_docs_delete_admins" on storage.objects;
create policy "hoa_docs_delete_admins" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'hoa-documents'
    and public.get_my_role() in ('sys_admin', 'president')
  );
