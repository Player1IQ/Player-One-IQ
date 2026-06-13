-- Map Stripe test-mode Price IDs to subscription plans

update public.subscription_plans
set
  stripe_price_id_monthly = 'price_1ThuXdHRtLHXdGBBFA4vL7i5',
  stripe_price_id_yearly = 'price_1ThuZKHRtLHXdGBBE1hjVhGy',
  updated_at = now()
where code = 'creator_pro';

update public.subscription_plans
set
  stripe_price_id_monthly = 'price_1ThuWNHRtLHXdGBBlsPAm8aD',
  stripe_price_id_yearly = 'price_1ThucaHRtLHXdGBBVozTY3Zu',
  updated_at = now()
where code = 'agency';

update public.subscription_plans
set
  stripe_price_id_monthly = 'price_1ThuaGHRtLHXdGBBKUP8b4Hj',
  stripe_price_id_yearly = 'price_1ThuamHRtLHXdGBBsuwvu8fI',
  updated_at = now()
where code = 'agency_pro';

update public.subscription_plans
set
  stripe_price_id_monthly = 'price_1ThubXHRtLHXdGBBWKYsvvt5',
  stripe_price_id_yearly = 'price_1Thuc0HRtLHXdGBBpsBSiz5I',
  updated_at = now()
where code = 'sponsor_pro';
