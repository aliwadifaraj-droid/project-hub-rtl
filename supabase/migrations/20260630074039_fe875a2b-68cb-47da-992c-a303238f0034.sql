do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'site_settings'
      and constraint_type = 'PRIMARY KEY'
  ) then
    alter table public.site_settings add constraint site_settings_pkey primary key (key);
  end if;
end $$;

alter table public.ads
  add column if not exists contact_email text;

notify pgrst, 'reload schema';