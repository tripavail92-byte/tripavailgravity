import { AlignJustify, ChevronRight, LogOut, MapPin, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ROLE_NAVIGATION } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

/**
 * RoleBasedDrawer Component
 * 
 * A highly responsive, compact drawer for user profile and navigation.
 * Designed to fit perfectly even on small mobile devices by using:
 * - Ultra-compact header and footer
 * - Scrollable navigation area
 * - Dynamic viewport sizing
 * - High z-index to avoid overlap issues
 */
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

  const spring = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  }

  if (!initialized) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
      </Button>
    )
  }

  if (!user || !activeRole) return null

  const roleLabel = activeRole.role_type === 'hotel_manager' ? 'Hotel Manager'
    : activeRole.role_type === 'tour_operator' ? 'Tour Operator'
      : 'Traveler'

  const roleGradient = activeRole.role_type === 'hotel_manager' ? 'from-blue-600 to-indigo-600'
    : activeRole.role_type === 'tour_operator' ? 'from-fuchsia-600 to-purple-600'
      : 'from-amber-600 to-orange-600'

  const navItems = ROLE_NAVIGATION[activeRole.role_type] || []

  const getBadgeColor = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('dashboard')) return 'from-blue-500 to-indigo-500'
    if (l.includes('hotel') || l.includes('list')) return 'from-violet-500 to-purple-500'
    if (l.includes('package')) return 'from-purple-500 to-fuchsia-500'
    if (l.includes('calendar')) return 'from-orange-500 to-amber-500'
    if (l.includes('booking')) return 'from-teal-500 to-emerald-500'
    if (l.includes('verification')) return 'from-rose-500 to-red-500'
    if (l.includes('setting')) return 'from-slate-500 to-gray-500'
    if (l.includes('support')) return 'from-orange-500 to-red-500'
    if (l.includes('legal')) return 'from-slate-600 to-zinc-600'
    return 'from-blue-500 to-indigo-500'
  }

  return (
    <>
      {/* Profile Toggle Button */}
      <button
        data-tour="profile-menu"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-border bg-background/50 backdrop-blur-sm rounded-full p-1 pl-3 hover:shadow-md transition-shadow group shrink-0"
      >
        <AlignJustify className="w-4 h-4 text-foreground group-hover:text-primary" />
        <Avatar className="h-7 w-7 border border-border">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer Container - Premium Floating Card */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={spring}
              className="fixed right-2 top-2 bottom-2 w-[85vw] max-w-[280px] z-[100]"
            >
              <div className="h-full rounded-[24px] glass-card dark:glass-card-dark shadow-2xl overflow-hidden flex flex-col border border-white/10">
                {/* Profile Header - Professional Spacing (Zero-Scroll Focus) */}
                <div className="relative shrink-0 pt-11 px-4 pb-3">
                  {/* Close Button - Corrected Size & Position */}
                  <div className="absolute top-3 left-3 z-20">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-foreground hover:bg-black/10 transition-colors"
                      aria-label="Close menu"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-2xl bg-gradient-to-br p-[2px] shadow-sm', roleGradient)}>
                      <div className="w-full h-full rounded-[14px] overflow-hidden bg-background">
                        <Avatar className="w-full h-full">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="text-xs font-black uppercase">
                            {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <h3 className="font-black text-xs truncate leading-none mb-1">
                        {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                      </h3>
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/50 border border-border text-[8px] font-bold uppercase tracking-wider text-muted-foreground w-fit">
                        <MapPin className="w-2 h-2" />
                        <span>{roleLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Items Area - Flexible (No Scroll) */}
                <div className="flex-1 min-h-0 px-2 flex flex-col justify-center">
                  <div className="space-y-0.5">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.href
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavigation(item.href)}
                          className="w-full group focus:outline-none"
                        >
                          <div className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all border',
                            isActive ? 'bg-muted/60 border-border/50 shadow-sm' : 'hover:bg-muted/30 border-transparent'
                          )}>
                            <div className={cn(
                              'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm',
                              getBadgeColor(item.label)
                            )}>
                              <item.icon size={14} className="text-white" />
                            </div>
                            <span className={cn(
                              'text-[11px] font-bold truncate w-full text-left leading-tight',
                              isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            )}>
                              {item.label}
                            </span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Footer Actions - Standardized (No Scroll Focus) */}
                <div className="shrink-0 p-3 border-t border-border/20 bg-background/90 backdrop-blur-xl space-y-2">
                  {activeRole.role_type === 'traveller' ? (
                    <Button
                      data-tour="partner-switch"
                      className="w-full h-9 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 active:scale-95 transition-all text-white rounded-xl shadow-lg border-0"
                      onClick={() => {
                        setIsOpen(false)
                        navigate('/partner/onboarding')
                      }}
                    >
                      <span className="font-black text-[9px] uppercase tracking-widest">Become a Partner</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-8 justify-start gap-2 rounded-lg border-border/40 text-[9px] font-black uppercase tracking-wider"
                      onClick={async () => {
                        setIsOpen(false)
                        try {
                          await switchRole('traveller')
                          navigate('/')
                        } catch (error) {
                          console.error('Role switch failed:', error)
                        }
                      }}
                    >
                      <LogOut className="h-3 w-3 rotate-180" />
                      Switch to Traveler
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full h-8 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em]"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-3 w-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
