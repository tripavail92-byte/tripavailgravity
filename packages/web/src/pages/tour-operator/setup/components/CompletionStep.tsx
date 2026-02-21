import { ArrowRight, LayoutDashboard, Map, ShieldCheck, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { Card } from '@/components/ui/card'

export function CompletionStep() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center">
      <Card className="p-10 text-center border-none shadow-none bg-transparent flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-8"
        >
          <div className="w-32 h-32 bg-primary rounded-[40px] flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/40 rotate-12 transition-transform hover:rotate-0 duration-500">
            <Trophy className="w-16 h-16" aria-hidden="true" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">
            You're All Set!
          </h2>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
            Your operator profile is now complete. Our team will review your verification documents
            shortly.
          </p>

          <div className="pt-10 space-y-4 w-full">
            <Card
              className="p-6 border-primary/20 bg-primary/5 shadow-md rounded-3xl hover:bg-primary/10 transition-all cursor-pointer group ring-1 ring-primary/20"
              onClick={() => navigate('/operator/verification')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">Verify Identity</p>
                    <p className="text-xs text-muted-foreground">
                      Enable bookings with biometric matching
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-primary transform group-hover:translate-x-1 transition-all" />
              </div>
            </Card>

            <Card
              className="p-6 border-border/50 shadow-sm rounded-3xl hover:border-primary/20 transition-all cursor-pointer group bg-background ring-1 ring-border/[0.02]"
              onClick={() => navigate('/operator/dashboard')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">Go to Dashboard</p>
                    <p className="text-xs text-muted-foreground">Manage your tours and bookings</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
              </div>
            </Card>

            <Card
              className="p-6 border-border/50 shadow-sm rounded-3xl hover:border-primary/20 transition-all cursor-pointer group bg-background ring-1 ring-border/[0.02]"
              onClick={() => navigate('/operator/tours/new')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Map className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">Create Your First Tour</p>
                    <p className="text-xs text-muted-foreground">Launch a new adventure package</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </div>
        </motion.div>
      </Card>

      <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.2em] pt-8">
        Powered by TripAvail Partner Network
      </p>
    </div>
  )
}
