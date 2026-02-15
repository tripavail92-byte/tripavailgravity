import { ArrowRight, BadgePercent, Building2, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'

interface StepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: StepProps) {
  return (
    <div className="flex flex-col items-center py-6 space-y-12">
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-primary/30"
        >
          <Building2 className="w-12 h-12" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-primary" />
        </motion.div>
      </div>

      <div className="text-center space-y-4">
        <h3 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-[0.9]">
          Become a <br /> TripAvail <br /> <span className="text-primary italic">Partner</span>
        </h3>
        <p className="text-xl text-gray-500 max-w-sm mx-auto font-medium leading-relaxed mt-6">
          Join thousands of property owners delivering premium travel experiences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full">
        {[
          {
            icon: ShieldCheck,
            title: 'Verified Trust',
            text: 'Gain the trusted badge for your property',
          },
          {
            icon: BadgePercent,
            title: 'Direct Bookings',
            text: 'Zero commission on your first 10 bookings',
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="p-6 bg-gray-50/50 border border-gray-100 rounded-[32px] flex items-center gap-5"
          >
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500 font-medium">{item.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Button
        onClick={onNext}
        size="lg"
        className="w-full h-16 rounded-[24px] text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
      >
        Start Onboarding
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  )
}
