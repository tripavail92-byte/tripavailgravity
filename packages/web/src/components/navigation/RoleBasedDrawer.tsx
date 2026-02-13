import { AlignJustify, Heart, LogIn, LogOut, MapPin, Pencil, UserCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ROLE_NAVIGATION } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'

export function RoleBasedDrawer() {
  const { user, activeRole, signOut, initialized, switchRole } = useAuth()
  const navigate = useNavigate()
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

  // Loading state
  if (!initialized) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
      </Button>
    )
  }

  // Guest View
  if (!user || !activeRole) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button className="flex items-center gap-2 border rounded-full p-1 pl-3 hover:shadow-md transition-shadow group shrink-0">
            <AlignJustify className="w-4 h-4 text-foreground/80 group-hover:text-foreground" />
            <div className="bg-muted text-muted-foreground bg-gray-500/10 rounded-full p-1 group-hover:bg-gray-500/20 transition-colors">
              <UserCircle className="w-6 h-6 fill-current text-gray-500" />
            </div>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[92vw] max-w-[350px] sm:w-[350px]">
          <SheetHeader className="text-left">
            <SheetTitle>Welcome to TripAvail</SheetTitle>
            <SheetDescription>Sign in to manage your trips and preferences.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-8">
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="mr-2 h-4 w-4" /> Log In / Sign Up
            </Button>
            <Separator />
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Or continue as:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/partner/onboarding')
                  }}
                >
                  Hotel Partner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/partner/onboarding')
                  }}
                >
                  Tour Operator
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Role-Based View
  const navItems = ROLE_NAVIGATION[activeRole.role_type] || []
  // Helper to format role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'hotel_manager': return 'Hotel Manager'
      case 'tour_operator': return 'Tour Operator'
      case 'traveller': return 'Traveler'
      default: return 'User'
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 border rounded-full p-1 pl-3 hover:shadow-md transition-shadow group shrink-0">
          <AlignJustify className="w-4 h-4 text-foreground/80 group-hover:text-foreground" />
          <div className="bg-muted text-muted-foreground bg-gray-500/10 rounded-full p-1 group-hover:bg-gray-500/20 transition-colors">
            {/* Use User Avatar if available, else fallback */}
            {user.user_metadata?.avatar_url ? (
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            ) : (
              <UserCircle className="w-6 h-6 fill-current text-gray-500" />
            )}
          </div>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[92vw] max-w-[350px] sm:w-[350px] p-0 flex flex-col h-full bg-background border-l-0 sm:border-l"
      >
        {/* Header Profile Section */}
        <div className="p-6 pb-2">
          <div className="flex justify-end mb-2">
            {/* Close button primitive is usually handled by SheetContent, but we keep the spacing if needed */}
          </div>

          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-16 w-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-medium">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-purple-600 text-white">
                {user.user_metadata?.full_name?.charAt(0) ||
                  user.email?.charAt(0).toUpperCase() ||
                  'M'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg truncate text-gray-900">
                  {user.user_metadata?.full_name || 'Maria'}
                </h3>
                <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
              <p className="text-sm text-gray-500 truncate">
                {user.email || 'tours@adventures.com'}
              </p>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>{getRoleLabel(activeRole?.role_type || 'traveller')} • Pakistan</span>
              </div>
            </div>
          </div>

          {/* Completion Bar */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-sm font-semibold text-gray-700">
              <span>Profile Completion</span>
              <span className="text-primary">40%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-gradient w-[40%] rounded-full" />
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <ScrollArea className="flex-1 px-4">
          <nav className="flex flex-col gap-1 py-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="justify-start items-center gap-4 h-auto py-3.5 px-3 rounded-xl hover:bg-gray-50 text-gray-700 group transition-all"
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className="h-6 w-6 text-gray-500 group-hover:text-gray-900 stroke-[1.5px]" />
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-base font-medium text-gray-900">{item.label}</span>
                  {item.subtext && (
                    <span className="text-xs text-gray-500 font-normal">{item.subtext}</span>
                  )}
                </div>
              </Button>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50/50 space-y-4">
          {/* Show Partner CTA only for Travellers or if specifically requested */}
          {/* Partner Action Section */}
          <div className="mb-2">
            {activeRole.role_type === 'traveller' ? (
              <>
                <p className="text-sm font-semibold text-gray-900 mb-3">Partner with us</p>
                <Button
                  className="w-full bg-primary-gradient hover:opacity-90 text-white border-0 h-auto py-3 flex flex-col items-center gap-0.5 rounded-xl shadow-lg shadow-primary/20"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/partner/onboarding')
                  }}
                >
                  <span className="font-bold text-base">Become a Partner</span>
                  <span className="text-[10px] font-normal opacity-90">
                    Join TripAvail and grow your business
                  </span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
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
                  <LogOut className="h-4 w-4 rotate-180" />
                  Switch to Traveler Mode
                </Button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 py-6 rounded-xl transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-semibold text-base">Sign Out</span>
            </Button>

            <div className="flex justify-center items-center gap-1 text-[10px] text-gray-400 pt-2">
              <span>Version 1.0.0 • Made with</span>
              <Heart className="w-3 h-3 fill-primary text-primary" />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
