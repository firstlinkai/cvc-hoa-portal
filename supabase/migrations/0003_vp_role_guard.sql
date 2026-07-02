-- ============================================================================
-- Tighten tr_profiles_guard: the Vice President may assign a role ONLY as
-- part of approving a registration (pending_approval -> active). Bare role
-- changes on active members are reserved for sys_admin and president.
-- ============================================================================

create or replace function public.enforce_profile_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.user_role_tier;
  is_approval boolean;
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
    is_approval := OLD.status = 'pending_approval' and NEW.status = 'active';

    if NEW.status is distinct from OLD.status and not is_approval then
      raise exception 'The Vice President cannot activate or deactivate member accounts.';
    end if;
    if NEW.role is distinct from OLD.role and not is_approval then
      raise exception 'The Vice President can only assign roles while approving a registration.';
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
