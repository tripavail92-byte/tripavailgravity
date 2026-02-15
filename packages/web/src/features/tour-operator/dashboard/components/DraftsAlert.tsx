import { AlertCircle, ArrowRight, Clock } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { Tour } from '@/features/tour-operator/services/tourService'

interface DraftsAlertProps {
  drafts: Tour[]
}

export function DraftsAlert({ drafts }: DraftsAlertProps) {
  if (drafts.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-4 shadow-sm"
    >
      <div className="bg-amber-100 p-2 rounded-xl">
        <AlertCircle className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-amber-900">
          You have {drafts.length} unpublished tour drafts
        </h3>
        <p className="text-sm text-amber-700 mt-1">
          Continue where you left off and reach more travellers.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {drafts.slice(0, 3).map((draft) => (
            <div
              key={draft.id}
              className="bg-white/60 hover:bg-white border border-amber-200/50 rounded-lg px-3 py-2 flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">
                {Math.round(Math.random() * 40 + 40)}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-900 truncate">{draft.title}</p>
                <div className="flex items-center gap-1 text-[10px] text-amber-600">
                  <Clock className="w-3 h-3" />
                  <span>Last updated {new Date(draft.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
            </div>
          ))}
          {drafts.length > 3 && (
            <button className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors px-2">
              + {drafts.length - 3} more drafts
            </button>
          )}
        </div>
      </div>
      <Button
        size="sm"
        className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm shadow-amber-200 whitespace-nowrap"
      >
        Resume Setup
      </Button>
    </motion.div>
  )
}
