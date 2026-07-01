grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

notify pgrst, 'reload schema';