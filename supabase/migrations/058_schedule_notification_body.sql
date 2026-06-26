-- Accept pre-formatted notification body from the app (local time formatting).

drop function if exists public.insert_schedule_notifications(uuid, uuid, text, timestamptz, uuid[]);

create or replace function public.insert_schedule_notifications(
  p_organization_id uuid,
  p_event_id uuid,
  p_notification_title text,
  p_body text,
  p_user_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.user_can_write_org(p_organization_id) then
    raise exception 'Not authorized';
  end if;

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    return;
  end if;

  foreach v_user_id in array p_user_ids loop
    if v_user_id is null or v_user_id = auth.uid() then
      continue;
    end if;

    if not public.user_is_active_org_member(v_user_id, p_organization_id) then
      continue;
    end if;

    insert into public.user_notifications (
      organization_id,
      user_id,
      notification_type,
      title,
      body,
      link,
      entity_type,
      entity_id
    )
    values (
      p_organization_id,
      v_user_id,
      'schedule',
      p_notification_title,
      p_body,
      '/schedule',
      'schedule_event',
      p_event_id
    );
  end loop;
end;
$$;

revoke all on function public.insert_schedule_notifications(uuid, uuid, text, text, uuid[]) from public;
grant execute on function public.insert_schedule_notifications(uuid, uuid, text, text, uuid[]) to authenticated;
