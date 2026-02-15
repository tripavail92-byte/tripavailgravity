import { Briefcase, Building2, Home, LogOut, MapPin, Menu, Search, User } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

import { ScrollArea } from '@/components/ui/scroll-area'
import { AnimatedIcon } from '@/components/ui/AnimatedIcon'

export function DrawerMenu() {
  const { user, activeRole, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleNavigation = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
    setOpen(false)
  }

  if (!user && !activeRole) return null

  const renderTravellerMenu = () => (
    <div className="flex flex-col gap-2">
      <div className="space-y-2">
        <Button
          variant={location.pathname === '/search' ? 'secondary' : 'ghost'}
          className={cn(
            'w-full h-14 justify-start px-4 rounded-xl transition-all relative overflow-hidden group',
            location.pathname === '/search'
              ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
              : 'hover:bg-white/5 font-medium text-muted-foreground hover:text-foreground',
          )}
          onClick={() => handleNavigation('/search')}
        >
          <AnimatedIcon icon={Search} className="mr-4" isActive={location.pathname === '/search'} />
          <span className="text-base">Explore Stays</span>
        </Button>
        <Button
          variant={location.pathname === '/trips' ? 'secondary' : 'ghost'}
          className={cn(
            'w-full h-14 justify-start px-4 rounded-xl transition-all relative overflow-hidden group',
            location.pathname === '/trips'
              ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
              : 'hover:bg-white/5 font-medium text-muted-foreground hover:text-foreground',
          )}
          onClick={() => handleNavigation('/trips')}
        >
          <AnimatedIcon icon={MapPin} className="mr-4" isActive={location.pathname === '/trips'} />
          <span className="text-base">My Trips</span>
        </Button>
        <Button
          variant={location.pathname === '/profile' ? 'secondary' : 'ghost'}
          className={cn(
            'w-full h-14 justify-start px-4 rounded-xl transition-all relative overflow-hidden group',
            location.pathname === '/profile'
              ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
              : 'hover:bg-white/5 font-medium text-muted-foreground hover:text-foreground',
          )}
          onClick={() => handleNavigation('/profile')}
        >
          <AnimatedIcon icon={User} className="mr-4" isActive={location.pathname === '/profile'} />
          <span className="text-base">Profile</span>
        </Button>
      </div>

      <div className="pt-8 mt-4 border-t border-white/10">
        <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
          Partner with us
        </p>
        <Button
          variant="ghost"
          className="w-full h-14 justify-start px-4 rounded-xl hover:bg-primary-gradient hover:text-white transition-all group relative overflow-hidden"
          onClick={() => handleNavigation('/partner/onboarding')}
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <AnimatedIcon
            icon={Briefcase}
            className="mr-4 group-hover:scale-110 transition-transform"
          />
          <span className="text-base font-bold">List your Property</span>
        </Button>
      </div>
    </div>
  )

  const renderHotelManagerMenu = () => (
    <div className="space-y-2">
      <Button
        variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}
        className={cn(
          'w-full h-14 justify-start px-4 rounded-xl transition-all relative overflow-hidden group',
          location.pathname === '/dashboard'
            ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
            : 'hover:bg-white/5 font-medium text-muted-foreground hover:text-foreground',
        )}
        onClick={() => handleNavigation('/dashboard')}
      >
        <AnimatedIcon icon={Home} className="mr-4" isActive={location.pathname === '/dashboard'} />
        <span className="text-base">Dashboard</span>
      </Button>
      <Button
        variant={location.pathname === '/properties' ? 'secondary' : 'ghost'}
        className={cn(
          'w-full h-14 justify-start px-4 rounded-xl transition-all relative overflow-hidden group',
          location.pathname === '/properties'
            ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
            : 'hover:bg-white/5 font-medium text-muted-foreground hover:text-foreground',
        )}
        onClick={() => handleNavigation('/properties')}
      >
        <AnimatedIcon
          icon={Building2}
          className="mr-4"
          isActive={location.pathname === '/properties'}
        />
        <span className="text-base">My Properties</span>
      </Button>
      <Button
        variant={location.pathname === '/bookings' ? 'secondary' : 'ghost'}
        className={cn(
          'w-full h-14 justify-start px-4 rounded-xl transition-all relative overflow-hidden group',
          location.pathname === '/bookings'
            ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
            : 'hover:bg-white/5 font-medium text-muted-foreground hover:text-foreground',
        )}
        onClick={() => handleNavigation('/bookings')}
      >
        <AnimatedIcon
          icon={Briefcase}
          className="mr-4"
          isActive={location.pathname === '/bookings'}
        />
        <span className="text-base">Bookings</span>
      </Button>
    </div>
  )

  const renderTourOperatorMenu = () => (
    <div className="space-y-2">
      <Button
        variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}
        className={cn(
          'w-full h-14 justify-start px-4 rounded-xl transition-all relative overflow-hidden group',
          location.pathname === '/dashboard'
            ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
            : 'hover:bg-white/5 font-medium text-muted-foreground hover:text-foreground',
        )}
        onClick={() => handleNavigation('/dashboard')}
      >
        <AnimatedIcon icon={Home} className="mr-4" isActive={location.pathname === '/dashboard'} />
        <span className="text-base">Dashboard</span>
      </Button>
      <Button
        variant={location.pathname === '/tours' ? 'secondary' : 'ghost'}
        className={cn(
          'w-full h-14 justify-start px-4 rounded-xl transition-all relative overflow-hidden group',
          location.pathname === '/tours'
            ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
            : 'hover:bg-white/5 font-medium text-muted-foreground hover:text-foreground',
        )}
        onClick={() => handleNavigation('/tours')}
      >
        <AnimatedIcon icon={MapPin} className="mr-4" isActive={location.pathname === '/tours'} />
        <span className="text-base">My Tours</span>
      </Button>
      <Button
        variant={location.pathname === '/bookings' ? 'secondary' : 'ghost'}
        className={cn(
          'w-full h-14 justify-start px-4 rounded-xl transition-all relative overflow-hidden group',
          location.pathname === '/bookings'
            ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
            : 'hover:bg-white/5 font-medium text-muted-foreground hover:text-foreground',
        )}
        onClick={() => handleNavigation('/bookings')}
      >
        <AnimatedIcon
          icon={Briefcase}
          className="mr-4"
          isActive={location.pathname === '/bookings'}
        />
        <span className="text-base">Bookings</span>
      </Button>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85vw] sm:w-[350px] p-0 border-r-0 sm:border-r glass-card overflow-hidden bg-[radial-gradient(at_top_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"
      >
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="text-2xl font-black bg-primary-gradient bg-clip-text text-transparent italic">
            TRIPAVAIL
          </SheetTitle>
        </SheetHeader>
        <div className="py-6 flex flex-col h-full">
          <ScrollArea className="flex-1 px-4">
            {activeRole?.role_type === 'traveller' && renderTravellerMenu()}
            {activeRole?.role_type === 'hotel_manager' && renderHotelManagerMenu()}
            {activeRole?.role_type === 'tour_operator' && renderTourOperatorMenu()}
          </ScrollArea>

          <div className="p-6 border-t border-white/20 mt-auto bg-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-base font-bold text-foreground leading-none mb-1 truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full h-14 rounded-xl font-bold flex items-center justify-start px-4 shadow-lg shadow-destructive/10 hover:bg-destructive/90 transition-all"
              onClick={handleLogout}
            >
              <AnimatedIcon icon={LogOut} className="mr-4" />
              <span className="text-base">Sign Out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
