import { AlignJustify, Briefcase, LayoutDashboard, LogOut, MapPin, RefreshCcw, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ROLE_NAVIGATION } from '@/config/navigation'
import { hasCompletedTourOperatorSetup } from '@/features/tour-operator/utils/operatorAccess'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export function RoleBasedDrawer({ inverted = false }: { inverted?: boolean }) {
  const { user, activeRole, partnerType, signOut, initialized, switchRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [tourSetupCompleted, setTourSetupCompleted] = useState<boolean | null>(null)
  const [hasPublishedHotel, setHasPublishedHotel] = useState<boolean | null>(null)

  // Load partner completion status (used to disable listing actions).
  // Kept local to the drawer to avoid widening global auth state.
  // We treat "unknown" as incomplete to keep creation flows locked.
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user?.id || !activeRole?.role_type) return

      try {
        if (activeRole.role_type === 'tour_operator') {
          const { data, error } = await supabase
            .from('tour_operator_profiles')
            .select(
              'setup_completed, account_status, company_name, contact_person, phone_number, primary_city, categories, verification_documents',
            )
            .eq('user_id', user.id)
            .maybeSingle()

          if (error) throw error
          if (!cancelled) {
            setTourSetupCompleted(hasCompletedTourOperatorSetup(data, activeRole.verification_status))
          }
        } else {
          if (!cancelled) setTourSetupCompleted(null)
        }

        if (activeRole.role_type === 'hotel_manager') {
          const { count, error } = await supabase
            .from('hotels')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id)
            .eq('is_published', true)

          if (error) throw error
          if (!cancelled) setHasPublishedHotel((count ?? 0) > 0)
        } else {
          if (!cancelled) setHasPublishedHotel(null)
        }
      } catch (e) {
        console.error('[RoleBasedDrawer] Failed to load completion status', e)
        if (!cancelled) {
          setTourSetupCompleted(false)
          setHasPublishedHotel(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [activeRole?.role_type, user?.id])

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
      return { ...base, hover: { scale: 1.2 } }
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
  const navItems = ROLE_NAVIGATION[activeRole.role_type] || []

  const isTraveller = activeRole.role_type === 'traveller'

  const partnerDashboardAction = isTraveller && partnerType
    ? {
        label: partnerType === 'hotel_manager' ? 'Hotel Manager Dashboard' : 'Tour Operator Dashboard',
        icon: LayoutDashboard,
        onClick: async () => {
          setIsOpen(false)
          try {
            await switchRole(partnerType)
            navigate(partnerType === 'hotel_manager' ? '/manager/dashboard' : '/operator/dashboard')
          } catch (error) {
            console.error('Failed to open partner dashboard', error)
          }
        },
      }
    : null

  const switchToTravelerAction = !isTraveller
    ? {
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
    : null

  return (
    <>
      <button
        data-tour="profile-menu"
        aria-label={`${roleLabel} menu`}
        onClick={() => setIsOpen(true)}
        className={cn(
          'group shrink-0 rounded-full border p-1 pl-3 backdrop-blur-sm transition-shadow flex items-center gap-2',
          inverted
            ? 'border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]'
            : 'border-border bg-background/50 hover:shadow-md',
        )}
      >
        <AlignJustify className={cn('h-4 w-4 group-hover:text-primary', inverted ? 'text-white/72' : 'text-foreground')} />
        <Avatar className={cn('h-7 w-7 border', inverted ? 'border-white/10' : 'border-border')}>
          <AvatarImage src={user?.user_metadata?.avatar_url} alt="" />
          <AvatarFallback
            aria-hidden="true"
            className={cn(inverted ? 'bg-white/10 text-white/72' : 'bg-muted text-muted-foreground')}
          >
            {user?.email ? user.email.charAt(0).toUpperCase() : <MapPin className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Drawer Overlay + Panel — portalled to document.body to escape any parent stacking context
          (backdrop-filter / isolation:isolate on glass-liquid headers would otherwise trap z-index) */}
      {createPortal(
        <>
          {/* Drawer Overlay */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-[1400]"
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
            className="fixed right-3 top-3 z-[1401] h-[calc(100vh-1.5rem)] w-[min(320px,calc(100vw-1.5rem))] pointer-events-auto [@media(max-height:740px)]:right-2 [@media(max-height:740px)]:top-2 [@media(max-height:740px)]:h-[calc(100vh-1rem)] [@media(max-width:420px)]:w-[calc(100vw-1rem)]"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={spring}
              className={cn(
                'flex h-full flex-col overflow-hidden rounded-[32px] shadow-2xl',
                inverted
                  ? 'border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,29,0.98)_0%,rgba(12,18,35,0.96)_100%)] text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl'
                  : 'glass-card border border-border/60',
              )}
            >
              {/* Scrollable Content Area */}
              <div
                className="flex-1 overflow-y-auto no-scrollbar pb-3 [@media(max-height:740px)]:pb-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--border) transparent',
                }}
              >
                {/* Profile Header - Horizontal */}
                <div className="p-4 pb-0 [@media(max-height:820px)]:p-3 [@media(max-height:820px)]:pb-0">
                  <div className="flex justify-start">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                        inverted
                          ? 'bg-white/8 text-white hover:bg-white/12'
                          : 'bg-foreground/5 text-foreground hover:bg-foreground/10',
                      )}
                    >
                      <X size={16} />
                    </motion.button>
                  </div>

                  <div className="mt-3 mb-3 flex items-center gap-4 [@media(max-height:740px)]:mt-2.5 [@media(max-height:740px)]:mb-2.5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={spring}
                      className="w-12 h-12 rounded-[16px] flex-shrink-0 flex items-center justify-center shadow-lg p-[2px] bg-primary/15 border border-primary/30 [@media(max-height:740px)]:w-11 [@media(max-height:740px)]:h-11 [@media(max-height:740px)]:rounded-[14px]"
                    >
                      <div className={cn('w-full h-full overflow-hidden rounded-[16px] [@media(max-height:740px)]:rounded-[14px]', inverted ? 'bg-white/5' : 'bg-background')}>
                        <Avatar className="w-full h-full">
                          <AvatarImage
                            src={user.user_metadata?.avatar_url}
                            className="object-cover"
                          />
                          <AvatarFallback className={cn('text-xl font-black', inverted ? 'bg-white/10 text-white' : 'bg-muted text-foreground')}>
                            {user.user_metadata?.full_name?.charAt(0) ||
                              user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </motion.div>

                    <div className="flex min-w-0 flex-col pr-8">
                      <h3 className={cn('mb-0.5 truncate text-[13px] font-bold tracking-tight', inverted ? 'text-white' : 'text-foreground')}>
                        {user.user_metadata?.full_name?.split(' ')[0] ||
                          user.email?.split('@')[0] ||
                          'Traveler'}
                      </h3>
                      <p className={cn('mb-1.5 truncate text-[10px] [@media(max-height:820px)]:hidden', inverted ? 'text-white/55' : 'text-muted-foreground')}>
                        {user.email}
                      </p>

                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm',
                            inverted
                              ? 'border border-white/10 bg-white/8 text-white/72'
                              : 'border border-border bg-muted/50 text-muted-foreground'
                          )}
                        >
                          <MapPin className={cn('w-2.5 h-2.5', inverted ? 'text-white/55' : 'text-muted-foreground/70')} />
                          <span>{roleLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile score removed to keep menu clear at all zoom levels */}
                </div>

                {/* Navigation Items */}
                <div className="px-4 py-3 [@media(max-height:740px)]:px-3 [@media(max-height:740px)]:py-2.5">
                  <h3 className={cn('mb-2 pl-2 text-[9px] font-bold uppercase tracking-widest', inverted ? 'text-white/40' : 'text-muted-foreground/70')}>
                    Navigation
                  </h3>

                  <div className="space-y-1.5 [@media(max-height:740px)]:space-y-1">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.href
                      const animation = getIconAnimation(item.label, isActive)

                      const isTourCreateBlocked =
                        activeRole.role_type === 'tour_operator' &&
                        item.href === '/operator/tours/new' &&
                        tourSetupCompleted !== true

                      const isHotelPackagesBlocked =
                        activeRole.role_type === 'hotel_manager' &&
                        item.href === '/manager/list-package' &&
                        hasPublishedHotel !== true

                      const isBlocked = isTourCreateBlocked || isHotelPackagesBlocked
                      const blockedTarget = isTourCreateBlocked
                        ? '/operator/setup'
                        : isHotelPackagesBlocked
                          ? '/manager/list-hotel'
                          : item.href

                      return (
                        <motion.div
                          key={item.href}
                          whileHover={isBlocked ? undefined : { x: 4 }}
                          whileTap={isBlocked ? undefined : { scale: 0.98 }}
                          className="w-full"
                        >
                          <Link
                            to={blockedTarget}
                            onClick={() => setIsOpen(false)}
                            aria-disabled={isBlocked}
                            title={
                              isTourCreateBlocked
                                ? 'Complete Tour Operator Setup to create tours'
                                : isHotelPackagesBlocked
                                  ? 'Create a hotel listing before listing packages'
                                  : undefined
                            }
                            className="block w-full group"
                          >
                            <div
                              className={cn(
                                'flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all [@media(max-height:740px)]:py-1.5',
                                isActive
                                  ? inverted
                                    ? 'border border-white/10 bg-white/8'
                                    : 'bg-muted/80 border border-border/50'
                                  : inverted
                                    ? 'border border-transparent hover:bg-white/6'
                                    : 'hover:bg-muted/50 border border-transparent',
                                isBlocked && 'opacity-60'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border [@media(max-height:740px)]:w-8 [@media(max-height:740px)]:h-8',
                                  isActive
                                    ? 'bg-primary/15 border-primary/30 text-primary shadow-sm'
                                    : inverted
                                      ? 'bg-white/8 border-white/10 text-white/70'
                                      : 'bg-muted border-border text-muted-foreground'
                                )}
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
                                    className="text-current"
                                    strokeWidth={2}
                                  />
                                </motion.div>
                              </div>

                              <div className="flex flex-col items-start gap-0 flex-1 min-w-0">
                                <span
                                  className={cn(
                                    'text-sm font-medium leading-none transition-colors truncate w-full text-left py-0.5 [@media(max-height:740px)]:text-[13px]',
                                    isActive
                                      ? inverted
                                        ? 'font-bold text-white'
                                        : 'text-foreground font-bold'
                                      : inverted
                                        ? 'text-white/72 group-hover:text-white'
                                        : 'text-muted-foreground group-hover:text-foreground'
                                  )}
                                >
                                  {item.label}
                                </span>
                                {item.subtext && (
                                  <span className={cn('w-full truncate text-left text-[9px] font-bold uppercase tracking-wider transition-colors [@media(max-height:740px)]:hidden', inverted ? 'text-white/40 group-hover:text-white/60' : 'text-muted-foreground/60 group-hover:text-muted-foreground')}>
                                    {item.subtext}
                                  </span>
                                )}
                              </div>

                              <span className={cn('text-base transition-colors', inverted ? 'text-white/35 group-hover:text-white/65' : 'text-muted-foreground/40 group-hover:text-foreground/60')}>
                                ›
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}

                    {/* Partner dashboard shortcut (only for travellers with existing partner role) */}
                    {partnerDashboardAction && (
                      <div className={cn('pt-2 mt-2 border-t [@media(max-height:740px)]:pt-1.5 [@media(max-height:740px)]:mt-1.5', inverted ? 'border-white/10' : 'border-border/50')}>
                        <motion.button
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={partnerDashboardAction.onClick}
                          className="w-full group"
                        >
                          <div className={cn('flex items-center gap-3 px-3 py-1.5 rounded-xl border border-transparent transition-all [@media(max-height:740px)]:py-1.5', inverted ? 'hover:bg-white/6' : 'hover:bg-muted/50')}>
                            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <partnerDashboardAction.icon size={15} className="text-primary" strokeWidth={2} />
                            </div>
                            <span className={cn('flex-1 text-left text-sm font-medium transition-colors [@media(max-height:740px)]:text-[13px]', inverted ? 'text-white/72 group-hover:text-white' : 'text-muted-foreground group-hover:text-foreground')}>
                              {partnerDashboardAction.label}
                            </span>
                            <span className={cn('text-base transition-colors', inverted ? 'text-white/35 group-hover:text-white/65' : 'text-muted-foreground/40 group-hover:text-foreground/60')}>›</span>
                          </div>
                        </motion.button>
                      </div>
                    )}

                    {/* Become a Partner — always visible to travellers */}
                    {isTraveller && (
                      <div className={cn('[@media(max-height:740px)]:pt-1.5 [@media(max-height:740px)]:mt-1.5', !partnerDashboardAction && (inverted ? 'pt-2 mt-2 border-t border-white/10' : 'pt-2 mt-2 border-t border-border/50'))}>
                        <motion.button
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setIsOpen(false); navigate('/partner/onboarding') }}
                          data-tour="partner-switch"
                          className="w-full group"
                        >
                          <div className={cn('flex items-center gap-3 px-3 py-1.5 rounded-xl border border-transparent transition-all [@media(max-height:740px)]:py-1.5', inverted ? 'hover:bg-white/6' : 'hover:bg-muted/50')}>
                            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Briefcase size={15} className="text-primary" strokeWidth={2} />
                            </div>
                            <span className={cn('flex-1 text-left text-sm font-medium transition-colors [@media(max-height:740px)]:text-[13px]', inverted ? 'text-white/72 group-hover:text-white' : 'text-muted-foreground group-hover:text-foreground')}>
                              Become a Partner
                            </span>
                            <span className={cn('text-base transition-colors', inverted ? 'text-white/35 group-hover:text-white/65' : 'text-muted-foreground/40 group-hover:text-foreground/60')}>›</span>
                          </div>
                        </motion.button>
                      </div>
                    )}

                    {/* Switch to Traveler — for hotel/tour operator roles */}
                    {switchToTravelerAction && (
                      <div className={cn('pt-2 mt-2 border-t [@media(max-height:740px)]:pt-1.5 [@media(max-height:740px)]:mt-1.5', inverted ? 'border-white/10' : 'border-border/50')}>
                        <motion.button
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={switchToTravelerAction.onClick}
                          className="w-full group"
                        >
                          <div className={cn('flex items-center gap-3 px-3 py-1.5 rounded-xl border border-transparent transition-all [@media(max-height:740px)]:py-1.5', inverted ? 'hover:bg-white/6' : 'hover:bg-muted/50')}>
                            <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
                              <RefreshCcw size={15} className="text-muted-foreground" strokeWidth={2} />
                            </div>
                            <span className={cn('flex-1 text-left text-sm font-medium transition-colors [@media(max-height:740px)]:text-[13px]', inverted ? 'text-white/72 group-hover:text-white' : 'text-muted-foreground group-hover:text-foreground')}>
                              Switch to Traveler
                            </span>
                            <span className={cn('text-base transition-colors', inverted ? 'text-white/35 group-hover:text-white/65' : 'text-muted-foreground/40 group-hover:text-foreground/60')}>›</span>
                          </div>
                        </motion.button>
                      </div>
                    )}

                    {/* Sign out inside the menu so it's never out of view */}
                    <div className={cn('pt-2 mt-2 border-t [@media(max-height:740px)]:pt-1.5 [@media(max-height:740px)]:mt-1.5', inverted ? 'border-white/10' : 'border-border/50')}>
                      <motion.button
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSignOut}
                        className="w-full group"
                      >
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all hover:bg-destructive/10 border border-transparent">
                          <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0 border border-destructive/20">
                            <LogOut size={15} className="text-destructive" strokeWidth={2.2} />
                          </div>

                          <span className="text-sm font-bold flex-1 text-left transition-colors text-destructive">
                            Sign Out
                          </span>

                          <span className="text-destructive/60 text-base transition-colors">›</span>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </>,
        document.body
      )}
    </>
  )
}
