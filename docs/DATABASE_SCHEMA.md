# Database Schema — SiteSafe

Postgres (Supabase). All tables have **Row Level Security** enabled. Enums and
tables are created in `supabase/migrations/0001_init.sql`; policies in
`0002_policies.sql`; seed content in `supabase/seed.sql` (generated).

## Enums
- `user_role`: `delegate` | `trainer` | `admin`
- `session_status`: `in_progress` | `completed`
- `difficulty`: `foundation` | `intermediate` | `advanced`

## Tables

### `organisations`
Training provider tenant.
| column | type | notes |
|--------|------|-------|
| id | uuid PK | `gen_random_uuid()` |
| name | text | |
| stripe_customer_id | text null | set by webhook |
| plan | text default 'free' | `free|starter|pro` |
| seats | int default 1 | entitlement (webhook) |
| created_at | timestamptz default now() | |

### `profiles`  (1:1 with `auth.users`)
| column | type | notes |
|--------|------|-------|
| id | uuid PK | references `auth.users(id)` |
| email | text | |
| full_name | text null | |
| role | user_role default 'delegate' | |
| organisation_id | uuid null | references `organisations(id)` |
| created_at | timestamptz default now() | |

### `scenarios`
| column | type | notes |
|--------|------|-------|
| id | uuid PK | |
| slug | text unique | |
| title | text | |
| sector | text | e.g. "Commercial", "Highways" |
| difficulty | difficulty | |
| summary | text | catalogue card text |
| description | text | full brief |
| image_key | text null | illustrative key |
| is_published | bool default true | |
| sort_order | int default 0 | |
| created_at | timestamptz default now() | |

### `stages`
| column | type | notes |
|--------|------|-------|
| id | uuid PK | |
| scenario_id | uuid FK → scenarios | on delete cascade |
| key | text | stable key, unique per scenario |
| title | text | |
| phase | text | CDM phase label |
| learning_outcome | text | SMSTS-style outcome |
| prompt | text | the decision the delegate faces |
| sort_order | int | stage ordering |

### `decisions`  (the options at each stage)
| column | type | notes |
|--------|------|-------|
| id | uuid PK | |
| stage_id | uuid FK → stages | on delete cascade |
| choice_text | text | what the delegate selects |
| safety_impact | text | effect on safety |
| legal_impact | text | CDM/legal/compliance effect |
| explanation | text | shown after choosing / in report |
| score_effect | int | points (can be negative) |
| risk_effect | int | change to risk index (− is good) |
| is_ideal | bool default false | the benchmark control |
| layout_effect | jsonb | `{ "add": [...], "note": "..." }` |
| sort_order | int | |

### `game_sessions`
| column | type | notes |
|--------|------|-------|
| id | uuid PK | |
| delegate_id | uuid FK → profiles | on delete cascade |
| scenario_id | uuid FK → scenarios | |
| status | session_status default 'in_progress' | |
| total_score | int default 0 | |
| max_score | int default 0 | |
| risk_index | int default 50 | final risk (lower better) |
| started_at | timestamptz default now() | |
| completed_at | timestamptz null | |

### `session_choices`
| column | type | notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK → game_sessions | on delete cascade |
| stage_id | uuid FK → stages | |
| decision_id | uuid FK → decisions | |
| score_awarded | int | |
| created_at | timestamptz default now() | |

### `cpp_drafts`  (generated Construction Phase Plan)
| column | type | notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK → game_sessions unique | |
| content | jsonb | structured CPP sections |
| generated_at | timestamptz default now() | |

## Relationships
```
organisations 1───* profiles
profiles 1───* game_sessions ───* session_choices
scenarios 1───* stages 1───* decisions
scenarios 1───* game_sessions
game_sessions 1───1 cpp_drafts
session_choices *───1 decisions
```

## RLS policy summary
| table | delegate | trainer | admin |
|-------|----------|---------|-------|
| scenarios/stages/decisions | select (published) | select | all |
| game_sessions | own rows (all) | select (same org) | select all |
| session_choices/cpp_drafts | own (via session) | select (same org) | select all |
| profiles | own row | select (same org) | all |
| organisations | own | own | all |

`is_admin()` / `same_org()` SQL helper functions back these policies.
Entitlement columns (`plan`, `seats`, `stripe_customer_id`) are writable only by
the service role (Stripe webhook).
