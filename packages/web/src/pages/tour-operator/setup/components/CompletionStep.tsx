import { ArrowRight, LayoutDashboard, Map, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

const NAV_ACTIONS = [
  {
    icon: ShieldCheck,
    label: 'Verify Identity',
    desc: 'Enable bookings with biometric matching',
    href: '/operator-dashboard/verification',
    accent: true,
  },
  {
    icon: LayoutDashboard,
    label: 'Go to Dashboard',
    desc: 'Manage your tours and bookings',
    href: '/operator/dashboard',
    accent: false,
  },
  {
    icon: Map,
    label: 'Create Your First Tour',
    desc: 'Launch a new adventure package',
    href: '/operator/tours/new',
    accent: false,
  },
]

export function CompletionStep() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* Trophy icon with glow */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 12 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.05 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 rounded-[40px] bg-primary/50 blur-2xl scale-125" />
        <div className="relative w-32 h-32 bg-gradient-to-br from-primary to-primary/70 rounded-[40px] flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/50 hover:rotate-0 transition-transform duration-500 ring-2 ring-primary/40">
          <Trophy className="w-16 h-16 drop-shadow-lg" aria-hidden="true" />
        </div>
        {/* sparkle badge */}
        <motion.div
          animate={{ y: [-4, 4, -4], rotate: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-4 -right-4 w-10 h-10 bg-yellow-400/20 backdrop-blur-md border border-yellow-400/30 rounded-xl flex items-center justify-center shadow-lg"
        >
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </motion.div>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="space-y-3 mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Setup Complete
        </div>
        <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">
          You're All Set!
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
          Your operator profile is complete. Our team will review your verification documents
          shortly.
        </p>
      </motion.div>

      {/* Action cards */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="w-full space-y-3"
      >
        {NAV_ACTIONS.map((action, i) => (
          <motion.button
            key={action.href}
            initial={{ x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.45 + i * 0.08 }}
            onClick={() => navigate(action.href)}
            className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all group text-left ${
              action.accent
                ? 'border-primary/40 bg-primary/20 hover:bg-primary/30 shadow-lg shadow-primary/10'
                : 'border-border/60 bg-background hover:bg-muted/30 hover:border-border'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  action.accent
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'bg-muted text-muted-foreground/60 group-hover:bg-primary/20 group-hover:text-primary'
                }`}
              >
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground/70 font-medium">{action.desc}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transform group-hover:translate-x-1 transition-all flex-shrink-0" />
          </motion.button>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-muted-foreground/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-10"
      >
        Powered by TripAvail Partner Network
      </motion.p>
    </div>
  )
}
