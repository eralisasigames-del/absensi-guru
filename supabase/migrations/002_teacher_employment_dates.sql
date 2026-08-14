alter table public.profiles
  add column if not exists tanggal_join date,
  add column if not exists tanggal_resign date;

alter table public.profiles
  add constraint profiles_employment_dates_check
  check (tanggal_resign is null or tanggal_join is null or tanggal_resign >= tanggal_join);

create index if not exists profiles_teacher_join_idx
  on public.profiles(tanggal_join)
  where role = 'guru';

create index if not exists profiles_teacher_resign_idx
  on public.profiles(tanggal_resign)
  where role = 'guru';
