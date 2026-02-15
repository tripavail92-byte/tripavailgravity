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

import { AnimatedIcon } from '@/components/ui/AnimatedIcon'
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

  // Define menu items based on role
  const getMenuItems = () => {
    if (activeRole?.role_type === 'traveller') {
      return [
        {
          icon: Search,
          label: 'Explore Stays',
          path: '/search',
          color: 'from-blue-100 to-indigo-100',
          iconColor: 'text-blue-600',
        },
        {
          icon: MapPin,
          label: 'My Trips',
          path: '/trips',
          color: 'from-cyan-100 to-blue-100',
          iconColor: 'text-cyan-600',
        },
        {
          icon: UserCircle,
          label: 'Profile',
          path: '/profile',
          color: 'from-purple-100 to-violet-100',
          iconColor: 'text-purple-600',
        },
      ]
    }
    if (activeRole?.role_type === 'hotel_manager') {
      return [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          color: 'from-blue-100 to-indigo-100',
          iconColor: 'text-blue-600',
        },
        {
          icon: Building2,
          label: 'My Properties',
          path: '/properties',
          color: 'from-purple-100 to-violet-100',
          iconColor: 'text-purple-600',
        },
        {
          icon: Briefcase,
          label: 'Bookings',
          path: '/bookings',
          color: 'from-emerald-100 to-teal-100',
          iconColor: 'text-emerald-600',
        },
      ]
    }
    if (activeRole?.role_type === 'tour_operator') {
      return [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard',
          color: 'from-blue-100 to-indigo-100',
          iconColor: 'text-blue-600',
        },
        {
          icon: MapPin,
          label: 'My Tours',
          path: '/tours',
          color: 'from-pink-100 to-rose-100',
          iconColor: 'text-pink-600',
        },
        {
          icon: Briefcase,
          label: 'Bookings',
          path: '/bookings',
          color: 'from-emerald-100 to-teal-100',
          iconColor: 'text-emerald-600',
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
        className="fixed top-4 left-4 z-40 w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/5 border border-gray-100"
      >
        <Menu className="text-gray-900" size={20} />
      </motion.button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
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
              className="h-full rounded-[40px] bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
            >
              <div
                className="flex-1 overflow-y-auto no-scrollbar"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(0,0,0,0.1) transparent',
                }}
              >
                {/* Header */}
                <div className="relative p-6">
                  {/* User Role Badge - Top Left */}
                  <div className="absolute top-6 left-6">
                    <div
                      className={cn(
                        'px-3 py-1.5 rounded-full shadow-sm bg-gradient-to-r',
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
                      className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <X className="text-gray-900" size={16} />
                    </motion.button>
                  </div>

                  {/* Profile Avatar - Centered */}
                  <div className="flex flex-col items-center mt-12 block">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={spring}
                      className={cn(
                        'w-24 h-24 rounded-[28px] flex items-center justify-center shadow-xl mb-4 bg-gradient-to-br p-[2px]',
                        roleGradient,
                      )}
                    >
                      <div className="w-full h-full rounded-[26px] overflow-hidden bg-white">
                        {user?.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <UserCircle className="text-gray-300" size={48} strokeWidth={2} />
                          </div>
                        )}
                      </div>
                    </motion.div>

                    <h2 className="text-gray-900 text-xl font-bold mb-1 truncate max-w-full px-4">
                      {user?.user_metadata?.full_name || 'User'}
                    </h2>
                    <p className="text-gray-500 text-sm truncate max-w-full px-4">{user?.email}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pb-6">
                  <div className="rounded-2xl bg-white/50 border border-white/40 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-xs font-medium">Profile Completion</span>
                      <span
                        className={cn(
                          'text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r',
                          roleGradient,
                        )}
                      >
                        40%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
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
                  <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-3 pl-1">
                    Menu
                  </h3>

                  <div className="space-y-1.5">
                    {menuItems.map((item) => {
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
                              'flex items-center gap-3 px-3 py-3 rounded-2xl transition-all',
                              isActive
                                ? 'bg-white shadow-sm border border-gray-100'
                                : 'hover:bg-white/50 hover:shadow-sm hover:border hover:border-white/40 border border-transparent',
                            )}
                          >
                            {/* Icon with Light Gradient Background */}
                            <div
                              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}
                            >
                              <AnimatedIcon
                                icon={item.icon}
                                className={cn(item.iconColor)}
                                size={20}
                                isActive={isActive}
                              />
                            </div>

                            {/* Label */}
                            <span
                              className={cn(
                                'text-sm font-medium flex-1 text-left transition-colors',
                                isActive
                                  ? 'text-gray-900 font-bold'
                                  : 'text-gray-600 group-hover:text-gray-900',
                              )}
                            >
                              {item.label}
                            </span>

                            {/* Arrow */}
                            <span className="text-gray-300 text-lg group-hover:text-gray-400 transition-colors">
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
                    className="w-full mt-1.5 group"
                  >
                    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/50 hover:shadow-sm hover:border hover:border-white/40 border border-transparent transition-all">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                        <AnimatedIcon icon={HelpCircle} className="text-amber-600" size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-gray-600 text-sm font-medium group-hover:text-gray-900 transition-colors">
                          Help & Support
                        </p>
                        <p className="text-gray-400 text-[10px]">24/7 Concierge</p>
                      </div>
                      <span className="text-gray-300 text-lg group-hover:text-gray-400 transition-colors">
                        ›
                      </span>
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
                      <div className="relative rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 p-4 overflow-hidden shadow-lg shadow-purple-500/20">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
                        <div className="relative flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <AnimatedIcon
                              icon={Briefcase}
                              className="text-white"
                              size={20}
                              isActive={true}
                            />
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
              <div className="p-6 pt-0 border-t border-gray-100 bg-white/40 backdrop-blur-md">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full mt-6"
                >
                  <div className="rounded-2xl bg-red-50 border border-red-100 hover:bg-red-100/80 p-3 transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <LogOut className="text-red-500" size={16} strokeWidth={2.5} />
                      <span className="text-red-600 text-sm font-medium">Sign Out</span>
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
