import { Tour } from '@/features/tour-operator/services/tourService'

export type StepId =
  | 'basics'
  | 'pickup'
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
  const schedules = Array.isArray(data.schedules) ? data.schedules : []
  const hasSchedule = schedules.some(
    (schedule: any) =>
      hasText(schedule?.date) &&
      hasText(schedule?.time) &&
      hasNumber(schedule?.capacity) &&
      Number(schedule.capacity) > 0,
  )

  const checks = [
    hasText(data.title),
    typeSelected,
    hasNumber(data.duration_days) && Number(data.duration_days) > 0,
    hasText(data.location?.city),
    hasNumber(data.max_participants) && Number(data.max_participants) > 0,
    hasSchedule,
  ]

  const hasAnyInput =
    hasText(data.title) ||
    hasText(data.tour_type) ||
    hasText(data.custom_category_label) ||
    (hasNumber(data.duration_days) && Number(data.duration_days) > 0) ||
    hasText(data.location?.city) ||
    (hasNumber(data.max_participants) && Number(data.max_participants) > 0) ||
    schedules.length > 0 ||
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

function evaluatePickup(data: Partial<Tour>) {
  const raw = (data.draft_data as any)?.pickup_locations_count
  const count = typeof raw === 'number' ? raw : Number(raw ?? 0)
  const hasAnyInput = count > 0

  return {
    requiredCount: 1,
    filledCount: count > 0 ? 1 : 0,
    isComplete: count > 0,
    hasAnyInput,
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
  const hasAgeBand =
    hasNumber(data.min_age) && hasNumber(data.max_age) && Number(data.max_age) >= Number(data.min_age)

  const checks = [
    hasText(data.difficulty_level),
    (data.languages?.length ?? 0) > 0,
    hasAgeBand,
    hasText(data.description),
  ]

  const hasAnyInput =
    hasText(data.difficulty_level) ||
    (data.languages?.length ?? 0) > 0 ||
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
  if (id === 'pickup') return evaluatePickup(data)
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
    const isCurrent = currentStepIndex === index
    const wasVisited = visitedSteps.has(index)

    if (id === 'review') {
      return {
        id,
        requiredCount: 1,
        filledCount: allPrimaryComplete ? 1 : 0,
        hasAnyInput: true,
        status: submitAttempted
          ? allPrimaryComplete
            ? 'complete'
            : 'needs_attention'
          : allPrimaryComplete && (isCurrent || wasVisited)
            ? 'complete'
            : isCurrent
              ? 'in_progress'
              : 'not_started',
      }
    }

    const evaluated = statusByStep[index]

    // If the user attempted submission, show attention/complete based on actual data
    if (submitAttempted) {
      const status: StepStatus = evaluated.isComplete
        ? 'complete'
        : evaluated.hasAnyInput || wasVisited || isCurrent
          ? 'needs_attention'
          : 'not_started'

      return {
        id,
        requiredCount: evaluated.requiredCount,
        filledCount: evaluated.filledCount,
        hasAnyInput: evaluated.hasAnyInput,
        status: isCurrent && status === 'not_started' ? 'in_progress' : status,
      }
    }

    let status: StepStatus = 'not_started'
    if (isCurrent) {
      status = evaluated.isComplete ? 'complete' : 'in_progress'
    } else if (!wasVisited) {
      status = 'not_started'
    } else if (evaluated.isComplete) {
      status = 'complete'
    } else if (evaluated.hasAnyInput) {
      status = 'needs_attention'
    } else {
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