-- Restrict anonymous RPC access to internal SECURITY DEFINER helpers.
-- get_invitation_by_token remains callable by anon for public invite pages.

revoke execute on function public.assign_default_organization_subscription() from anon, authenticated, public;
revoke execute on function public.conversation_in_user_org(uuid) from anon, public;
revoke execute on function public.count_active_org_users(uuid) from anon, public;
revoke execute on function public.ensure_conversation_participant(uuid, uuid) from anon, public;
revoke execute on function public.get_conversation_organization_id(uuid) from anon, public;
revoke execute on function public.get_conversation_participant_user_ids(uuid) from anon, public;
revoke execute on function public.get_user_team_role(uuid) from anon, public;
revoke execute on function public.handle_new_organization() from anon, authenticated, public;
revoke execute on function public.repair_direct_conversation_participants(uuid) from anon, public;
revoke execute on function public.repair_direct_conversations_for_user() from anon, public;
revoke execute on function public.touch_conversation_on_message() from anon, authenticated, public;
revoke execute on function public.user_can_access_conversation(uuid) from anon, public;
revoke execute on function public.user_can_apply_opportunities(uuid) from anon, public;
revoke execute on function public.user_can_manage_opportunities(uuid) from anon, public;
revoke execute on function public.user_can_manage_team(uuid) from anon, public;
revoke execute on function public.user_can_write_org(uuid) from anon, public;
revoke execute on function public.user_is_active_org_member(uuid, uuid) from anon, public;
revoke execute on function public.user_is_conversation_participant(uuid) from anon, public;
revoke execute on function public.user_organization_ids() from anon, public;
