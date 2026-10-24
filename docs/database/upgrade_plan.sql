-- Reference snapshot of public.upgrade_plan, captured 2026-10-24.
-- Documentation only: this file is not an automatic migration.
-- Committing this file does not execute it or change the database.
--
-- Prerequisite: public.accesspath_storage and its unique (user_id, key)
-- constraint must already exist. Table schema, grants, and RLS policies
-- are not reproduced by this snapshot.
--
-- Captured settings:
--   Security invoker (security_definer = false)
--   Empty search_path
--   EXECUTE granted to postgres and service_role only
--
-- The webhook verifies the Stripe purchase before calling this function.
-- This function validates and applies plan upgrades; it does not verify payment.

CREATE OR REPLACE FUNCTION public.upgrade_plan(p_user_id uuid, p_plan_id text, p_session_id text, p_purchased_at timestamp with time zone DEFAULT now())
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_new_rank     int;
  v_current_raw  text;
  v_current_json jsonb;
  v_current_plan text;
  v_current_rank int;
begin
  -- 1. Validate inputs. Only paid tiers can ever be granted.
  if p_user_id is null then
    raise exception 'upgrade_plan: missing user id' using errcode = '22023';
  end if;

  if p_plan_id = 'complete' then
    v_new_rank := 1;
  elsif p_plan_id = 'contractor' then
    v_new_rank := 2;
  else
    raise exception 'upgrade_plan: invalid plan id' using errcode = '22023';
  end if;

  if p_session_id is null or length(p_session_id) = 0 or length(p_session_id) > 255 then
    raise exception 'upgrade_plan: invalid session id' using errcode = '22023';
  end if;

  -- The default only applies when the argument is omitted; an explicit
  -- null must not slip through and be stored as "purchasedAt": null.
  if p_purchased_at is null then
    raise exception 'upgrade_plan: missing purchase time' using errcode = '22023';
  end if;

  -- 2. Make sure the plan row exists (as "free"), then lock it so
  --    simultaneous webhook deliveries are handled one at a time.
  insert into public.accesspath_storage (user_id, key, value, updated_at)
  values (p_user_id, 'accesspath:plan', '"free"', now())
  on conflict (user_id, key) do nothing;

  select value
    into v_current_raw
    from public.accesspath_storage
   where user_id = p_user_id
     and key = 'accesspath:plan'
   for update;

  -- 3. Read the current plan from either stored format:
  --    a JSON string such as "free", or a JSON object with "planId".
  --    Anything unreadable stops the function (fail closed): unknown
  --    data is never overwritten, so a higher plan can't be lost.
  begin
    v_current_json := v_current_raw::jsonb;
  exception when others then
    raise exception 'upgrade_plan: stored plan is unreadable' using errcode = '22P02';
  end;

  if jsonb_typeof(v_current_json) = 'string' then
    v_current_plan := v_current_json #>> '{}';
  elsif jsonb_typeof(v_current_json) = 'object' then
    v_current_plan := v_current_json ->> 'planId';
  end if;

  v_current_rank := case v_current_plan
    when 'free' then 0
    when 'complete' then 1
    when 'contractor' then 2
    else null
  end;

  if v_current_rank is null then
    raise exception 'upgrade_plan: stored plan is not recognized' using errcode = '22023';
  end if;

  -- 4. Only ever move up. Equal or lower purchases change nothing,
  --    so Stripe retries and duplicate events are harmless.
  if v_new_rank <= v_current_rank then
    return 'unchanged';
  end if;

  update public.accesspath_storage
     set value = jsonb_build_object(
                   'planId', p_plan_id,
                   'purchasedAt', to_char(p_purchased_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                   'sessionId', p_session_id
                 )::text,
         updated_at = now()
   where user_id = p_user_id
     and key = 'accesspath:plan';

  return 'upgraded';
end;
$function$;

-- Permission statements corresponding to the captured EXECUTE grants.
-- CREATE OR REPLACE alone does not reproduce execution permissions.
REVOKE ALL ON FUNCTION public.upgrade_plan(uuid, text, text, timestamp with time zone)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.upgrade_plan(uuid, text, text, timestamp with time zone)
  TO postgres, service_role;
