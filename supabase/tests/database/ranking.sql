begin;
select plan(8);

-- Isolate ranking expectations from existing local development scores; rollback restores them.
delete from public.stage_bests where puzzle_version = 1;

do $$
declare
  v_index integer;
  v_user uuid;
  v_attempt uuid;
begin
  for v_index in 1..52 loop
    v_user := ('88888888-8888-4888-8888-' || lpad(v_index::text, 12, '0'))::uuid;
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
      values (v_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'rank-' || v_index || '@example.test', '', now(), now(), now());
    insert into public.profiles (user_id, nickname) values (v_user, '玩家' || v_index);
    insert into public.attempts (user_id, puzzle_version, stage, board_mask, moves, revision,
      status, started_at, completed_at, elapsed_ms)
      values (v_user, 1, 1, 511, 2, 2, 'completed',
        '2026-09-24T00:00:00Z', '2026-09-24T00:01:00Z', 1000 + v_index)
      returning id into v_attempt;
    insert into public.stage_bests (user_id, puzzle_version, stage, attempt_id, elapsed_ms, moves, completed_at)
      values (v_user, 1, 1, v_attempt, 1000 + v_index, 2, '2026-09-24T00:01:00Z');
  end loop;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-000000000052', true);
select is(jsonb_array_length(public.get_leaderboard(1)->'entries'), 50, 'public board is capped at fifty');
select is((public.get_leaderboard(1)->'entries'->0->>'nickname')::text, '玩家1', 'fastest player appears first');
select is((public.get_leaderboard(1)->'entries'->49->>'nickname')::text, '玩家50', 'fiftieth player appears last');
select is((public.get_me()->'bests'->0->>'rank')::integer, 52, 'personal rank remains visible outside top fifty');
select is(jsonb_array_length(public.get_leaderboard(2)->'entries'), 0, 'stage boards are isolated');

reset role;
update public.profiles set nickname = '新名字' where user_id = '88888888-8888-4888-8888-000000000001';
update public.stage_bests set elapsed_ms = 1000, moves = 4
  where user_id = '88888888-8888-4888-8888-000000000001';
update public.stage_bests set elapsed_ms = 1000, moves = 2
  where user_id = '88888888-8888-4888-8888-000000000002';
set local role authenticated;
select is((public.get_leaderboard(1)->'entries'->0->>'nickname')::text, '玩家2', 'fewer moves win equal elapsed time');
select is((public.get_leaderboard(1)->'entries'->1->>'nickname')::text, '新名字', 'renamed player keeps score and ranking');

reset role;
update public.stage_bests set elapsed_ms = 1000, moves = 2, completed_at = '2026-09-23T23:59:00Z'
  where user_id = '88888888-8888-4888-8888-000000000003';
set local role authenticated;
select is((public.get_leaderboard(1)->'entries'->0->>'nickname')::text, '玩家3', 'earlier completion wins exact time and move tie');

select * from finish();
rollback;
