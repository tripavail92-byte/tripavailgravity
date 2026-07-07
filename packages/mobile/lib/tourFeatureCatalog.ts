export type TourFeatureItem = { label: string; icon_key: string }

export const INCLUDED_FEATURE_OPTIONS: TourFeatureItem[] = [
  { label: 'Professional Tour Guide', icon_key: 'guide' },
  { label: 'Transportation', icon_key: 'bus' },
  { label: 'Entrance Fees', icon_key: 'ticket' },
  { label: 'Meals (as specified)', icon_key: 'meal' },
  { label: 'Accommodation', icon_key: 'hotel' },
  { label: 'Travel Insurance', icon_key: 'insurance' },
  { label: 'Photography', icon_key: 'camera' },
  { label: 'Local Taxes', icon_key: 'taxes' },
]

export const EXCLUDED_FEATURE_OPTIONS: TourFeatureItem[] = [
  { label: 'Personal Expenses', icon_key: 'expense' },
  { label: 'Tips and Gratuities', icon_key: 'tips' },
  { label: 'International Flights', icon_key: 'flight' },
  { label: 'Visa Fees', icon_key: 'visa' },
  { label: 'Optional Activities', icon_key: 'optional_activity' },
  { label: 'Alcoholic Beverages', icon_key: 'alcohol' },
  { label: 'Shopping', icon_key: 'shopping' },
  { label: 'Emergency Expenses', icon_key: 'emergency' },
]

/** Maps each label (case-insensitive) to a catalog item; unmatched → icon_key 'generic'. */
export function buildStructuredFeaturesFromLabels(
  labels: string[],
  catalog: TourFeatureItem[],
): TourFeatureItem[] {
  const byLabel = new Map(catalog.map((c) => [c.label.toLowerCase(), c]))
  return (labels ?? []).map(
    (l) => byLabel.get(String(l).toLowerCase()) ?? { label: l, icon_key: 'generic' },
  )
}
