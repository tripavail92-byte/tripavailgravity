BEGIN;

UPDATE public.tours
SET
  base_price = CASE
    WHEN coalesce(base_price, 0) <= 0
      THEN coalesce(
        CASE
          WHEN coalesce(draft_data->>'price', '') ~ '^[0-9]+(\\.[0-9]+)?$'
            THEN nullif((draft_data->>'price')::numeric, 0)
          ELSE NULL
        END,
        base_price,
        0
      )
    ELSE base_price
  END,
  price = CASE
    WHEN coalesce(price, 0) <= 0
      THEN coalesce(
        CASE
          WHEN coalesce(draft_data->>'price', '') ~ '^[0-9]+(\\.[0-9]+)?$'
            THEN nullif((draft_data->>'price')::numeric, 0)
          ELSE NULL
        END,
        price,
        0
      )
    ELSE price
  END,
  included = CASE
    WHEN coalesce(array_length(included, 1), 0) = 0
      THEN coalesce(
        (
          SELECT array_agg(value)
          FROM jsonb_array_elements_text(coalesce(draft_data->'inclusions', '[]'::jsonb)) AS value
        ),
        included,
        '{}'::text[]
      )
    ELSE included
  END,
  inclusions = CASE
    WHEN coalesce(array_length(inclusions, 1), 0) = 0
      THEN coalesce(
        (
          SELECT array_agg(value)
          FROM jsonb_array_elements_text(coalesce(draft_data->'inclusions', '[]'::jsonb)) AS value
        ),
        inclusions,
        '{}'::text[]
      )
    ELSE inclusions
  END,
  excluded = CASE
    WHEN coalesce(array_length(excluded, 1), 0) = 0
      THEN coalesce(
        (
          SELECT array_agg(value)
          FROM jsonb_array_elements_text(coalesce(draft_data->'exclusions', '[]'::jsonb)) AS value
        ),
        excluded,
        '{}'::text[]
      )
    ELSE excluded
  END,
  exclusions = CASE
    WHEN coalesce(array_length(exclusions, 1), 0) = 0
      THEN coalesce(
        (
          SELECT array_agg(value)
          FROM jsonb_array_elements_text(coalesce(draft_data->'exclusions', '[]'::jsonb)) AS value
        ),
        exclusions,
        '{}'::text[]
      )
    ELSE exclusions
  END,
  itinerary = CASE
    WHEN coalesce(jsonb_array_length(itinerary), 0) = 0
      THEN coalesce(draft_data->'itinerary', itinerary, '[]'::jsonb)
    ELSE itinerary
  END,
  difficulty_level = CASE
    WHEN coalesce(nullif(difficulty_level, ''), '') = ''
      THEN coalesce(nullif(draft_data->>'difficulty_level', ''), difficulty_level, 'moderate')
    ELSE difficulty_level
  END,
  cancellation_policy_type = CASE
    WHEN cancellation_policy_type IS NULL
      THEN coalesce(
        CASE lower(coalesce(draft_data->>'cancellation_policy', ''))
          WHEN 'flexible' THEN 'flexible'::public.cancellation_policy_type_enum
          WHEN 'moderate' THEN 'moderate'::public.cancellation_policy_type_enum
          WHEN 'strict' THEN 'strict'::public.cancellation_policy_type_enum
          WHEN 'non-refundable' THEN 'non-refundable'::public.cancellation_policy_type_enum
          ELSE NULL
        END,
        cancellation_policy_type,
        'moderate'::public.cancellation_policy_type_enum
      )
    ELSE cancellation_policy_type
  END,
  cancellation_policy = CASE
    WHEN coalesce(nullif(cancellation_policy, ''), '') = ''
      THEN coalesce(nullif(draft_data->>'cancellation_policy', ''), cancellation_policy, 'moderate')
    ELSE cancellation_policy
  END,
  require_deposit = CASE
    WHEN require_deposit IS NULL
      THEN coalesce(
        CASE lower(coalesce(draft_data->>'deposit_required', ''))
          WHEN 'true' THEN true
          WHEN 'false' THEN false
          ELSE NULL
        END,
        require_deposit,
        false
      )
    ELSE require_deposit
  END,
  deposit_required = CASE
    WHEN deposit_required IS NULL
      THEN coalesce(
        CASE lower(coalesce(draft_data->>'deposit_required', ''))
          WHEN 'true' THEN true
          WHEN 'false' THEN false
          ELSE NULL
        END,
        deposit_required,
        false
      )
    ELSE deposit_required
  END,
  updated_at = now(),
  last_edited_at = now()
WHERE draft_data IS NOT NULL;

-- Keep alias pairs consistent after backfill.
UPDATE public.tours
SET
  price = base_price,
  deposit_required = require_deposit,
  cancellation_policy = cancellation_policy_type::text,
  inclusions = included,
  exclusions = excluded,
  updated_at = now(),
  last_edited_at = now()
WHERE draft_data IS NOT NULL;

COMMIT;
