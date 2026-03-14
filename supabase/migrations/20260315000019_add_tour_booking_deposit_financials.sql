ALTER TABLE public.tour_bookings
DROP CONSTRAINT IF EXISTS tour_bookings_payment_status_check;

ALTER TABLE public.package_bookings
DROP CONSTRAINT IF EXISTS package_bookings_payment_status_check;

ALTER TABLE public.tour_bookings
ADD COLUMN IF NOT EXISTS payment_collection_mode TEXT DEFAULT 'full_online',
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS upfront_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid_online NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_due_to_operator NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_policy_text TEXT;

ALTER TABLE public.package_bookings
ADD COLUMN IF NOT EXISTS payment_collection_mode TEXT DEFAULT 'full_online',
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS upfront_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid_online NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_due_to_operator NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_policy_text TEXT;

UPDATE public.tour_bookings
SET
  payment_collection_mode = COALESCE(payment_collection_mode, 'full_online'),
  deposit_required = COALESCE(deposit_required, FALSE),
  deposit_percentage = COALESCE(deposit_percentage, 0),
  upfront_amount = CASE
    WHEN COALESCE(upfront_amount, 0) > 0 THEN upfront_amount
    ELSE total_price
  END,
  remaining_amount = COALESCE(remaining_amount, 0),
  amount_paid_online = CASE
    WHEN payment_status IN ('paid', 'partially_paid', 'balance_pending') THEN total_price
    ELSE COALESCE(amount_paid_online, 0)
  END,
  amount_due_to_operator = COALESCE(amount_due_to_operator, 0),
  payment_policy_text = COALESCE(payment_policy_text, 'Full amount is charged online at the time of booking confirmation.');

UPDATE public.package_bookings
SET
  payment_collection_mode = COALESCE(payment_collection_mode, 'full_online'),
  deposit_required = COALESCE(deposit_required, FALSE),
  deposit_percentage = COALESCE(deposit_percentage, 0),
  upfront_amount = CASE
    WHEN COALESCE(upfront_amount, 0) > 0 THEN upfront_amount
    ELSE total_price
  END,
  remaining_amount = COALESCE(remaining_amount, 0),
  amount_paid_online = CASE
    WHEN payment_status IN ('paid', 'partially_paid', 'balance_pending') THEN total_price
    ELSE COALESCE(amount_paid_online, 0)
  END,
  amount_due_to_operator = COALESCE(amount_due_to_operator, 0),
  payment_policy_text = COALESCE(payment_policy_text, 'Full amount is charged online at the time of booking confirmation.');

ALTER TABLE public.tour_bookings
ALTER COLUMN payment_collection_mode SET DEFAULT 'full_online',
ALTER COLUMN deposit_required SET DEFAULT FALSE,
ALTER COLUMN deposit_percentage SET DEFAULT 0,
ALTER COLUMN upfront_amount SET DEFAULT 0,
ALTER COLUMN remaining_amount SET DEFAULT 0,
ALTER COLUMN amount_paid_online SET DEFAULT 0,
ALTER COLUMN amount_due_to_operator SET DEFAULT 0;

ALTER TABLE public.package_bookings
ALTER COLUMN payment_collection_mode SET DEFAULT 'full_online',
ALTER COLUMN deposit_required SET DEFAULT FALSE,
ALTER COLUMN deposit_percentage SET DEFAULT 0,
ALTER COLUMN upfront_amount SET DEFAULT 0,
ALTER COLUMN remaining_amount SET DEFAULT 0,
ALTER COLUMN amount_paid_online SET DEFAULT 0,
ALTER COLUMN amount_due_to_operator SET DEFAULT 0;

ALTER TABLE public.tour_bookings
ADD CONSTRAINT tour_bookings_payment_status_check
CHECK (payment_status IN ('unpaid', 'processing', 'partially_paid', 'balance_pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

ALTER TABLE public.package_bookings
ADD CONSTRAINT package_bookings_payment_status_check
CHECK (payment_status IN ('unpaid', 'processing', 'partially_paid', 'balance_pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

ALTER TABLE public.tour_bookings
ADD CONSTRAINT tour_bookings_payment_collection_mode_check
CHECK (payment_collection_mode IN ('full_online', 'partial_online'));

ALTER TABLE public.package_bookings
ADD CONSTRAINT package_bookings_payment_collection_mode_check
CHECK (payment_collection_mode IN ('full_online', 'partial_online'));