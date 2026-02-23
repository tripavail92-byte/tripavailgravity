import { CheckCircle2, Globe, Plane, Star, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

const HIGHLIGHTS = [
  { icon: Globe, label: 'Global reach', desc: 'Connect with travelers worldwide' },
  { icon: TrendingUp, label: 'Grow revenue', desc: 'Managed booking & payments' },
  { icon: CheckCircle2, label: 'Verified profile', desc: 'Instant trust with travelers' },
]

export function WelcomeStep({ onNext }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Glowing icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
        className="relative mb-8"
      >
        <div className="relative w-28 h-28 bg-gradient-to-br from-primary to-primary/70 rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/40 ring-1 ring-primary/30">
          <Plane className="w-14 h-14 text-primary-foreground drop-shadow-lg" aria-hidden="true" />
        </div>
        {/* Floating star badge */}
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-3 -right-3 w-9 h-9 bg-card border border-border rounded-xl flex items-center justify-center shadow-lg"
        >
          <Star className="w-4 h-4 text-primary fill-primary" />
        </motion.div>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="space-y-3 mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Partner Program
        </div>
        <h2 className="text-4xl font-black text-foreground tracking-tight leading-tight">
          Welcome to<br />TripAvail
        </h2>
        <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto font-medium">
          Join elite tour operators creating unforgettable experiences for adventurers around the world.
        </p>
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-full space-y-3 mb-10"
      >
        {HIGHLIGHTS.map((h, i) => (
          <motion.div
            key={h.label}
            initial={{ x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.08 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
              <h.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-foreground font-bold text-sm">{h.label}</p>
              <p className="text-muted-foreground/70 text-xs font-medium">{h.desc}</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-primary/60 ml-auto flex-shrink-0" />
          </motion.div>
        ))}
      </motion.div>

      {/* Setup time badge */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-muted-foreground/50 text-xs font-bold uppercase tracking-widest"
      >
        Setup takes about 5 minutes
      </motion.p>
    </div>
  )
}

