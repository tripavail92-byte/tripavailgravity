import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface RevealStageProps {
  index: number
  title: string
  description?: string
  /** Turns the number into a checkmark once this question is answered. */
  complete?: boolean
  children: ReactNode
  className?: string
}

/**
 * One revealed question inside a repeater (a pickup, a vehicle, a guide, an activity). Later
 * questions only appear once the previous one is answered, so the operator adds items one field at
 * a time instead of meeting a full form. This is the "add one, then optionally add more" pattern —
 * the alternative to splitting a repeater across sub-steps, which becomes torture on the third item.
 */
export function RevealStage({
  index,
  title,
  description,
  complete = false,
  children,
  className,
}: RevealStageProps) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-border/60 bg-background/70 p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300',
            complete ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary',
          )}
          aria-hidden="true"
        >
          {complete ? <Check className="h-4 w-4" /> : index}
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h3 className="text-base font-bold leading-tight text-foreground">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}
