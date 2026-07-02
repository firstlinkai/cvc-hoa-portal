-- ============================================================================
-- Schema/table grants for Supabase API roles. RLS (migration 0001) remains
-- the actual security boundary for anon/authenticated; these grants only
-- allow PostgREST to reach the tables at all.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.profiles to authenticated, service_role;
grant select, insert, update, delete on public.documents to authenticated, service_role;

grant usage, select on sequence
  public.document_seq_notice,
  public.document_seq_announcement,
  public.document_seq_mom
to authenticated, service_role;

-- Keep future tables reachable as well.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
