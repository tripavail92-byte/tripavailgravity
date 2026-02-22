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
      className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 flex items-start gap-4 shadow-sm"
    >
      <div className="bg-amber-500/20 p-2 rounded-xl">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
          You have {drafts.length} unpublished tour drafts
        </h3>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
          Continue where you left off and reach more travellers.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {drafts.slice(0, 3).map((draft) => (
            <div
              key={draft.id}
              className="bg-background/60 hover:bg-background border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-3 transition-all cursor-pointer group"
              onClick={() =>
                navigate(`/operator/tours/new?tour_id=${encodeURIComponent(draft.id)}`)
              }
            >
              <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300">
                Draft
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-100 truncate">
                  {draft.title}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                  <Clock className="w-3 h-3" />
                  <span>Last updated {new Date(draft.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-500/50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
            </div>
          ))}
          {drafts.length > 3 && (
            <button className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors px-2">
              + {drafts.length - 3} more drafts
            </button>
          )}
        </div>
      </div>
      <Button
        size="sm"
        className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm shadow-amber-500/20 whitespace-nowrap"
        onClick={() => navigate(`/operator/tours/new?tour_id=${encodeURIComponent(drafts[0].id)}`)}
      >
        Resume Draft
      </Button>
    </motion.div>
  )
}
