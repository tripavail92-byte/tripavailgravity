import { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'

interface AnimatedIconProps {
  icon: LucideIcon
  className?: string
  size?: number | string
  isActive?: boolean
}

export function AnimatedIcon({ icon: Icon, className, size = 20, isActive }: AnimatedIconProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.2, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      className="flex items-center justify-center"
    >
      <Icon size={size} className={className} strokeWidth={isActive ? 2.5 : 2} />
    </motion.div>
  )
}
