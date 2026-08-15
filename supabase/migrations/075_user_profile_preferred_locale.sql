-- Preferred UI locale per user (nullable; cookie/header fallback when unset).

alter table public.user_profiles
  add column if not exists preferred_locale text;

comment on column public.user_profiles.preferred_locale is
  'User-preferred UI locale code (e.g. en, es). Null falls back to NEXT_LOCALE cookie or Accept-Language.';
