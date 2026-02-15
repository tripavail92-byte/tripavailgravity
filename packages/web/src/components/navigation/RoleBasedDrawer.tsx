import { AlignJustify, Backpack, Heart, LogIn, LogOut, MapPin, Pencil } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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
            <Avatar className="h-7 w-7">
              <AvatarImage src={undefined} alt="Traveler" />
              <AvatarFallback aria-label="Traveler" className="bg-muted text-muted-foreground">
                <Backpack className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[85vw] max-w-[350px] sm:w-[350px] glass-card border-l-0 sm:border-l p-0">
          <ScrollArea className="h-full">
            <div className="p-6">
              <SheetHeader className="text-left mb-8">
                <SheetTitle className="text-2xl font-black bg-primary-gradient bg-clip-text text-transparent italic leading-tight">
                  TRIPAVAIL
                </SheetTitle>
                <SheetDescription className="text-sm font-medium">Sign in to manage your trips and preferences.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4">
                <Button onClick={handleLogin} className="w-full h-12 rounded-xl bg-primary-gradient text-white font-bold shadow-lg shadow-primary/20">
                  <LogIn className="mr-2 h-5 w-5" /> Log In / Sign Up
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-muted-foreground font-semibold">Or continue as</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 rounded-2xl border-white/10 bg-white/5 flex flex-col gap-2 hover:bg-white/10 transition-all font-bold text-xs"
                    onClick={() => {
                      setIsOpen(false)
                      navigate('/partner/onboarding')
                    }}
                  >
                    Partner
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 rounded-2xl border-white/10 bg-white/5 flex flex-col gap-2 hover:bg-white/10 transition-all font-bold text-xs"
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
          </ScrollArea>
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
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.user_metadata?.avatar_url} alt="Traveler" />
            <AvatarFallback aria-label="Traveler" className="bg-muted text-muted-foreground">
              {user.email ? user.email.charAt(0).toUpperCase() : <Backpack className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[85vw] max-w-[350px] sm:w-[350px] p-0 flex flex-col h-full bg-transparent border-l-0 sm:border-l glass-card overflow-hidden"
      >
        {/* Header Profile Section */}
        <div className="p-6 pb-4 bg-white/5">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative group">
              <Avatar className="h-16 w-16 bg-primary-gradient rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-xl overflow-hidden">
                <AvatarImage src={user.user_metadata?.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-primary-gradient text-white text-2xl font-black">
                  {user.user_metadata?.full_name?.charAt(0) ||
                    user.email?.charAt(0).toUpperCase() ||
                    'M'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-2 border-white rounded-full shadow-lg" />
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-black text-xl truncate text-foreground tracking-tight">
                  {user.user_metadata?.full_name?.split(' ')[0] || 'Maria'}
                </h3>
                <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground truncate mb-2">
                {user.email}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
                <MapPin className="w-3 h-3" />
                <span>{getRoleLabel(activeRole?.role_type || 'traveller')}</span>
              </div>
            </div>
          </div>

          {/* Completion Bar */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
              <span>Profile Score</span>
              <span className="text-primary">40%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary-gradient rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '40%' }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <ScrollArea className="flex-1 px-4 py-2">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="justify-start items-center gap-4 h-auto py-3.5 px-4 rounded-2xl hover:bg-white/10 text-foreground group transition-all border border-transparent hover:border-white/10"
                onClick={() => handleNavigation(item.href)}
              >
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors stroke-[2px]" />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors leading-none">{item.label}</span>
                  {item.subtext && (
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-70 group-hover:opacity-100">{item.subtext}</span>
                  )}
                </div>
              </Button>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-white/5 space-y-6">
          <div className="mb-2">
            {activeRole.role_type === 'traveller' ? (
              <Button
                className="w-full bg-primary-gradient hover:scale-[1.02] active:scale-95 transition-all text-white border-0 h-auto py-4 flex flex-col items-center gap-0.5 rounded-2xl shadow-xl shadow-primary/20"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/partner/onboarding')
                }}
              >
                <span className="font-black text-base uppercase tracking-widest">Become a Partner</span>
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                  Join TripAvail and grow your business
                </span>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-bold"
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
                <LogOut className="h-5 w-5 rotate-180 text-primary" />
                Switch to Traveler
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Button
              variant="ghost"
              className="w-full h-12 justify-center gap-3 text-destructive hover:text-white hover:bg-destructive/90 rounded-xl transition-all font-black uppercase tracking-widest border border-destructive/20"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>

            <div className="flex justify-center items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pt-2">
              <span>v1.2.0 • MADE WITH</span>
              <Heart className="w-3 h-3 fill-primary text-primary" />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
