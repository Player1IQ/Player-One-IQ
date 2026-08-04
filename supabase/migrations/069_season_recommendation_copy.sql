-- Align active season copy with Coach "recommendation" terminology.

update public.creator_seasons
set description = 'Earn XP by completing Creator Coach recommendations and hitting your goals. Unlock tier rewards all season long.'
where slug = 'season-1-momentum';
