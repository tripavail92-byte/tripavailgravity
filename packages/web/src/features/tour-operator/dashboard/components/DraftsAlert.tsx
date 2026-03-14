import { AlertCircle, ArrowRight, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Tour } from '@/features/tour-operator/services/tourService'

interface DraftsAlertProps {
  drafts: Tour[]
}

export function DraftsAlert({ drafts }: DraftsAlertProps) {
  const navigate = useNavigate()
  if (drafts.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-warning/10 border border-warning/30 rounded-2xl p-4 mb-8 flex items-start gap-4 shadow-sm"
    >
      <div className="bg-warning/20 p-2 rounded-xl">
        <AlertCircle className="w-5 h-5 text-warning" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-foreground">
          You have {drafts.length} unpublished tour drafts
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Continue where you left off and reach more travellers.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {drafts.slice(0, 3).map((draft) => (
            <div
              key={draft.id}
              className="bg-background/60 hover:bg-background border border-warning/30 rounded-lg px-3 py-2 flex items-center gap-3 transition-all cursor-pointer group"
              onClick={() =>
                navigate(`/operator/tours/new?tour_id=${encodeURIComponent(draft.id)}`)
              }
            >
              <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center text-xs font-bold text-warning">
                Draft
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {draft.title}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-warning">
                  <Clock className="w-3 h-3" />
                  <span>Last updated {new Date(draft.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-warning/70 group-hover:text-warning transition-colors" />
            </div>
          ))}
          {drafts.length > 3 && (
            <button className="text-xs font-bold text-warning hover:text-warning/80 transition-colors px-2">
              + {drafts.length - 3} more drafts
            </button>
          )}
        </div>
      </div>
      <Button
        size="sm"
        className="bg-warning hover:bg-warning/90 text-warning-foreground border-none shadow-sm shadow-warning/20 whitespace-nowrap"
        onClick={() => navigate(`/operator/tours/new?tour_id=${encodeURIComponent(drafts[0].id)}`)}
      >
        Resume Draft
      </Button>
    </motion.div>
  )
}
