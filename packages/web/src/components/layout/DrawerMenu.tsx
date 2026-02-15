import {
  Briefcase,
  Building2,
  CreditCard,
  Crown,
  Heart,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  UserCircle,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function DrawerMenu() {
  const { user, activeRole, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsDrawerOpen(false)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
    setIsDrawerOpen(false)
  }

  // iOS-style elastic spring animation configuration
  const spring = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  }

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

  // Custom Icon Animation Logic (Specific per item)
  const getIconAnimation = (label: string, isActive: boolean) => {
    const base = {
      scale: isActive ? 1.1 : 1,
    }

    switch (label) {
      case 'Dashboard':
        return {
          ...base,
          hover: { rotate: 360, transition: { duration: 0.6, ease: 'easeInOut' } },
        }
      case 'My Trips':
      case 'My Tours':
      case 'My Properties':
        return {
          ...base,
          hover: { x: 3, y: -3, transition: { type: 'spring', stiffness: 300 } },
        }
      case 'Profile':
      case 'My Profile':
        return {
          ...base,
          hover: { scale: 1.2, transition: { type: 'spring', stiffness: 400 } },
        }
      case 'Wishlist':
        return {
          ...base,
          hover: { scale: 1.2, color: '#f472b6' }, // pink-400
        }
      case 'Payment Methods':
        return {
          ...base,
          hover: { rotateY: 180, transition: { duration: 0.4 } },
        }
      case 'Settings':
        return {
          ...base,
          hover: { rotate: 90 },
        }
      default:
        return {
          ...base,
          hover: { scale: 1.15, rotate: 5 },
        }
    }
  }

  // Define menu items based on role
  const getMenuItems = () => {
    if (activeRole?.role_type === 'traveller') {
      return [
        {
          icon: Search,
          label: 'Explore',
          path: '/search',
          color: 'from-blue-500 to-indigo-600',
        },
        {
          icon: MapPin,
          label: 'My Trips',
          path: '/trips',
          color: 'from-cyan-400 to-blue-500',
        },
        {
          icon: UserCircle,
          label: 'My Profile',
          path: '/profile',
          color: 'from-purple-500 to-violet-600',
        },
        {
          icon: Heart,
          label: 'Wishlist',
          path: '/wishlist',
          color: 'from-pink-500 to-rose-500',
        },
        {
          icon: CreditCard,
          label: 'Payment Methods',
          path: '/payments',
          color: 'from-emerald-400 to-teal-500',
        },
      ]
    }
    if (activeRole?.role_type === 'hotel_manager') {
      return [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          color: 'from-blue-500 to-indigo-600',
        },
        {
          icon: Building2,
          label: 'My Properties',
          path: '/properties',
          color: 'from-purple-500 to-violet-600',
        },
        {
          icon: Briefcase,
          label: 'Bookings',
          path: '/bookings',
          color: 'from-emerald-500 to-teal-600',
        },
        {
          icon: Settings,
          label: 'Settings',
          path: '/settings',
          color: 'from-gray-500 to-slate-600',
        },
      ]
    }
    if (activeRole?.role_type === 'tour_operator') {
      return [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          color: 'from-blue-500 to-indigo-600',
        },
        {
          icon: MapPin,
          label: 'My Tours',
          path: '/tours',
          color: 'from-pink-500 to-rose-600',
        },
        {
          icon: Briefcase,
          label: 'Bookings',
          path: '/bookings',
          color: 'from-emerald-500 to-teal-600',
        },
        {
          icon: Settings,
          label: 'Settings',
          path: '/settings',
          color: 'from-gray-500 to-slate-600',
        },
      ]
    }
    return []
  }

  if (!user && !activeRole) return null

  const menuItems = getMenuItems()
  const roleLabel = getRoleLabel(activeRole?.role_type || '')
  const roleGradient = getRoleBadgeGradient(activeRole?.role_type || '')

  return (
    <div className="relative md:hidden">
      {/* Menu Button - Dark Style */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={spring}
        onClick={() => setIsDrawerOpen(true)}
        className="fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center shadow-lg shadow-black/20 border border-white/10"
      >
        <Menu className="text-white" size={20} />
      </motion.button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer Menu */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={spring}
            className="fixed left-4 top-4 bottom-4 w-[85vw] max-w-[320px] z-50"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={spring}
              className="h-full rounded-[32px] bg-gradient-to-b from-gray-900 to-black border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
              <div
                className="flex-1 overflow-y-auto no-scrollbar"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.1) transparent',
                }}
              >
                {/* Header - Compact */}
                <div className="relative p-6 pb-2">
                  {/* Close Button - Top Right */}
                  <div className="absolute top-5 right-5 z-20">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <X className="text-white" size={16} />
                    </motion.button>
                  </div>

                  {/* Profile Avatar - Compact Card Style */}
                  <div className="flex flex-col items-center mt-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={spring}
                      className={cn(
                        'w-20 h-20 rounded-[24px] flex items-center justify-center shadow-lg mb-3 bg-gradient-to-br p-[2px]',
                        roleGradient,
                      )}
                    >
                      <div className="w-full h-full rounded-[22px] overflow-hidden bg-black">
                        {user?.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <UserCircle className="text-white/40" size={40} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                    </motion.div>

                    <h2 className="text-white text-lg font-bold mb-0.5 truncate max-w-full px-4">
                      {user?.user_metadata?.full_name || 'User'}
                    </h2>
                    <p className="text-white/50 text-xs truncate max-w-full px-4 mb-3">
                      {user?.email}
                    </p>

                    <div
                      className={cn(
                        'px-2.5 py-1 rounded-full bg-white/10 border border-white/10 shadow-sm flex items-center gap-1.5',
                      )}
                    >
                      <Crown size={10} className="text-amber-400" fill="currentColor" />
                      <span className="text-white/90 font-bold text-[10px] uppercase tracking-wider">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar - Compact */}
                <div className="px-5 py-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white/40 font-bold uppercase tracking-wider">
                        Profile Score
                      </span>
                      <span
                        className={cn(
                          'font-bold',
                          activeRole.role_type === 'traveller' ? 'text-amber-400' : 'text-blue-400',
                        )}
                      >
                        40%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '40%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn('h-full rounded-full bg-gradient-to-r', roleGradient)}
                      />
                    </div>
                  </div>
                </div>

                {/* Menu Items - Compact & Colorful Squares */}
                <div className="px-4 pb-6">
                  <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3 pl-2">
                    Menu
                  </h3>

                  <div className="space-y-2">
                    {menuItems.map((item) => {
                      const isActive = location.pathname === item.path
                      const animation = getIconAnimation(item.label, isActive)

                      return (
                        <motion.button
                          key={item.label}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleNavigation(item.path)}
                          className="w-full group"
                        >
                          <div
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all',
                              isActive
                                ? 'bg-white/10 border border-white/10'
                                : 'hover:bg-white/5 border border-transparent',
                            )}
                          >
                            {/* Colorful Icon Container */}
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                            >
                              <motion.div
                                variants={{
                                  hover: animation.hover,
                                  initial: { rotate: 0, scale: 1, x: 0, y: 0 },
                                }}
                                initial="initial"
                                whileHover="hover"
                                transition={animation.transition}
                              >
                                <item.icon size={20} className="text-white" strokeWidth={2} />
                              </motion.div>
                            </div>

                            {/* Label */}
                            <span
                              className={cn(
                                'text-sm font-medium flex-1 text-left transition-colors',
                                isActive
                                  ? 'text-white font-bold'
                                  : 'text-white/70 group-hover:text-white',
                              )}
                            >
                              {item.label}
                            </span>

                            {/* Arrow */}
                            <span className="text-white/20 text-lg group-hover:text-white/40 transition-colors">
                              ›
                            </span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Help & Support */}
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-2 group"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/5 border border-transparent transition-all">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0 border border-white/5">
                        <motion.div whileHover={{ scale: 1.1, rotate: 10 }}>
                          <HelpCircle className="text-white/80" size={20} />
                        </motion.div>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">
                          Help & Support
                        </p>
                      </div>
                      <span className="text-white/20 text-lg group-hover:text-white/40 transition-colors">
                        ›
                      </span>
                    </div>
                  </motion.button>

                  {/* Become a Partner - Compact Premium */}
                  {activeRole?.role_type === 'traveller' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavigation('/partner/onboarding')}
                      className="w-full mt-5"
                    >
                      <div className="relative rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-3 overflow-hidden shadow-lg shadow-indigo-500/20 border border-white/10">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="relative flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="text-white" size={18} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white text-xs font-bold uppercase tracking-wide">
                              Become a Partner
                            </p>
                            <p className="text-white/60 text-[10px]">Grow with TripAvail</p>
                          </div>
                          <span className="text-white/80 text-lg">›</span>
                        </div>
                      </div>
                    </motion.button>
                  )}

                  <div className="h-6" />
                </div>
              </div>

              {/* Footer / Sign Out */}
              <div className="p-4 pt-0 border-t border-white/10 bg-black/40 backdrop-blur-md">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full mt-4"
                >
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 p-3 transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <LogOut className="text-red-400" size={16} strokeWidth={2.5} />
                      <span className="text-red-400 text-xs font-bold uppercase tracking-wider">
                        Sign Out
                      </span>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
