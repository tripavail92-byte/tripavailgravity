import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backPath?: string
  onBack?: () => void
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  backPath,
  onBack,
  actions,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate()

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
    <div className={cn('flex items-center justify-between gap-4 mb-6', className)}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0 h-10 w-10 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
