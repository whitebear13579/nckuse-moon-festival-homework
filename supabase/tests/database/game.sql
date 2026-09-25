begin;
select plan(15);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'game-one@example.test', '', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'game-two@example.test', '', now(), now(), now());

select ok(not has_table_privilege('authenticated', 'public.attempts', 'INSERT'), 'client cannot insert attempts');
select ok(not has_table_privilege('authenticated', 'public.stage_bests', 'UPDATE'), 'client cannot rewrite scores');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select is((public.get_me()->>'unlockedStage')::integer, 1, 'new player starts at stage one');
select throws_ok($$select public.start_attempt(3, false)$$, 'P0001', 'stage_locked', 'locked stages are refused');
select is((public.start_attempt(1, false)->>'board_mask')::integer, 334, 'same fixed stage one puzzle');
select is((public.start_attempt(1, false)->>'created')::boolean, false, 're-entering stage resumes attempt');
select is((public.apply_move((public.start_attempt(1, false)->>'id')::uuid, 0, 0,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid)->>'revision')::integer, 1, 'first move increments revision');
select is((public.apply_move((public.start_attempt(1, false)->>'id')::uuid, 0, 0,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid)->>'revision')::integer, 1, 'same request ID does not double count');
select throws_ok($$select public.apply_move((public.start_attempt(1, false)->>'id')::uuid, 1, 0,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid)$$, 'P0001', 'request_conflict', 'same ID with changed content is rejected');
select throws_ok($$select public.apply_move((public.start_attempt(1, false)->>'id')::uuid, 4, 0,
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid)$$, 'P0001', 'revision_conflict', 'stale revision is refused');
select is((public.apply_move((public.start_attempt(1, false)->>'id')::uuid, 4, 1,
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid)->>'status')::text, 'completed', 'last move completes puzzle');
select is((public.get_me()->>'unlockedStage')::integer, 2, 'verified completion unlocks next stage');
select is(jsonb_array_length(public.get_me()->'bests'), 1, 'one personal best recorded');
select ok(jsonb_array_length(public.get_leaderboard(1)->'entries') >= 1, 'public leaderboard receives score');
select throws_ok($$select public.apply_move((public.get_me()->'attempt'->>'id')::uuid, 4, 2,
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid)$$, 'P0001', 'attempt_closed', 'completed attempt cannot receive another move');

select * from finish();
rollback;
