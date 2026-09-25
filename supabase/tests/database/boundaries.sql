begin;
select plan(7);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('55555555-5555-4555-8555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'boundary-one@example.test', '', now(), now(), now()),
  ('66666666-6666-4666-8666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'boundary-two@example.test', '', now(), now(), now()),
  ('77777777-7777-4777-8777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'boundary-three@example.test', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('test.attempt_id', public.start_attempt(1, false)->>'id', true);
reset role;
update public.attempts set started_at = clock_timestamp() - interval '31 minutes'
  where id = current_setting('test.attempt_id')::uuid;
set local role authenticated;
select is((public.apply_move(current_setting('test.attempt_id')::uuid, 0, 0,
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid)->>'error')::text,
  'attempt_expired', 'server rejects move after thirty minutes');
select is(jsonb_array_length(public.get_me()->'bests'), 0, 'expired attempt creates no best');
select set_config('test.attempt_id', public.start_attempt(1, false)->>'id', true);
select is((public.get_me()->'attempt'->>'status')::text, 'active', 'new attempt starts after expiry');
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
select throws_ok($$select public.apply_move(current_setting('test.attempt_id')::uuid, 0, 0,
  'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid)$$, 'P0001', 'forbidden', 'other account cannot move this attempt');
reset role;
update public.attempts set board_mask = 0, moves = 998, revision = 0
  where id = current_setting('test.attempt_id')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select is((public.apply_move(current_setting('test.attempt_id')::uuid, 0, 0,
  'abababab-abab-4bab-8bab-abababababab'::uuid)->>'status')::text,
  'expired', 'unsolved step 999 closes attempt');
select is(jsonb_array_length(public.get_me()->'bests'), 0, 'step limit creates no best');
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
do $$ begin for i in 1..10 loop perform public.start_attempt(1, true); end loop; end $$;
select throws_ok($$select public.start_attempt(1, true)$$, 'P0001', 'rate_limited', 'eleventh start within one minute is limited');

select * from finish();
rollback;
