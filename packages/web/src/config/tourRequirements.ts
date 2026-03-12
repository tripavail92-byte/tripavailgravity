import { RequirementCategory, RequirementOption, TOUR_REQUIREMENTS } from '@/pages/tour-operator/tours/create/components/RequirementsData'
import type { TourIconKey } from '@/features/tour-operator/assets/TourIconRegistry'

export type TourRequirementInfo = {
  id: string
  label: string
  category: RequirementCategory
  icon_key: TourIconKey
}

const REQUIREMENT_BY_ID: Record<string, TourRequirementInfo> = Object.fromEntries(
  (Object.keys(TOUR_REQUIREMENTS) as RequirementCategory[]).flatMap((category) =>
    (TOUR_REQUIREMENTS[category] || []).map((option) => [
      option.id,
      {
        id: option.id,
        label: option.label,
        category,
        icon_key: option.icon_key,
      } satisfies TourRequirementInfo,
    ]),
  ),
)

export function getTourRequirementInfo(id: string): TourRequirementInfo | null {
  return REQUIREMENT_BY_ID[id] ?? null
}

export function groupTourRequirementsByCategory(ids: unknown): Array<{
  category: RequirementCategory
  items: TourRequirementInfo[]
}> {
  const list = Array.isArray(ids) ? (ids as string[]) : []
  const groups = new Map<RequirementCategory, TourRequirementInfo[]>()

  for (const id of list) {
    const info = getTourRequirementInfo(id)
    if (!info) continue
    const current = groups.get(info.category) ?? []
    current.push(info)
    groups.set(info.category, current)
  }

  return Array.from(groups.entries())
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => a.category.localeCompare(b.category))
}
