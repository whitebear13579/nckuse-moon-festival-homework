create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  nickname_updated_at timestamptz,
  reduce_motion boolean not null default false,
  preferences_revision integer not null default 0 check (preferences_revision >= 0),
  preferences_updated_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
create unique index profiles_nickname_unique on public.profiles ((lower(nickname)));

create table public.puzzles (
  puzzle_version integer not null,
  stage integer not null check (stage between 1 and 3),
  size integer not null check (size between 3 and 5),
  initial_board_mask integer not null,
  enabled boolean not null default true,
  primary key (puzzle_version, stage)
);
insert into public.puzzles (puzzle_version, stage, size, initial_board_mask) values
  (1, 1, 3, 334), (1, 2, 4, 45906), (1, 3, 5, 16510374);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  puzzle_version integer not null,
  stage integer not null,
  board_mask integer not null,
  moves integer not null default 0 check (moves between 0 and 999),
  revision integer not null default 0 check (revision >= 0),
  status text not null check (status in ('active', 'completed', 'abandoned', 'expired')),
  started_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  elapsed_ms integer,
  foreign key (puzzle_version, stage) references public.puzzles(puzzle_version, stage)
);
create unique index attempts_one_active on public.attempts (user_id, puzzle_version) where status = 'active';
create index attempts_user_recent on public.attempts (user_id, started_at desc);

create table public.move_receipts (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  request_id uuid not null,
  cell_index integer not null,
  expected_revision integer not null,
  response_snapshot jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (attempt_id, request_id)
);
create index move_receipts_recent on public.move_receipts (created_at desc);

create table public.stage_bests (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  puzzle_version integer not null,
  stage integer not null,
  attempt_id uuid not null unique references public.attempts(id),
  elapsed_ms integer not null check (elapsed_ms > 0),
  moves integer not null check (moves between 1 and 999),
  completed_at timestamptz not null,
  primary key (user_id, puzzle_version, stage)
);
create index stage_bests_rank on public.stage_bests (puzzle_version, stage, elapsed_ms, moves, completed_at, user_id);

alter table public.profiles enable row level security;
alter table public.puzzles enable row level security;
alter table public.attempts enable row level security;
alter table public.move_receipts enable row level security;
alter table public.stage_bests enable row level security;
revoke all on public.profiles, public.puzzles, public.attempts, public.move_receipts, public.stage_bests from anon, authenticated;

