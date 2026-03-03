# Pickup Locations (Exact Map Pin) — Final Implementation Plan (Locked)

## Implementation Status (as of 2026-03-03)

### Completed
- ✅ Plan updated to locked spec
- ✅ DB migration shipped (table, indexes, trigger, RLS, grants)
- ✅ RPCs shipped:
  - `public.search_tours_by_nearest_pickup(...)`
  - `public.set_primary_pickup(p_tour_id, p_pickup_id)`
- ✅ Shared TS types added (`packages/shared/src/types/tourPickup.ts`) and exported
- ✅ Operator Create/Edit flow wired:
  - New **Pickup Locations** step inserted after **Basics**
  - Edit-load pre-fills pickups from DB
  - Gating enforced: cannot proceed without ≥1 pickup
- ✅ Operator Pickup step UI implemented:
  - Multiple pickups per tour
  - Exact map pin (click + drag)
  - Autocomplete → place select → marker set
  - Drag marker → reverse geocode → address update
  - Explicit **Save** action
  - Primary toggle (max-one enforced client-side + DB constraint)
- ✅ Traveller ranking integrated:
  - Explore homepage shows **Near You** section when available
  - Tours page offers optional sort **Nearest Pickup**
- ✅ Traveller coordinate source wired:
  - Uses **selected city** coords from dataset when available
  - Falls back to **geolocation only if already granted** (no prompt)

### Partially Completed / Deviations (Needs Follow-up)
- ⚠️ “Search page” sort:
  - Locked scope mentions Search page sort **Nearest Pickup**.
  - Current app `SearchPage` is hotel-only; the nearest-pickup sort is implemented on the tours browsing page instead.
  - Follow-up: add the sort option to the traveller tours search/browse experience where applicable (or revise scope wording to match routing).

### Remaining (to fully satisfy the plan)
- ✅ Lazy-load the operator Pickup step (route-split) so Google Maps SDK does not impact initial operator create flow bundle.
- ✅ Optional backfill script added (only if required for existing live tours).
- ✅ Post-release monitoring checklist added (RPC latency, RLS denials, Maps quota).

## Objective
Add a new mandatory step after **Basics**: **Pickup Locations (Exact Map Pin)**.

Operators must add **at least 1** pickup location before proceeding.

Travellers will see tours ranked by **distance to nearest pickup** based on the selected city.

---

## Scope (MVP)
### Operator (Create/Edit Tour)
- New step after Basics: Pickup Locations
- Must support multiple pickup points per tour
- Selection UX:
  - Google Maps pin (draggable)
  - Autocomplete search → pick address → position marker
  - Drag marker → reverse geocode → update formatted address
  - Explicit Save action (no infinite spinners)

### Traveller
- Homepage: dedicated **Near You** section using pickup-distance ranking only
- Search page: optional sort **Nearest Pickup** (default search ordering remains intent-based)
- Tours without pickups are **not excluded** by default (only excluded when user explicitly selects **Nearest Pickup** sort)

---

## Non-Goals (for first release)
- Complex geofencing, clustering, map overlays
- Radius filters beyond a default (optional future)
- Hiding exact address until after booking (possible Phase-2 privacy enhancement)

---

## Product Decisions (Confirmed)
### Traveller coordinate source
- Target: use city selection with stored coordinates in app state
- Store: `city_id`, `city_name`, `latitude`, `longitude`
- No runtime geocoding required for ranking (use a dataset with target-market coverage)

Current implementation note:
- Traveller ranking now uses **selected city** coords from a stored dataset when available.
- If no city is selected (or no dataset match), it falls back to **geolocation only if permission is already granted** (no permission prompt).

### Where distance ranking applies
- Homepage: dedicated **Near You** section using pickup-distance ranking only
- Search: optional sort **Nearest Pickup** (default order remains intent-based)
- Tours without pickups are not excluded unless **Nearest Pickup** sort is selected

### Primary pickup
- Primary pickup is optional for MVP
- Enforce **max one** primary pickup per tour
- Do **not** require one primary pickup

---

## Database Design (Final)
### Table
`public.tour_pickup_locations`
- id uuid PK default gen_random_uuid()
- tour_id uuid FK → public.tours(id) on delete cascade
- title text not null
- formatted_address text not null
- city text null
- country text null
- latitude double precision not null
- longitude double precision not null
- google_place_id text null
- pickup_time time null
- notes text null
- is_primary boolean not null default false
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

### Indexes
- `create index on public.tour_pickup_locations (tour_id);`
- `create index on public.tour_pickup_locations (latitude, longitude);`
- Enforce max one primary pickup:
  - `create unique index tour_one_primary_pickup on public.tour_pickup_locations (tour_id) where is_primary = true;`

