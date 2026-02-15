import {
  Briefcase,
  Building2,
  Crown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
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

  // Custom icon animation logic for each menu item
  const getIconAnimation = (label: string) => {
    switch (label) {
      case 'Dashboard':
        return {
          hover: { rotate: 360 },
          transition: { duration: 0.6 },
        }
      case 'Profile':
      case 'My Profile':
        return {
          hover: { scale: [1, 1.2, 1] },
          transition: { duration: 0.5 },
        }
      case 'My Trips':
      case 'My Tours':
        return {
          hover: { x: [0, 50, 0], y: [0, -15, 0] },
          transition: { duration: 0.8, ease: 'easeInOut' as const },
        }
      case 'Wishlist':
        return {
          hover: { scale: [1, 1.3, 1] },
          transition: { duration: 0.5 },
        }
      case 'Payment Methods':
      case 'Bookings':
        return {
          hover: { rotateY: 180 },
          transition: { duration: 0.5 },
        }
      case 'Account Settings':
      case 'Explore Stays':
      case 'My Properties':
        return {
          hover: { rotate: 360 },
          transition: { duration: 1, ease: 'linear' as const },
        }
      default:
        return {}
    }
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
        return 'from-blue-400 to-indigo-500'
      case 'tour_operator':
        return 'from-emerald-400 to-teal-500'
      case 'traveller':
        return 'from-amber-400 to-orange-500'
      default:
        return 'from-gray-400 to-slate-500'
    }
  }

  // Define menu items based on role
  const getMenuItems = () => {
    if (activeRole?.role_type === 'traveller') {
      return [
        {
          icon: Search,
          label: 'Explore Stays',
          path: '/search',
          color: 'from-blue-500 to-indigo-600',
        },
        { icon: MapPin, label: 'My Trips', path: '/trips', color: 'from-cyan-500 to-blue-600' },
        {
          icon: UserCircle,
          label: 'Profile',
          path: '/profile',
          color: 'from-purple-500 to-violet-600',
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
        { icon: MapPin, label: 'My Tours', path: '/tours', color: 'from-pink-500 to-rose-600' },
        {
          icon: Briefcase,
          label: 'Bookings',
          path: '/bookings',
          color: 'from-emerald-500 to-teal-600',
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
      {/* Menu Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={spring}
        onClick={() => setIsDrawerOpen(true)}
        className="fixed top-4 left-4 z-40 w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50"
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
            className="fixed left-4 top-4 bottom-4 w-[85vw] max-w-[360px] z-50"
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
                {/* Header */}
                <div className="relative p-6">
                  {/* User Role Badge - Top Left */}
                  <div className="absolute top-6 left-6">
                    <div
                      className={cn(
                        'px-3 py-1.5 rounded-full shadow-lg bg-gradient-to-r',
                        roleGradient,
                      )}
                    >
                      <span className="text-white font-bold text-[10px] flex items-center gap-1 uppercase tracking-wider">
                        <Crown size={12} strokeWidth={3} />
                        {roleLabel}
                      </span>
                    </div>
                  </div>

                  {/* Close Button - Top Right */}
                  <div className="absolute top-6 right-6">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <X className="text-white" size={16} />
                    </motion.button>
                  </div>

                  {/* Profile Avatar - Centered */}
                  <div className="flex flex-col items-center mt-12 block">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={spring}
                      className={cn(
                        'w-24 h-24 rounded-[28px] flex items-center justify-center shadow-xl mb-4 bg-gradient-to-br',
                        roleGradient,
                      )}
                    >
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-[28px] border-2 border-white/20"
                        />
                      ) : (
                        <UserCircle className="text-white" size={48} strokeWidth={2} />
                      )}
                    </motion.div>

                    <h2 className="text-white text-xl font-bold mb-1 truncate max-w-full px-4">
                      {user?.user_metadata?.full_name || 'User'}
                    </h2>
                    <p className="text-white/50 text-sm truncate max-w-full px-4">{user?.email}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pb-6">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-xs">Profile Completion</span>
                      <span
                        className={cn(
                          'text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r',
                          roleGradient,
                        )}
                      >
                        40%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '40%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn('h-full rounded-full bg-gradient-to-r', roleGradient)}
                      />
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="px-6 pb-6">
                  <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-3">
                    Menu
                  </h3>

                  <div className="space-y-1.5">
                    {menuItems.map((item) => {
                      const iconAnimation = getIconAnimation(item.label)
                      const isActive = location.pathname === item.path

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
                              'flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors',
                              isActive ? 'bg-white/10 border border-white/5' : 'hover:bg-white/5',
                            )}
                          >
                            {/* Icon with Gradient Background */}
                            <div
                              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md flex-shrink-0`}
                            >
                              <motion.div
                                whileHover={iconAnimation.hover}
                                transition={iconAnimation.transition}
                              >
                                <item.icon
                                  className="text-white"
                                  size={20}
                                  strokeWidth={2.5}
                                  fill={item.label === 'Wishlist' ? 'currentColor' : 'none'}
                                />
                              </motion.div>
                            </div>

                            {/* Label */}
                            <span
                              className={cn(
                                'text-white text-sm font-medium flex-1 text-left',
                                isActive && 'font-bold',
                              )}
                            >
                              {item.label}
                            </span>

                            {/* Arrow */}
                            <span className="text-white/30 text-lg">›</span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Help & Support */}
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-1.5 group"
                  >
                    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <HelpCircle className="text-white" size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-medium">Help & Support</p>
                        <p className="text-white/40 text-[10px]">24/7 Concierge</p>
                      </div>
                      <span className="text-white/30 text-lg">›</span>
                    </div>
                  </motion.button>

                  {/* Become a Partner - Premium Card */}
                  {activeRole?.role_type === 'traveller' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavigation('/partner/onboarding')}
                      className="w-full mt-4"
                    >
                      <div className="relative rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 p-4 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
                        <div className="relative flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="text-white" size={20} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white text-sm font-bold">Become a Partner</p>
                            <p className="text-white/80 text-[10px]">Grow your business</p>
                          </div>
                          <span className="text-white text-lg">›</span>
                        </div>
                      </div>
                    </motion.button>
                  )}

                  <div className="h-6" />
                </div>
              </div>

              {/* Footer / Sign Out */}
              <div className="p-6 pt-0 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full mt-6"
                >
                  <div className="rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 p-3 transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <LogOut className="text-red-400" size={16} strokeWidth={2.5} />
                      <span className="text-red-400 text-sm font-medium">Sign Out</span>
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
