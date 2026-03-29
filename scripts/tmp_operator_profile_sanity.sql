SELECT
  p.user_id,
  p.slug,
  p.company_name,
  p.business_name,
  p.is_public,
  p.fleet_assets,
  p.guide_profiles,
  p.public_policies,
  m.avg_rating,
  m.total_reviews,
  m.verified_badge_count,
  m.last_calculated_at
FROM public.tour_operator_profiles p
LEFT JOIN public.operator_public_metrics m ON m.operator_id = p.user_id
WHERE p.is_public = true
ORDER BY p.updated_at DESC NULLS LAST
LIMIT 1;
