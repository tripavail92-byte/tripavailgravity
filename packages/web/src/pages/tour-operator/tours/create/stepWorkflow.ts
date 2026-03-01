import { Tour } from '@/features/tour-operator/services/tourService'

export type StepId =
  | 'basics'
  | 'media'
  | 'itinerary'
  | 'details'
  | 'pricing'
  | 'scheduling'
  | 'review'

export type StepStatus = 'not_started' | 'in_progress' | 'complete' | 'needs_attention'

export interface StepWorkflowItem {
  id: StepId
  status: StepStatus
  requiredCount: number
  filledCount: number
  hasAnyInput: boolean
}

const hasText = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0
const hasNumber = (value: unknown): boolean => typeof value === 'number' && Number.isFinite(value)

function evaluateBasics(data: Partial<Tour>) {
  const typeSelected = hasText(data.tour_type) || hasText(data.custom_category_label)
  const checks = [
    hasText(data.title),
    typeSelected,
    hasNumber(data.duration_days) && Number(data.duration_days) > 0,
    hasText(data.location?.city),
  ]

  const hasAnyInput =
    hasText(data.title) ||
    hasText(data.tour_type) ||
    hasText(data.custom_category_label) ||
    (hasNumber(data.duration_days) && Number(data.duration_days) > 0) ||
    hasText(data.location?.city) ||
    hasText(data.short_description)

  return {
    requiredCount: checks.length,
    filledCount: checks.filter(Boolean).length,
    isComplete: checks.every(Boolean),
    hasAnyInput,
  }
}

function evaluateMedia(data: Partial<Tour>) {
  const imageCount = data.images?.length ?? 0
  return {
    requiredCount: 1,
    filledCount: imageCount > 0 ? 1 : 0,
    isComplete: imageCount > 0,
    hasAnyInput: imageCount > 0,
  }
}

function evaluateItinerary(data: Partial<Tour>) {
  const requiredDays = Math.max(1, data.duration_days ?? 1)
  const itinerary = Array.isArray(data.itinerary) ? data.itinerary : []
  const filledDays = itinerary.filter((day: any) => hasText(day?.description)).length
  const hasAnyInput = itinerary.some((day: any) => hasText(day?.title) || hasText(day?.description))

  return {
    requiredCount: requiredDays,
    filledCount: Math.min(filledDays, requiredDays),
    isComplete: filledDays >= requiredDays,
    hasAnyInput,
  }
}

function evaluateDetails(data: Partial<Tour>) {
  const hasParticipants =
    hasNumber(data.min_participants) &&
    hasNumber(data.max_participants) &&
    Number(data.min_participants) > 0 &&
    Number(data.max_participants) >= Number(data.min_participants)

  const hasAgeBand =
    hasNumber(data.min_age) && hasNumber(data.max_age) && Number(data.max_age) >= Number(data.min_age)

  const checks = [
    hasText(data.difficulty_level),
    (data.languages?.length ?? 0) > 0,
    hasParticipants,
    hasAgeBand,
    hasText(data.description),
  ]

  const hasAnyInput =
    hasText(data.difficulty_level) ||
    (data.languages?.length ?? 0) > 0 ||
    hasNumber(data.min_participants) ||
    hasNumber(data.max_participants) ||
    hasNumber(data.min_age) ||
    hasNumber(data.max_age) ||
    hasText(data.description)

  return {
    requiredCount: checks.length,
    filledCount: checks.filter(Boolean).length,
    isComplete: checks.every(Boolean),
    hasAnyInput,
  }
}

function evaluatePricing(data: Partial<Tour>) {
  const checks = [
    hasNumber(data.price) && Number(data.price) > 0,
    hasText(data.currency),
    hasText(data.cancellation_policy),
  ]

  const hasAnyInput =
    hasNumber(data.price) ||
    hasText(data.currency) ||
    hasText(data.cancellation_policy) ||
    (data.inclusions?.length ?? 0) > 0 ||
    (data.exclusions?.length ?? 0) > 0 ||
    (data.pricing_tiers?.length ?? 0) > 0

  return {
    requiredCount: checks.length,
    filledCount: checks.filter(Boolean).length,
    isComplete: checks.every(Boolean),
    hasAnyInput,
  }
}

function evaluateScheduling(data: Partial<Tour>) {
  const schedules = Array.isArray(data.schedules) ? data.schedules : []
  const validSchedules = schedules.filter(
    (schedule: any) =>
      hasText(schedule?.date) &&
      hasText(schedule?.time) &&
      hasNumber(schedule?.capacity) &&
      Number(schedule.capacity) > 0,
  )

  return {
    requiredCount: 1,
    filledCount: validSchedules.length > 0 ? 1 : 0,
    isComplete: validSchedules.length > 0,
    hasAnyInput: schedules.length > 0,
  }
}

function evaluateStepData(id: StepId, data: Partial<Tour>) {
  if (id === 'basics') return evaluateBasics(data)
  if (id === 'media') return evaluateMedia(data)
  if (id === 'itinerary') return evaluateItinerary(data)
  if (id === 'details') return evaluateDetails(data)
  if (id === 'pricing') return evaluatePricing(data)
  if (id === 'scheduling') return evaluateScheduling(data)

  return {
    requiredCount: 0,
    filledCount: 0,
    isComplete: false,
    hasAnyInput: false,
  }
}

export function deriveStepWorkflow(
  data: Partial<Tour>,
  stepIds: StepId[],
  currentStepIndex: number,
  visitedSteps: Set<number>,
  submitAttempted: boolean,
): StepWorkflowItem[] {
  const statusByStep = stepIds.map((id) => ({ id, ...evaluateStepData(id, data) }))
  const allPrimaryComplete = statusByStep.every((step) => step.isComplete)

  return stepIds.map((id, index) => {
    if (id === 'review') {
      return {
        id,
        requiredCount: 1,
        filledCount: allPrimaryComplete ? 1 : 0,
        hasAnyInput: true,
        status: allPrimaryComplete
          ? 'complete'
          : submitAttempted
            ? 'needs_attention'
            : currentStepIndex === index
              ? 'in_progress'
              : 'not_started',
      }
    }

    const evaluated = statusByStep[index]
    const isCurrent = currentStepIndex === index
    const wasVisited = visitedSteps.has(index)

    let status: StepStatus = 'not_started'
    if (evaluated.isComplete) {
      status = 'complete'
    } else if ((submitAttempted || wasVisited) && evaluated.hasAnyInput && !isCurrent) {
      status = 'needs_attention'
    } else if (isCurrent || evaluated.hasAnyInput) {
      status = 'in_progress'
    }

    return {
      id,
      requiredCount: evaluated.requiredCount,
      filledCount: evaluated.filledCount,
      hasAnyInput: evaluated.hasAnyInput,
      status,
    }
  })
}