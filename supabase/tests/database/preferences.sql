begin;
select plan(15);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'profile-one@example.test', '', now(), now(), now()),
  ('44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'profile-two@example.test', '', now(), now(), now());

select ok(not has_table_privilege('authenticated', 'public.profiles', 'UPDATE'), 'profile cannot be directly edited');
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select is((public.get_preferences()->>'reduceMotion')::boolean, false, 'new cloud preference defaults false');
select is((public.get_preferences()->>'revision')::integer, 0, 'new preference revision is zero');
select is((public.set_ui_preferences(true, 0)->>'revision')::integer, 1, 'save advances revision');
select is((public.get_preferences()->>'reduceMotion')::boolean, true, 'saved preference reads back');
select is((public.set_ui_preferences(true, 1)->>'revision')::integer, 1, 'same value is no-op');
select throws_ok($$select public.set_ui_preferences(false, 0)$$, 'P0001', 'preferences_conflict', 'stale device cannot overwrite preference');
select throws_ok($$select public.set_ui_preferences(null, 1)$$, 'P0001', 'preferences_invalid', 'invalid preference rejected');
select is((public.set_nickname('  月兔勇者  ')->>'nickname')::text, '月兔勇者', 'name is trimmed and stored');
select throws_ok($$select public.set_nickname('admin')$$, 'P0001', 'nickname_reserved', 'reserved names rejected');
select throws_ok($$select public.set_nickname('兔🐇')$$, 'P0001', 'nickname_invalid', 'invalid codepoint rejected');
select throws_ok($$select public.set_nickname('再改一次')$$, 'P0001', 'nickname_cooldown', 'rename cooldown enforced');
select is((public.set_nickname('月兔勇者')->>'nickname')::text, '月兔勇者', 'same nickname is no-op during cooldown');
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select throws_ok($$select public.set_nickname('月兔勇者')$$, 'P0001', 'nickname_taken', 'globally unique nickname enforced');
select ok((public.get_preferences()->>'reduceMotion')::boolean = false, 'other account cannot see modified preference');

select * from finish();
rollback;
