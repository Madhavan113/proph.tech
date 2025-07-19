### SQL Schema

create table public.markets (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text not null,
  description text null,
  deadline timestamp with time zone not null,
  arbitrator_type text not null,
  arbitrator_email text null,
  minimum_stake numeric(14, 4) null default 10,
  creator_id uuid not null,
  status text null default 'active'::text,
  resolved boolean null default false,
  resolved_at timestamp with time zone null,
  outcome text null,
  total_pool_for numeric(14, 4) null default 0,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  total_pool_against numeric null,
  total_pool numeric null,
  constraint markets_pkey1 primary key (id),
  constraint markets_creator_id_fkey foreign KEY (creator_id) references users (id) on delete CASCADE,
  constraint markets_minimum_stake_check check ((minimum_stake > (0)::numeric)),
  constraint markets_outcome_check check (
    (
      outcome = any (array['yes'::text, 'no'::text, 'tie'::text])
    )
  ),
  constraint markets_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'pending_resolution'::text,
          'resolved'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint markets_arbitrator_type_check check (
    (
      arbitrator_type = any (
        array['creator'::text, 'friend'::text, 'ai'::text]
      )
    )
  ),
  constraint markets_title_check check (
    (
      (char_length(title) >= 3)
      and (char_length(title) <= 200)
    )
  ),
  constraint markets_description_check check (
    (
      (char_length(description) >= 10)
      and (char_length(description) <= 1000)
    )
  )
) TABLESPACE pg_default;


