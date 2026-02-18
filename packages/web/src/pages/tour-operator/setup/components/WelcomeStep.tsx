import { Plane } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface StepProps {
  onNext: () => void
  onUpdate: (data: any) => void
  data: any
}

export function WelcomeStep({ onNext }: StepProps) {
  return (
    <Card className="p-8 text-center border-none shadow-none bg-transparent">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Plane className="w-12 h-12 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground mb-4 tracking-tight">
          Welcome to TripAvail
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md text-lg leading-relaxed font-medium">
          Join our community of tour operators and start creating amazing travel experiences for
          adventurers around the world.
        </p>
        <Button
          onClick={onNext}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white px-12 py-7 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          Get Started
        </Button>
      </motion.div>
    </Card>
  )
}
