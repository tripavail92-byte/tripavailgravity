import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backPath?: string
  onBack?: () => void
  showBackButton?: boolean
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  backPath,
  onBack,
  showBackButton,
  actions,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate()
  const shouldShowBackButton = showBackButton ?? Boolean(backPath || onBack)

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backPath) {
      navigate(backPath)
    } else {
      navigate(-1)
    }
  }

  return (
    // flex-wrap + a 16rem floor on the title block: when the actions don't fit beside the title
    // they drop onto their own line. Without it, two buttons on a phone squeezed the title to
    // "B…" and set the subtitle one word per line.
    <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-6', className)}>
      <div className="flex min-w-[min(100%,16rem)] flex-1 items-center gap-4">
        {shouldShowBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Go back"
            className="shrink-0 h-10 w-10 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="max-w-full shrink-0">{actions}</div>}
    </div>
  )
}
