import {
  AlignJustify,
  Backpack,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AnimatedIcon } from '@/components/ui/AnimatedIcon'
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
        return 'from-blue-400 to-indigo-500'
      case 'tour_operator':
        return 'from-emerald-400 to-teal-500'
      case 'traveller':
        return 'from-amber-400 to-orange-500'
      default:
        return 'from-gray-400 to-slate-500'
    }
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
        className="flex items-center gap-2 border rounded-full p-1 pl-3 hover:shadow-md transition-shadow group shrink-0"
      >
        <AlignJustify className="w-4 h-4 text-foreground/80 group-hover:text-foreground" />
        <Avatar className="h-7 w-7">
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
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50"
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
            className="fixed right-4 top-4 bottom-4 w-[85vw] max-w-[360px] z-50"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={spring}
              className="h-full rounded-[40px] bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
              <div
                className="flex-1 overflow-y-auto no-scrollbar"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                }}
              >
                {/* Close Button - Top Left */}
                <div className="absolute top-6 left-6 z-10">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="text-white" size={16} />
                  </motion.button>
                </div>

                {/* Guest View */}
                {!user || !activeRole ? (
                  <div className="p-6 pt-20 h-full flex flex-col">
                    <div className="text-left mb-8">
                      <h2 className="text-3xl font-black bg-primary-gradient bg-clip-text text-transparent italic leading-tight mb-2">
                        TRIPAVAIL
                      </h2>
                      <p className="text-white/70 text-sm font-medium">
                        Sign in to manage your trips and preferences.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <Button
                        onClick={handleLogin}
                        className="w-full h-12 rounded-xl bg-primary-gradient text-white font-bold shadow-lg shadow-primary/20"
                      >
                        <LogIn className="mr-2 h-5 w-5" /> Log In / Sign Up
                      </Button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-transparent px-2 text-white/40 font-semibold">
                            Or continue as
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="h-20 rounded-2xl border-white/10 bg-white/5 flex flex-col gap-2 hover:bg-white/10 transition-all font-bold text-xs text-white"
                          onClick={() => {
                            setIsOpen(false)
                            navigate('/partner/onboarding')
                          }}
                        >
                          Partner
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 rounded-2xl border-white/10 bg-white/5 flex flex-col gap-2 hover:bg-white/10 transition-all font-bold text-xs text-white"
                          onClick={() => {
                            setIsOpen(false)
                            navigate('/partner/onboarding')
                          }}
                        >
                          Operator
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Logged In View */}
                    <div className="p-6 pb-4 bg-white/5">
                      <div className="flex flex-col items-center pt-8 mb-6">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={spring}
                          className={cn(
                            'w-24 h-24 rounded-[28px] bg-gradient-to-br flex items-center justify-center shadow-xl mb-4 p-[2px]',
                            roleGradient,
                          )}
                        >
                          <div className="w-full h-full rounded-[26px] overflow-hidden bg-black/50">
                            <Avatar className="w-full h-full">
                              <AvatarImage
                                src={user.user_metadata?.avatar_url}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-transparent text-white text-3xl font-black">
                                {user.user_metadata?.full_name?.charAt(0) ||
                                  user.email?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </motion.div>

                        <h3 className="font-black text-xl truncate text-white tracking-tight mb-1">
                          {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                        </h3>
                        <p className="text-xs text-white/50 truncate mb-3">{user.email}</p>

                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-white',
                          )}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{roleLabel}</span>
                        </div>
                      </div>

                      {/* Completion Bar */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60 px-1">
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
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
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
                    <div className="flex-1 px-4 py-4">
                      <nav className="flex flex-col gap-2">
                        {navItems.map((item) => {
                          const isActive = location.pathname === item.href
                          return (
                            <Button
                              key={item.href}
                              variant={isActive ? 'secondary' : 'ghost'}
                              className={cn(
                                'justify-start items-center gap-4 h-auto py-4 px-4 rounded-xl transition-all group relative overflow-hidden',
                                isActive
                                  ? 'bg-white/10 text-white font-bold border-l-4 border-white'
                                  : 'hover:bg-white/5 text-white/60 hover:text-white',
                              )}
                              onClick={() => handleNavigation(item.href)}
                            >
                              <AnimatedIcon
                                icon={item.icon}
                                className={cn(
                                  'mr-2 transition-colors',
                                  isActive ? 'text-white' : 'text-white/60 group-hover:text-white',
                                )}
                                isActive={isActive}
                              />
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="text-[15px] leading-none">{item.label}</span>
                                {item.subtext && (
                                  <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
                                    {item.subtext}
                                  </span>
                                )}
                              </div>
                            </Button>
                          )
                        })}
                      </nav>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-md space-y-4">
                      {activeRole.role_type === 'traveller' ? (
                        <Button
                          className="w-full bg-gradient-to-br from-violet-600 to-purple-600 hover:scale-[1.02] active:scale-95 transition-all text-white border-0 h-auto py-4 flex flex-col items-center gap-0.5 rounded-2xl shadow-xl shadow-purple-500/20"
                          onClick={() => {
                            setIsOpen(false)
                            navigate('/partner/onboarding')
                          }}
                        >
                          <span className="font-black text-base uppercase tracking-widest">
                            Become a Partner
                          </span>
                          <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                            Join TripAvail
                          </span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold"
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
                          <LogOut className="h-5 w-5 rotate-180 text-white" />
                          Switch to Traveler
                        </Button>
                      )}

                      <div className="flex flex-col gap-4">
                        <Button
                          variant="ghost"
                          className="w-full h-12 justify-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-black uppercase tracking-widest border border-red-500/20"
                          onClick={handleSignOut}
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Sign Out</span>
                        </Button>

                        <div className="flex justify-center items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 pt-2">
                          <span>v1.2.0 • MADE WITH</span>
                          <Heart className="w-3 h-3 fill-primary text-primary" />
                        </div>
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
