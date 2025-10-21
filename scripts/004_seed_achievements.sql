-- Insertar logros básicos
insert into public.achievements (name, description, icon, points) values
('first_game', 'Juega tu primera partida', '🎮', 10),
('score_100', 'Alcanza 100 puntos', '💯', 25),
('score_500', 'Alcanza 500 puntos', '🔥', 50),
('score_1000', 'Alcanza 1000 puntos', '⭐', 100),
('level_5', 'Alcanza el nivel 5', '🚀', 75),
('level_10', 'Alcanza el nivel 10', '👑', 150),
('referral_master', 'Refiere a 5 amigos', '🤝', 200),
('daily_player', 'Juega 7 días consecutivos', '📅', 125)
on conflict (name) do nothing;