### updated_at trigger
Add standard trigger:

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_pickup_updated
before update on public.tour_pickup_locations
for each row
execute function set_updated_at();
```

Optional “PostGIS-lite” phase:
- enable extensions: cube, earthdistance
- GiST index on ll_to_earth(latitude, longitude)

Enterprise phase:
- enable PostGIS
- add geography column + GiST index

---

## Security (RLS)
Enable RLS for `tour_pickup_locations`.

### Operator CRUD
Operators can only manage pickups for tours they own:

```sql
exists (
  select 1 from public.tours t
  where t.id = tour_pickup_locations.tour_id
  and t.operator_id = auth.uid()
)
```

### Public / Traveller read
Must match production visibility:

```sql
t.is_active = true
and t.is_published = true
and t.status = 'live'
```

Notes:
- If later we want to hide exact addresses until booking, we can expose a view/RPC that returns partial data.

---

## Nearest Pickup Ranking (MVP Query Strategy)
Approach:
- Bounding box filter
- Clamped Haversine
- `distinct on` per tour (nearest pickup)
- DB-level ordering

### API pattern (Final)
Use Pattern A:
- RPC (recommended): `search_tours_by_nearest_pickup(p_user_lat, p_user_lng, p_radius_km, p_limit, p_offset)`
- RPC returns ordered `tour_id` + nearest pickup metadata + `nearest_distance_km`
- Frontend calls RPC, then fetches tours by IDs, then reorders client-side to preserve RPC order

Important:
- `in (...)` does not preserve order — UI must reorder based on RPC output

Optional helper RPC:
- `set_primary_pickup(p_tour_id, p_pickup_id)` to safely toggle primary in one transaction

---

## Frontend — Operator Step
### Step placement
- Insert new StepId in the workflow after Basics and before Itinerary.
- Update step evaluation so it can show "needs attention".

### UI components
- Use existing Google Maps provider already present in codebase (project uses @vis.gl/react-google-maps).
- Route-split / lazy-load the Pickup step so Maps SDK loads only there. ✅

### Map behavior
- Autocomplete search
- Draggable marker
- Reverse geocode on drag
- Save explicitly
- If reverse geocode fails: still allow save (manual title)

### State & persistence
- Update tour draft data structure:
  - `pickup_locations: Array<PickupLocationDraft>`
- On save:
  - upsert pickup rows for the tour
  - delete removed pickups
- On edit:
  - load existing pickup rows and prefill

### Validation
- Cannot go next until pickup_locations.length >= 1.
- Primary pickup optional; enforce max one primary

### Google API key rules (Mandatory)
Browser key:
- Restricted by HTTP referrer
- Restricted to: Maps JS API, Places API, Geocoding API

If server-side geocode is added later:
- Separate server key
- IP restricted
- Never exposed to frontend

---

## Frontend — Traveller Ranking
### Data requirement
Use traveller city lat/lng from app state.

Current implementation note:
- Near You + Nearest Pickup use **selected city** coords when available, with geolocation-if-granted as a fallback.

Implementation path:
1) Homepage: **Near You** calls the RPC and renders tours ordered by nearest pickup.
2) Search: add sort option **Nearest Pickup**; only when selected do we call the RPC and reorder results.

Integration notes:
- Cache by `(city_id, radius_km, page)` using React Query
- Tours without pickups:
  - Near You: only tours with pickups appear
  - Default search: do not exclude

---

## Backfill Plan (If Existing Tours Exist)
If tours are already live:

Option A:
- If `tours` contains reliable lat/lng: create one pickup titled **Main Pickup**

Option B:
- If no reliable lat/lng: do not backfill
- Only tours with pickups appear in **Near You**

---

## Migration / Rollout Plan
1) Add table + indexes + trigger + RLS in migration.
2) Ship operator Pickup step + gating.
3) Backfill (optional, per policy above).
4) Ship traveller ranking:
  - Homepage Near You
  - Search sort Nearest Pickup
5) Monitor:
  - RPC latency
  - pickup row growth
  - RLS denials
  - Map API usage quota

Status:
- (1) ✅ Done
- (2) ✅ Done
- (3) ⬜ Optional / Pending
- (4) ⚠️ Partially done (Homepage Near You ✅, Nearest Pickup sort implemented on Tours browse page; Search page is hotel-only)
- (5) ⬜ Pending

---

## Acceptance Criteria (Final)
Operator:
- Must add ≥1 pickup before continuing
- Can add/edit/delete multiple pickups
- Can toggle primary (max one enforced)
- Exact Google map pin selection
- Lazy-loaded Maps SDK (no initial load regression)

Traveller:
- Homepage **Near You** shows distance-ranked tours
- Search page offers sort **Nearest Pickup**
- Tours without pickups not excluded by default
- No significant query latency

Status notes:
- Operator acceptance criteria: ✅ met
- Traveller acceptance criteria: ✅ Near You + Nearest Pickup sorting present; Search-page wording depends on routing (see deviation above)

---

## Monitoring After Launch
Track:
- RPC latency
- Pickup table row growth
- RLS denial logs
- Map API usage quota
- Conversion uplift in **Near You** section

---

## Architectural Readiness Level
This design is:
- MVP scalable
- Geo-ready
- Compatible with PostGIS future
- Security-aligned
- Performance-safe
- Bundle-safe

---

## Engineering Checklist (high-level)
- DB: migration + indexes + RLS
- Shared types: PickupLocation
- Web: new step UI + draft persistence + edit load
- Traveller: distance-ranking query integration
- QA: operator create/edit, traveller browse/search sorting, RLS checks
