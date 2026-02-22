import { AlignJustify, Briefcase, LogOut, MapPin, RefreshCcw, X } from 'lucide-react'
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
      case 'admin':
        return 'Administrator'
      case 'traveller':
      default:
        return 'Traveler'
    }
  }

  const getRoleBadgeGradient = (role: string) => {
    switch (role) {
      case 'hotel_manager':
        return 'from-blue-500 to-indigo-600'
      case 'tour_operator':
        return 'from-emerald-500 to-teal-600'
      case 'admin':
        return 'from-red-500 to-rose-600'
      case 'traveller':
        return 'from-primary to-primary/80'
      default:
        return 'from-gray-500 to-slate-600'
    }
  }

  // Helper to get gradient color based on label (Image 2 Style)
  const getBadgeColor = (label: string): string => {
    const l = label.toLowerCase()
    if (l.includes('dashboard')) return 'from-blue-500 to-indigo-600'
    if (l.includes('profile')) return 'from-purple-500 to-violet-600'
    if (l.includes('trip') || l.includes('tour')) return 'from-cyan-400 to-blue-500'
    if (l.includes('wishlist')) return 'from-pink-500 to-rose-500'
    if (l.includes('payment') || l.includes('wallet')) return 'from-emerald-400 to-teal-500'
    if (l.includes('booking')) return 'from-emerald-500 to-teal-600'
    if (l.includes('setting')) return 'from-gray-500 to-slate-600'
    if (l.includes('help')) return 'from-amber-500 to-orange-600'
    if (l.includes('legal') || l.includes('policy')) return 'from-slate-500 to-gray-600'
    if (l.includes('list')) return 'from-indigo-500 to-purple-600'
    if (l.includes('verification')) return 'from-rose-500 to-red-600'
    if (l.includes('calendar')) return 'from-orange-400 to-amber-500'

    return 'from-blue-500 to-indigo-600' // Default
  }

  // Custom Icon Animation Logic
  const getIconAnimation = (label: string, isActive: boolean) => {
    const base = {
      scale: isActive ? 1.1 : 1,
    }
    const l = label.toLowerCase()

    if (l.includes('dashboard')) {
      return {
        ...base,
        hover: {
          rotate: 360,
          transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
        },
      }
    }
    if (l.includes('trip') || l.includes('tour') || l.includes('propert')) {
      return {
        ...base,
        hover: { x: 3, y: -3, transition: { type: 'spring' as const, stiffness: 300 } },
      }
    }
    if (l.includes('profile')) {
      return {
        ...base,
        hover: { scale: 1.2, transition: { type: 'spring' as const, stiffness: 400 } },
      }
    }
    if (l.includes('wishlist') || l.includes('heart')) {
      return { ...base, hover: { scale: 1.2, color: '#f472b6' } }
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

  if (!user || !activeRole) return null

  const roleLabel = getRoleLabel(activeRole.role_type)
  const roleGradient = getRoleBadgeGradient(activeRole.role_type)
  const navItems = ROLE_NAVIGATION[activeRole.role_type] || []

  const roleAction =
    activeRole.role_type === 'traveller'
      ? {
          label: 'Become a Partner',
          icon: Briefcase,
          onClick: () => {
            setIsOpen(false)
            navigate('/partner/onboarding')
          },
        }
      : {
          label: 'Switch to Traveler',
          icon: RefreshCcw,
          onClick: async () => {
            setIsOpen(false)
            try {
              await switchRole('traveller')
              navigate('/')
            } catch (error) {
              console.error('Failed to switch role', error)
            }
          },
        }

  return (
    <>
      <button
        data-tour="profile-menu"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-border bg-background/50 backdrop-blur-sm rounded-full p-1 pl-3 hover:shadow-md transition-shadow group shrink-0"
      >
        <AlignJustify className="w-4 h-4 text-foreground group-hover:text-primary" />
        <Avatar className="h-7 w-7 border border-border">
          <AvatarImage src={user?.user_metadata?.avatar_url} alt="Traveler" />
          <AvatarFallback aria-label="Traveler" className="bg-muted text-muted-foreground">
            {user?.email ? user.email.charAt(0).toUpperCase() : <MapPin className="h-4 w-4" />}
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
              {/* Scrollable Content Area */}
              <div
                className="flex-1 overflow-y-auto no-scrollbar pb-3 [@media(max-height:740px)]:pb-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--border) transparent',
                }}
              >
                {/* Close Button - Top Left */}
                <div className="absolute top-5 left-5 z-20 [@media(max-height:740px)]:top-4 [@media(max-height:740px)]:left-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors text-foreground dark:text-white"
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                {/* Profile Header - Horizontal */}
                <div className="p-4 pb-0 [@media(max-height:740px)]:p-3 [@media(max-height:740px)]:pb-0">
                  <div className="flex items-center gap-4 mt-7 mb-3 [@media(max-height:740px)]:mt-6 [@media(max-height:740px)]:mb-2.5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={spring}
                      className={cn(
                        'w-14 h-14 rounded-[18px] flex-shrink-0 bg-gradient-to-br flex items-center justify-center shadow-lg p-[2px] [@media(max-height:740px)]:w-12 [@media(max-height:740px)]:h-12 [@media(max-height:740px)]:rounded-[16px]',
                        roleGradient
                      )}
                    >
                      <div className="w-full h-full rounded-[16px] overflow-hidden bg-background [@media(max-height:740px)]:rounded-[14px]">
                        <Avatar className="w-full h-full">
                          <AvatarImage
                            src={user.user_metadata?.avatar_url}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-muted text-foreground text-xl font-black">
                            {user.user_metadata?.full_name?.charAt(0) ||
                              user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </motion.div>

                    <div className="flex flex-col min-w-0 pr-8">
                      <h3 className="font-bold text-base truncate text-foreground tracking-tight mb-0.5 [@media(max-height:740px)]:text-[13px]">
                        {user.user_metadata?.full_name?.split(' ')[0] ||
                          user.email?.split('@')[0] ||
                          'Traveler'}
                      </h3>
                      <p className="text-[10px] text-muted-foreground truncate mb-1.5">
                        {user.email}
                      </p>

                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border text-[9px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm'
                          )}
                        >
                          <MapPin className="w-2.5 h-2.5 text-muted-foreground/70 dark:text-white/70" />
                          <span>{roleLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Completion Bar - Compact */}
                  <div className="space-y-1.5 p-2.5 rounded-2xl bg-muted/30 border border-border shadow-sm [@media(max-height:740px)]:hidden">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">
                      <span>Profile Score</span>
                      <span
                        className={cn(
                          'bg-clip-text text-transparent bg-gradient-to-r',
                          roleGradient
                        )}
                      >
                        40%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full bg-gradient-to-r', roleGradient)}
                        initial={{ width: 0 }}
                        animate={{ width: '40%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="px-4 py-3 [@media(max-height:740px)]:px-3 [@media(max-height:740px)]:py-2.5">
                  <h3 className="text-muted-foreground/70 text-[9px] font-bold uppercase tracking-widest mb-2 pl-2">
                    Navigation
                  </h3>

                  <div className="space-y-1.5 [@media(max-height:740px)]:space-y-1">
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
                              'flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all [@media(max-height:740px)]:py-1.5',
                              isActive
                                ? 'bg-muted/80 border border-border/50'
                                : 'hover:bg-muted/50 border border-transparent'
                            )}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${badgeColor} flex items-center justify-center flex-shrink-0 shadow-lg [@media(max-height:740px)]:w-8 [@media(max-height:740px)]:h-8`}
                            >
                              <motion.div
                                variants={{
                                  hover: animation.hover,
                                  initial: { rotate: 0, scale: 1, x: 0, y: 0 },
                                }}
                                initial="initial"
                                whileHover="hover"
                              >
                                <item.icon
                                  size={15}
                                  className="text-primary-foreground"
                                  strokeWidth={2}
                                />
                              </motion.div>
                            </div>

                            <div className="flex flex-col items-start gap-0 flex-1 min-w-0">
                              <span
                                className={cn(
                                  'text-sm font-medium leading-none transition-colors truncate w-full text-left py-0.5 [@media(max-height:740px)]:text-[13px]',
                                  isActive
                                    ? 'text-foreground font-bold'
                                    : 'text-muted-foreground group-hover:text-foreground'
                                )}
                              >
                                {item.label}
                              </span>
                              {item.subtext && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 group-hover:text-muted-foreground transition-colors w-full text-left truncate [@media(max-height:740px)]:hidden">
                                  {item.subtext}
                                </span>
                              )}
                            </div>

                            <span className="text-muted-foreground/40 text-base group-hover:text-foreground/60 transition-colors">
                              ›
                            </span>
                          </div>
                        </motion.button>
                      )
                    })}

                    {/* Role action moved into menu to keep it always visible */}
                    <div className="pt-2 mt-2 border-t border-border/50 [@media(max-height:740px)]:pt-1.5 [@media(max-height:740px)]:mt-1.5">
                      <motion.button
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={roleAction.onClick}
                        data-tour={activeRole.role_type === 'traveller' ? 'partner-switch' : undefined}
                        className="w-full group"
                      >
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all hover:bg-muted/50 border border-transparent [@media(max-height:740px)]:py-1.5">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg [@media(max-height:740px)]:w-8 [@media(max-height:740px)]:h-8',
                              activeRole.role_type === 'traveller'
                                ? 'from-violet-600 to-indigo-600'
                                : 'from-slate-500 to-gray-600'
                            )}
                          >
                            <roleAction.icon size={15} className="text-primary-foreground" strokeWidth={2} />
                          </div>

                          <span className="text-sm font-medium flex-1 text-left transition-colors text-muted-foreground group-hover:text-foreground [@media(max-height:740px)]:text-[13px]">
                            {roleAction.label}
                          </span>

                          <span className="text-muted-foreground/40 text-base group-hover:text-foreground/60 transition-colors">
                            ›
                          </span>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions - Pinned to bottom */}
              <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md shrink-0 [@media(max-height:740px)]:p-3">
                <Button
                  variant="ghost"
                  className="w-full h-9 justify-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest border border-destructive/20"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
