import {
  AlignJustify,
  Backpack,
  Briefcase,
  LogIn,
  LogOut,
  MapPin,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ROLE_NAVIGATION } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function RoleBasedDrawer() {
  const { user, activeRole, signOut, initialized, switchRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    navigate(path)
  }

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
    navigate('/')
  }

  const handleLogin = () => {
    setIsOpen(false)
    navigate('/auth')
  }

  // iOS-style elastic spring animation configuration
  const spring = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  }

  // Helper to format role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'hotel_manager':
        return 'Hotel Manager'
      case 'tour_operator':
        return 'Tour Operator'
      case 'traveller':
        return 'Traveler'
      default:
        return 'User'
    }
  }

  const getRoleBadgeGradient = (role: string) => {
    switch (role) {
      case 'hotel_manager':
        return 'from-blue-500 to-indigo-600'
      case 'tour_operator':
        return 'from-emerald-500 to-teal-600'
      case 'traveller':
        return 'from-amber-400 to-orange-500'
      default:
        return 'from-gray-500 to-slate-600'
    }
  }

  // Helper to get gradient color based on label (Image 2 Style)
  const getBadgeColor = (label: string) : string => {
    const l = label.toLowerCase();
    if (l.includes('dashboard')) return 'from-blue-500 to-indigo-600';
    if (l.includes('profile')) return 'from-purple-500 to-violet-600';
    if (l.includes('trip') || l.includes('tour')) return 'from-cyan-400 to-blue-500';
    if (l.includes('wishlist')) return 'from-pink-500 to-rose-500';
    if (l.includes('payment') || l.includes('wallet')) return 'from-emerald-400 to-teal-500';
    if (l.includes('booking')) return 'from-emerald-500 to-teal-600';
    if (l.includes('setting')) return 'from-gray-500 to-slate-600';
    if (l.includes('help')) return 'from-amber-500 to-orange-600';
    if (l.includes('legal') || l.includes('policy')) return 'from-slate-500 to-gray-600';
    if (l.includes('list')) return 'from-indigo-500 to-purple-600';
    if (l.includes('verification')) return 'from-rose-500 to-red-600';
    if (l.includes('calendar')) return 'from-orange-400 to-amber-500';
    
    return 'from-blue-500 to-indigo-600'; // Default
  }

  // Custom Icon Animation Logic
  const getIconAnimation = (label: string, isActive: boolean) => {
    const base = {
      scale: isActive ? 1.1 : 1,
    }
    const l = label.toLowerCase();
    
    if (l.includes('dashboard')) {
        return { ...base, hover: { rotate: 360, transition: { duration: 0.6, ease: "easeInOut" } } }
    }
    if (l.includes('trip') || l.includes('tour') || l.includes('propert')) {
        return { ...base, hover: { x: 3, y: -3, transition: { type: "spring", stiffness: 300 } } }
    }
    if (l.includes('profile')) {
        return { ...base, hover: { scale: 1.2, transition: { type: "spring", stiffness: 400 } } }
    }
    if (l.includes('wishlist') || l.includes('heart')) {
         return { ...base, hover: { scale: 1.2, color: "#f472b6" } }
    }
    if (l.includes('payment') || l.includes('card')) {
        return { ...base, hover: { rotateY: 180, transition: { duration: 0.4 } } }
    }
    if (l.includes('setting')) {
        return { ...base, hover: { rotate: 90 } }
    }

    return { ...base, hover: { scale: 1.15, rotate: 5 } }
  }

  // Loading state
  if (!initialized) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
      </Button>
    )
  }

  const roleLabel = getRoleLabel(activeRole?.role_type || '')
  const roleGradient = getRoleBadgeGradient(activeRole?.role_type || '')
  const navItems = activeRole ? ROLE_NAVIGATION[activeRole.role_type] || [] : []

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-border bg-background/50 backdrop-blur-sm rounded-full p-1 pl-3 hover:shadow-md transition-shadow group shrink-0"
      >
        <AlignJustify className="w-4 h-4 text-foreground group-hover:text-primary" />
        <Avatar className="h-7 w-7 border border-border">
          <AvatarImage src={user?.user_metadata?.avatar_url} alt="Traveler" />
          <AvatarFallback aria-label="Traveler" className="bg-muted text-muted-foreground">
            {user?.email ? user.email.charAt(0).toUpperCase() : <Backpack className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer Right Side */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={spring}
            className="fixed right-4 top-4 bottom-4 w-[85vw] max-w-[320px] z-50"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={spring}
              className="h-full rounded-[32px] glass-card dark:glass-card-dark shadow-2xl overflow-hidden flex flex-col"
            >
              <div
                className="flex-1 overflow-y-auto no-scrollbar"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--border) transparent',
                }}
              >
                {/* Close Button - Top Left */}
                <div className="absolute top-5 left-5 z-20">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors text-foreground dark:text-white"
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                {/* Guest View - Themed */}
                {!user || !activeRole ? (
                  <div className="p-6 pt-20 h-full flex flex-col">
                    <div className="text-left mb-8">
                      <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic leading-tight mb-2">
                        TRIPAVAIL
                      </h2>
                      <p className="text-muted-foreground dark:text-white/60 text-sm font-medium">
                        Sign in to manage your trips and preferences.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <Button
                        onClick={handleLogin}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all border-0"
                      >
                        <LogIn className="mr-2 h-5 w-5" /> Log In / Sign Up
                      </Button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border dark:border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background/80 dark:bg-black/40 px-2 text-muted-foreground dark:text-white/40 font-semibold backdrop-blur-sm">
                            Or continue as
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="h-20 rounded-2xl border-border bg-muted/20 dark:bg-white/5 flex flex-col gap-2 hover:bg-muted/50 dark:hover:bg-white/10 hover:border-primary/20 transition-all font-bold text-xs text-foreground dark:text-white"
                          onClick={() => {
                            setIsOpen(false)
                            navigate('/partner/onboarding')
                          }}
                        >
                          <span className="p-2 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400">
                            <Briefcase size={16} />
                          </span>
                          Partner
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 rounded-2xl border-border bg-muted/20 dark:bg-white/5 flex flex-col gap-2 hover:bg-muted/50 dark:hover:bg-white/10 hover:border-emerald-500/20 transition-all font-bold text-xs text-foreground dark:text-white"
                          onClick={() => {
                            setIsOpen(false)
                            navigate('/partner/onboarding')
                          }}
                        >
                          <span className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                            <Backpack size={16} />
                          </span>
                          Operator
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Logged In View - Themed & Horizontal Profile */}
                    <div className="p-5 pb-0">
                      
                      {/* Profile Header - Horizontal */}
                      <div className="flex items-center gap-4 mt-8 mb-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={spring}
                          className={cn(
                            'w-14 h-14 rounded-[18px] flex-shrink-0 bg-gradient-to-br flex items-center justify-center shadow-lg p-[2px]',
                            roleGradient,
                          )}
                        >
                          <div className="w-full h-full rounded-[16px] overflow-hidden bg-background dark:bg-black">
                            <Avatar className="w-full h-full">
                              <AvatarImage
                                src={user.user_metadata?.avatar_url}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-muted dark:bg-gray-900 text-foreground dark:text-white text-xl font-black">
                                {user.user_metadata?.full_name?.charAt(0) ||
                                  user.email?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </motion.div>

                        <div className="flex flex-col min-w-0 pr-8">
                            <h3 className="font-bold text-base truncate text-foreground dark:text-white tracking-tight mb-0.5">
                              {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                            </h3>
                            <p className="text-[10px] text-muted-foreground dark:text-white/50 truncate mb-1.5">{user.email}</p>

                            <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 dark:bg-white/10 border border-border dark:border-white/10 text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:text-white shadow-sm',
                                  )}
                                >
                                  <MapPin className="w-2.5 h-2.5 text-muted-foreground/70 dark:text-white/70" />
                                  <span>{roleLabel}</span>
                                </div>
                            </div>
                        </div>
                      </div>

                      {/* Completion Bar - Compact */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-muted/30 dark:bg-white/5 border border-border dark:border-white/10 shadow-sm">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/40 px-1">
                          <span>Profile Score</span>
                          <span
                            className={cn(
                              'bg-clip-text text-transparent bg-gradient-to-r',
                              roleGradient,
                            )}
                          >
                            40%
                          </span>
                        </div>
                        <div className="h-1 w-full bg-muted dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={cn('h-full rounded-full bg-gradient-to-r', roleGradient)}
                            initial={{ width: 0 }}
                            animate={{ width: '40%' }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items - Compact Colorful Squares */}
                    <div className="flex-1 px-4 py-4">
                      
                      <h3 className="text-muted-foreground/70 dark:text-white/30 text-[9px] font-bold uppercase tracking-widest mb-2 pl-2">
                        Navigation
                      </h3>

                      <div className="space-y-1.5">
                        {navItems.map((item) => {
                          const isActive = location.pathname === item.href
                          const badgeColor = getBadgeColor(item.label)
                          const animation = getIconAnimation(item.label, isActive)

                          return (
                            <motion.button
                              key={item.href}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleNavigation(item.href)}
                              className="w-full group"
                            >
                                <div
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-xl transition-all', // Reduced py
                                        isActive 
                                        ? 'bg-muted/80 dark:bg-white/10 border border-border/50 dark:border-white/10' 
                                        : 'hover:bg-muted/50 dark:hover:bg-white/5 border border-transparent',
                                    )}
                                >
                                    {/* Icon Container - Smaller */}
                                    <div
                                        className={`w-9 h-9 rounded-lg bg-gradient-to-br ${badgeColor} flex items-center justify-center flex-shrink-0 shadow-lg`}
                                    >
                                        <motion.div
                                            variants={{
                                                hover: animation.hover,
                                                initial: { rotate: 0, scale: 1, x: 0, y: 0 }
                                            }}
                                            initial="initial"
                                            whileHover="hover"
                                            transition={animation.transition} 
                                        >
                                            <item.icon 
                                                size={16} // Smaller icon
                                                className="text-white" 
                                                strokeWidth={2}
                                            />
                                        </motion.div>
                                    </div>

                                    <div className="flex flex-col items-start gap-0 flex-1 min-w-0">
                                        <span className={cn(
                                            "text-sm font-medium leading-none transition-colors truncate w-full text-left py-0.5",
                                            isActive ? "text-foreground dark:text-white font-bold" : "text-muted-foreground dark:text-white/70 group-hover:text-foreground dark:group-hover:text-white"
                                        )}>
                                            {item.label}
                                        </span>
                                        {item.subtext && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 dark:text-white/40 group-hover:text-muted-foreground dark:group-hover:text-white/60 transition-colors w-full text-left truncate">
                                                {item.subtext}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <span className="text-muted-foreground/40 dark:text-white/20 text-base group-hover:text-foreground/60 dark:group-hover:text-white/40 transition-colors">›</span>
                                </div>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-border/50 dark:border-white/10 bg-background/50 dark:bg-black/40 backdrop-blur-md space-y-3">
                      {activeRole.role_type === 'traveller' ? (
                        <Button
                          className="w-full bg-gradient-to-br from-violet-600 to-indigo-600 hover:scale-[1.02] active:scale-95 transition-all text-white border-0 h-auto py-2.5 flex flex-col items-center gap-0.5 rounded-xl shadow-lg shadow-indigo-500/20"
                          onClick={() => {
                            setIsOpen(false)
                            navigate('/partner/onboarding')
                          }}
                        >
                          <span className="font-black text-xs uppercase tracking-widest">
                            Become a Partner
                          </span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 h-9 rounded-xl border-border bg-white dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 text-foreground dark:text-white font-bold text-xs"
                          onClick={async () => {
                            setIsOpen(false)
                            try {
                              await switchRole('traveller')
                              navigate('/')
                            } catch (error) {
                              console.error('Failed to switch role', error)
                            }
                          }}
                        >
                          <LogOut className="h-4 w-4 rotate-180 text-muted-foreground dark:text-white/60" />
                          Switch to Traveler
                        </Button>
                      )}

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          className="w-full h-9 justify-center gap-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest border border-red-100 dark:border-red-500/20"
                          onClick={handleSignOut}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sign Out</span>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
