import type { SubStepDef } from '@/features/wizard/types'

import { registrationNumberError } from './components/BusinessInfoStep'
import type { SetupStepSlug } from '@/features/tour-operator/constants/setupSteps'

/**
 * The screens inside each setup stage. Stages themselves never change — the database stores the
 * stage index in `tour_operator_profiles.setup_current_step`, so renumbering would strand every
 * operator mid-setup. Sub-steps are a second, nested index carried in the URL (`?step=business&sub=1`).
 *
 * The focus targets below are the DOM ids that already exist on those controls.
 */
export const SETUP_SUB_STEPS: Partial<Record<SetupStepSlug, SubStepDef<any>[]>> = {
  personal: [
    {
      id: 'identity',
      title: 'What should we call you?',
      description: 'Your email is locked to your login and is used for payouts and audit logs.',
      validate: (d) =>
        d?.personalInfo?.operatorName?.trim()
          ? []
          : [{ field: 'operatorName', message: 'Enter your full name' }],
    },
    {
      id: 'phone',
      title: 'Verify your phone number',
      description: 'We use it for booking alerts, payouts, and account security.',
      validate: (d) => {
        if (!d?.personalInfo?.phone?.trim()) {
          return [{ field: 'phone', message: 'Add your phone number' }]
        }
        if (!d?.phoneVerified) {
          return [{ field: 'phone', message: 'Verify your phone number to continue' }]
        }
        return []
      },
    },
  ],

  business: [
    {
      id: 'identity',
      title: 'What is your business called?',
      description: 'The registered name travellers and our compliance team will see.',
      validate: (d) => {
        const b = d?.businessInfo ?? {}
        const issues = []
        if (!b.businessName?.trim()) {
          issues.push({ field: 'businessName', message: 'Enter your registered business name' })
        }
        const regError = registrationNumberError(b.registrationNumber)
        if (regError) issues.push({ field: 'registrationNumber', message: regError })
        return issues
      },
    },
    {
      id: 'scale',
      title: 'How big is your operation?',
      description: 'This helps travellers judge what to expect. Optional.',
      optional: true,
    },
    {
      id: 'story',
      title: 'Tell travellers about your business',
      description: 'A short description and your logo. Optional, but both build trust.',
      optional: true,
    },
  ],

  policies: [
    {
      id: 'agreement',
      title: 'Accept the platform agreement',
      description: 'How TripAvail handles payments, data, and your listings.',
      validate: (d) =>
        d?.policies?.accepted
          ? []
          : [{ field: 'platform-agreement', message: 'Accept the platform agreement to continue' }],
    },
    {
      id: 'operation',
      title: 'How do you run your tours?',
      description: 'Use our templates, or upload your own signed policy documents.',
      optional: true,
    },
  ],
}

/** How many screens a stage has. Stages without sub-steps are a single screen. */
export function setupSubStepCount(stage: SetupStepSlug): number {
  return SETUP_SUB_STEPS[stage]?.length ?? 1
}
