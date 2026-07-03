-- Migration 0007 — OSM truck stops (Overpass extract cache)
-- Story 2.1 (Parking Discovery epic)
--
-- Mirror of OpenStreetMap truck-stop and HGV-accessible parking POIs,
-- refreshed weekly by the osm-refresh Edge Function (Story 2.5) via the
-- Overpass API. Anon-read so the parking-search Edge Function (Story 2.4
-- OSM lookup) can serve fallback results without privileged DB access.
--
-- SCOPE LOCK (2026-05-25):
--   - TPC deferred post-MVP. NO source/affiliate_url/affiliate_partner/
--     bookable columns. When TPC ships, a small migration adds them.
--   - Curated picks deferred. NO curator_id/notes/why_picked columns.
--     Stopgap: Shawn can insert curated rows with prefixed osm_id like
--     'shawn_pick_001'; the PK is text so this works without schema change.
--
-- Per architecture.md:334, shape is strictly OSM-native.

CREATE TABLE public.osm_truck_stops (
  osm_id            text PRIMARY KEY,
  lat               numeric NOT NULL,
  lng               numeric NOT NULL,
  name              text,
  amenity           text NOT NULL,
  last_refreshed_at timestamptz NOT NULL DEFAULT now(),
  raw_tags          jsonb
);

COMMENT ON TABLE public.osm_truck_stops IS
  'OSM Overpass extract: truck stops and HGV-accessible parking. Refreshed weekly by osm-refresh Edge Function (Story 2.5). Anon-read for parking-search fallback (Story 2.4). Strictly OSM-native shape per architecture.md:334.';

COMMENT ON COLUMN public.osm_truck_stops.osm_id IS
  'OSM feature id (e.g., ''node/12345'', ''way/67890''). TEXT PK accommodates non-OSM stopgap rows like ''shawn_pick_001'' for curated picks (pre-curated-picks-story).';

COMMENT ON COLUMN public.osm_truck_stops.amenity IS
  'OSM amenity tag. Expected values: ''truck_stop'' or ''parking'' (with access=hgv in raw_tags).';

COMMENT ON COLUMN public.osm_truck_stops.raw_tags IS
  'Full OSM tag bag for future enrichment without schema change (e.g., capacity, lighting, fuel, shower flags surfaced later).';

-- Enable RLS. Default-deny posture; explicit policy below grants read.
ALTER TABLE public.osm_truck_stops ENABLE ROW LEVEL SECURITY;

-- Anon + authenticated SELECT. Writes go through the osm-refresh Edge
-- Function (Story 2.5) using the service-role key, which bypasses RLS by
-- design. No INSERT/UPDATE/DELETE policies — service-role doesn't need them.
CREATE POLICY osm_truck_stops_anon_read
  ON public.osm_truck_stops
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Explicit GRANT — Supabase's RLS-enable + grant-explicit posture.
GRANT SELECT ON public.osm_truck_stops TO anon, authenticated;

-- No indexes beyond the PK in this story. Story 2.4 (OSM lookup + ranking)
-- adds the appropriate geo index once query patterns are concrete (likely
-- a btree on (lat, lng) or PostGIS GiST — premature to pick without a real
-- query).