create or replace function public.ensure_profile() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_try integer;
begin
  if v_user is null then raise exception 'unauthorized' using errcode = 'P0001'; end if;
  if exists (select 1 from public.profiles where user_id = v_user) then return; end if;
  for v_try in 1..10 loop
    begin
      insert into public.profiles (user_id, nickname)
      values (v_user, '月兔-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
      on conflict (user_id) do nothing;
      return;
    exception when unique_violation then
      if v_try = 10 then raise exception 'nickname_unavailable' using errcode = 'P0001'; end if;
    end;
  end loop;
end;
$$;

create or replace function public.set_nickname(p_nickname text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_name text;
  v_old public.profiles%rowtype;
  v_length integer;
  v_index integer;
  v_code integer;
  v_has_letter boolean := false;
  v_now timestamptz := clock_timestamp();
begin
  if v_user is null then raise exception 'unauthorized' using errcode = 'P0001'; end if;
  perform public.ensure_profile();
  if p_nickname is null then raise exception 'nickname_invalid' using errcode = 'P0001'; end if;
  v_name := normalize(btrim(p_nickname), NFC);
  v_length := char_length(v_name);
  if v_length < 2 or v_length > 12 then raise exception 'nickname_invalid' using errcode = 'P0001'; end if;
  for v_index in 1..v_length loop
    v_code := ascii(substr(v_name, v_index, 1));
    if (v_code between 65 and 90) or (v_code between 97 and 122)
      or (v_code between 13312 and 19903) or (v_code between 19968 and 40959) then
      v_has_letter := true;
    elsif not ((v_code between 48 and 57) or v_code in (45, 95)) then
      raise exception 'nickname_invalid' using errcode = 'P0001';
    end if;
  end loop;
  if not v_has_letter then raise exception 'nickname_invalid' using errcode = 'P0001'; end if;
  if lower(v_name) in ('admin', 'system', 'official', 'support', '官方', '管理員', '客服') then
    raise exception 'nickname_reserved' using errcode = 'P0001';
  end if;
  select * into v_old from public.profiles where user_id = v_user for update;
  if v_old.nickname = v_name then
    return jsonb_build_object('nickname', v_old.nickname, 'nextChangeAt', v_old.nickname_updated_at + interval '30 seconds');
  end if;
  if v_old.nickname_updated_at is not null and v_old.nickname_updated_at + interval '30 seconds' > v_now then
    raise exception 'nickname_cooldown' using errcode = 'P0001';
  end if;
  begin
    update public.profiles set nickname = v_name, nickname_updated_at = v_now where user_id = v_user;
  exception when unique_violation then
    raise exception 'nickname_taken' using errcode = 'P0001';
  end;
  return jsonb_build_object('nickname', v_name, 'nextChangeAt', v_now + interval '30 seconds');
end;
$$;

create or replace function public.get_preferences() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = 'P0001'; end if;
  perform public.ensure_profile();
  select * into v_profile from public.profiles where user_id = auth.uid();
  return jsonb_build_object('reduceMotion', v_profile.reduce_motion, 'revision', v_profile.preferences_revision, 'updatedAt', v_profile.preferences_updated_at);
end;
$$;

create or replace function public.set_ui_preferences(p_reduce_motion boolean, p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_profile public.profiles%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = 'P0001'; end if;
  if p_reduce_motion is null or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'preferences_invalid' using errcode = 'P0001';
  end if;
  perform public.ensure_profile();
  select * into v_profile from public.profiles where user_id = auth.uid() for update;
  if v_profile.preferences_revision <> p_expected_revision then
    raise exception 'preferences_conflict' using errcode = 'P0001';
  end if;
  if v_profile.reduce_motion <> p_reduce_motion then
    update public.profiles set reduce_motion = p_reduce_motion,
      preferences_revision = preferences_revision + 1, preferences_updated_at = v_now
      where user_id = auth.uid()
      returning * into v_profile;
  end if;
  return jsonb_build_object('reduceMotion', v_profile.reduce_motion, 'revision', v_profile.preferences_revision, 'updatedAt', v_profile.preferences_updated_at);
end;
$$;

create or replace function public.start_attempt(p_stage integer, p_restart boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_puzzle public.puzzles%rowtype;
  v_attempt public.attempts%rowtype;
  v_unlocked integer;
  v_now timestamptz;
begin
  if v_user is null then raise exception 'unauthorized' using errcode = 'P0001'; end if;
  if p_stage not in (1, 2, 3) then raise exception 'stage_invalid' using errcode = 'P0001'; end if;
  perform public.ensure_profile();
  perform 1 from public.profiles where user_id = v_user for update;
  v_now := clock_timestamp();
  select * into v_puzzle from public.puzzles where puzzle_version = 1 and stage = p_stage and enabled;
  if not found then raise exception 'stage_missing' using errcode = 'P0001'; end if;
  select coalesce(max(stage), 0) + 1 into v_unlocked from public.stage_bests where user_id = v_user and puzzle_version = 1;
  if p_stage > v_unlocked then raise exception 'stage_locked' using errcode = 'P0001'; end if;
  select * into v_attempt from public.attempts
    where user_id = v_user and puzzle_version = 1 and status = 'active' for update;
  if found then
    if v_attempt.started_at + interval '30 minutes' <= v_now or v_attempt.moves >= 999 then
      update public.attempts set status = 'expired' where id = v_attempt.id;
    elsif v_attempt.stage = p_stage and not p_restart then
      return to_jsonb(v_attempt) || jsonb_build_object('server_now', v_now, 'created', false);
    else
      update public.attempts set status = 'abandoned' where id = v_attempt.id;
    end if;
  end if;
  if (select count(*) from public.attempts where user_id = v_user and started_at > v_now - interval '1 minute') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.attempts (user_id, puzzle_version, stage, board_mask, status, started_at)
    values (v_user, 1, p_stage, v_puzzle.initial_board_mask, 'active', v_now)
    returning * into v_attempt;
  return to_jsonb(v_attempt) || jsonb_build_object('server_now', v_now, 'created', true);
end;
$$;

create or replace function public.restart_attempt(p_attempt_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_stage integer;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = 'P0001'; end if;
  select stage into v_stage from public.attempts where id = p_attempt_id and user_id = auth.uid();
  if not found then raise exception 'attempt_missing' using errcode = 'P0001'; end if;
  return public.start_attempt(v_stage, true);
end;
$$;

create or replace function public.apply_move(p_attempt_id uuid, p_cell_index integer, p_expected_revision integer, p_request_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_attempt public.attempts%rowtype;
  v_receipt public.move_receipts%rowtype;
  v_size integer;
  v_row integer;
  v_col integer;
  v_mask integer;
  v_now timestamptz;
  v_elapsed integer;
  v_best boolean := false;
  v_rows integer;
  v_response jsonb;
begin
  if v_user is null then raise exception 'unauthorized' using errcode = 'P0001'; end if;
  if p_attempt_id is null or p_request_id is null or p_cell_index is null or p_expected_revision is null then
    raise exception 'move_invalid' using errcode = 'P0001';
  end if;
  -- Keep the lock order identical to start_attempt: profile, then attempt.
  perform 1 from public.profiles where user_id = v_user for update;
  select * into v_attempt from public.attempts where id = p_attempt_id for update;
  if not found then raise exception 'attempt_missing' using errcode = 'P0001'; end if;
  if v_attempt.user_id <> v_user then raise exception 'forbidden' using errcode = 'P0001'; end if;
  v_now := clock_timestamp();
  select * into v_receipt from public.move_receipts where attempt_id = p_attempt_id and request_id = p_request_id;
  if found then
    if v_receipt.cell_index <> p_cell_index or v_receipt.expected_revision <> p_expected_revision then
      raise exception 'request_conflict' using errcode = 'P0001';
    end if;
    return v_receipt.response_snapshot;
  end if;
  if v_attempt.status <> 'active' then raise exception 'attempt_closed' using errcode = 'P0001'; end if;
  if v_attempt.started_at + interval '30 minutes' <= v_now or v_attempt.moves >= 999 then
    update public.attempts set status = 'expired' where id = p_attempt_id;
    return jsonb_build_object('error', 'attempt_expired');
  end if;
  if v_attempt.revision <> p_expected_revision then raise exception 'revision_conflict' using errcode = 'P0001'; end if;
  select size into v_size from public.puzzles where puzzle_version = v_attempt.puzzle_version and stage = v_attempt.stage;
  if p_cell_index < 0 or p_cell_index >= v_size * v_size then raise exception 'move_invalid' using errcode = 'P0001'; end if;
  if (select count(*) from public.move_receipts r join public.attempts a on a.id = r.attempt_id
      where a.user_id = v_user and r.created_at > v_now - interval '1 minute') >= 120 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  v_mask := v_attempt.board_mask # (1 << p_cell_index);
  v_row := p_cell_index / v_size;
  v_col := p_cell_index % v_size;
  if v_row > 0 then v_mask := v_mask # (1 << (p_cell_index - v_size)); end if;
  if v_row < v_size - 1 then v_mask := v_mask # (1 << (p_cell_index + v_size)); end if;
  if v_col > 0 then v_mask := v_mask # (1 << (p_cell_index - 1)); end if;
  if v_col < v_size - 1 then v_mask := v_mask # (1 << (p_cell_index + 1)); end if;
  v_attempt.board_mask := v_mask;
  v_attempt.moves := v_attempt.moves + 1;
  v_attempt.revision := v_attempt.revision + 1;
  if v_mask = (1 << (v_size * v_size)) - 1 then
    v_elapsed := greatest(1, floor(extract(epoch from (v_now - v_attempt.started_at)) * 1000)::integer);
    update public.attempts set board_mask = v_mask, moves = v_attempt.moves, revision = v_attempt.revision,
      status = 'completed', completed_at = v_now, elapsed_ms = v_elapsed where id = p_attempt_id;
    insert into public.stage_bests (user_id, puzzle_version, stage, attempt_id, elapsed_ms, moves, completed_at)
      values (v_user, v_attempt.puzzle_version, v_attempt.stage, p_attempt_id, v_elapsed, v_attempt.moves, v_now)
      on conflict (user_id, puzzle_version, stage) do update
      set attempt_id = excluded.attempt_id, elapsed_ms = excluded.elapsed_ms,
        moves = excluded.moves, completed_at = excluded.completed_at
      where (excluded.elapsed_ms, excluded.moves) < (stage_bests.elapsed_ms, stage_bests.moves);
    get diagnostics v_rows = row_count;
    v_best := v_rows > 0;
    v_attempt.status := 'completed';
  else
    update public.attempts set board_mask = v_mask, moves = v_attempt.moves,
      revision = v_attempt.revision where id = p_attempt_id;
    if v_attempt.moves >= 999 then
      update public.attempts set status = 'expired' where id = p_attempt_id;
      v_attempt.status := 'expired';
    end if;
  end if;
  v_response := jsonb_build_object('id', p_attempt_id, 'stage', v_attempt.stage,
    'board_mask', v_mask, 'moves', v_attempt.moves, 'revision', v_attempt.revision,
    'status', v_attempt.status, 'started_at', v_attempt.started_at,
    'server_now', v_now, 'elapsed_ms', v_elapsed, 'is_personal_best', v_best);
  insert into public.move_receipts (attempt_id, request_id, cell_index, expected_revision, response_snapshot)
    values (p_attempt_id, p_request_id, p_cell_index, p_expected_revision, v_response);
  return v_response;
end;
$$;

create or replace function public.get_me() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_attempt public.attempts%rowtype;
  v_bests jsonb;
  v_unlocked integer;
begin
  if v_user is null then raise exception 'unauthorized' using errcode = 'P0001'; end if;
  perform public.ensure_profile();
  select * into v_profile from public.profiles where user_id = v_user;
  select * into v_attempt from public.attempts where user_id = v_user and puzzle_version = 1
    and status in ('active', 'completed', 'expired')
    order by case when status = 'active' then 0 else 1 end, started_at desc limit 1;
  if v_attempt.status = 'active' and v_attempt.started_at + interval '30 minutes' <= clock_timestamp() then
    v_attempt.status := 'expired';
  end if;
  select coalesce(max(stage), 0) + 1 into v_unlocked from public.stage_bests where user_id = v_user and puzzle_version = 1;
  select coalesce(jsonb_agg(jsonb_build_object('stage', b.stage, 'elapsedMs', b.elapsed_ms,
    'moves', b.moves, 'completedAt', b.completed_at,
    'rank', 1 + (select count(*) from public.stage_bests earlier
      where earlier.puzzle_version = b.puzzle_version and earlier.stage = b.stage
        and (earlier.elapsed_ms, earlier.moves, earlier.completed_at, earlier.user_id)
          < (b.elapsed_ms, b.moves, b.completed_at, b.user_id))) order by b.stage), '[]'::jsonb)
    into v_bests from public.stage_bests b where b.user_id = v_user and b.puzzle_version = 1;
  return jsonb_build_object('nickname', v_profile.nickname,
    'nicknameNextChangeAt', v_profile.nickname_updated_at + interval '30 seconds',
    'reduceMotion', v_profile.reduce_motion, 'preferencesRevision', v_profile.preferences_revision,
    'unlockedStage', least(3, v_unlocked), 'bests', v_bests,
    'attempt', case when v_attempt.id is null then null else to_jsonb(v_attempt) end,
    'serverNow', clock_timestamp());
end;
$$;

create or replace function public.get_leaderboard(p_stage integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_entries jsonb;
begin
  if p_stage not in (1, 2, 3) then raise exception 'stage_invalid' using errcode = 'P0001'; end if;
  with top_scores as (
    select b.user_id, b.elapsed_ms, b.moves, b.completed_at
    from public.stage_bests b where b.puzzle_version = 1 and b.stage = p_stage
    order by b.elapsed_ms, b.moves, b.completed_at, b.user_id limit 50
  ), ranked as (
    select t.*, row_number() over (order by t.elapsed_ms, t.moves, t.completed_at, t.user_id) as rank
    from top_scores t
  )
  select coalesce(jsonb_agg(jsonb_build_object('rank', r.rank, 'nickname', p.nickname,
    'elapsedMs', r.elapsed_ms, 'moves', r.moves) order by r.rank), '[]'::jsonb)
    into v_entries from ranked r join public.profiles p on p.user_id = r.user_id where r.rank <= 50;
  return jsonb_build_object('stage', p_stage, 'entries', v_entries, 'updatedAt', clock_timestamp());
end;
$$;

revoke all on function public.ensure_profile(), public.set_nickname(text), public.get_preferences(),
  public.set_ui_preferences(boolean, integer), public.start_attempt(integer, boolean),
  public.restart_attempt(uuid), public.apply_move(uuid, integer, integer, uuid),
  public.get_me(), public.get_leaderboard(integer) from public, anon, authenticated;
grant execute on function public.ensure_profile(), public.set_nickname(text), public.get_preferences(),
  public.set_ui_preferences(boolean, integer), public.start_attempt(integer, boolean),
  public.restart_attempt(uuid), public.apply_move(uuid, integer, integer, uuid), public.get_me()
  to authenticated;
grant execute on function public.get_leaderboard(integer) to anon, authenticated;
