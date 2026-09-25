begin;
select plan(5);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('99999999-9999-4999-8999-999999999999', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'bests@example.test', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999999', true);
select set_config('test.first', public.start_attempt(1, false)->>'id', true);
select public.apply_move(current_setting('test.first')::uuid, 0, 0, '99999999-0000-4000-8000-000000000001');
select public.apply_move(current_setting('test.first')::uuid, 4, 1, '99999999-0000-4000-8000-000000000002');
select is(jsonb_array_length(public.get_me()->'bests'), 1, 'first completion creates one personal best');

reset role;
update public.stage_bests set elapsed_ms = 5000 where user_id = '99999999-9999-4999-8999-999999999999';
set local role authenticated;
select set_config('test.slow', public.start_attempt(1, true)->>'id', true);
reset role;
update public.attempts set started_at = clock_timestamp() - interval '10 seconds'
  where id = current_setting('test.slow')::uuid;
set local role authenticated;
select public.apply_move(current_setting('test.slow')::uuid, 0, 0, '99999999-0000-4000-8000-000000000003');
select is((public.apply_move(current_setting('test.slow')::uuid, 4, 1,
  '99999999-0000-4000-8000-000000000004')->>'is_personal_best')::boolean,
  false, 'slower replay does not replace best');
select is((public.get_me()->'bests'->0->>'elapsedMs')::integer, 5000, 'best time survives slower replay');

select set_config('test.fast', public.start_attempt(1, true)->>'id', true);
reset role;
update public.attempts set started_at = clock_timestamp() - interval '1 second'
  where id = current_setting('test.fast')::uuid;
set local role authenticated;
select public.apply_move(current_setting('test.fast')::uuid, 0, 0, '99999999-0000-4000-8000-000000000005');
select is((public.apply_move(current_setting('test.fast')::uuid, 4, 1,
  '99999999-0000-4000-8000-000000000006')->>'is_personal_best')::boolean,
  true, 'faster replay replaces best');
select ok((public.get_me()->'bests'->0->>'elapsedMs')::integer < 5000,
  'new best time is persisted');

select * from finish();
rollback;
