import { Briefcase, Building2, Home, LogOut, MapPin, Menu, Search, User } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

import { ScrollArea } from '@/components/ui/scroll-area'

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
      <div className="space-y-1.5">
        <Button
          variant={location.pathname === '/search' ? 'secondary' : 'ghost'}
          className={cn(
            "w-full h-12 justify-start px-4 rounded-xl transition-all",
            location.pathname === '/search' ? "bg-primary/10 text-primary border border-primary/20 font-bold" : "hover:bg-white/5"
          )}
          onClick={() => handleNavigation('/search')}
        >
          <Search className="mr-3 h-5 w-5" />
          Explore Stays
        </Button>
        <Button
          variant={location.pathname === '/trips' ? 'secondary' : 'ghost'}
          className={cn(
            "w-full h-12 justify-start px-4 rounded-xl transition-all",
            location.pathname === '/trips' ? "bg-primary/10 text-primary border border-primary/20 font-bold" : "hover:bg-white/5"
          )}
          onClick={() => handleNavigation('/trips')}
        >
          <MapPin className="mr-3 h-5 w-5" />
          My Trips
        </Button>
        <Button
          variant={location.pathname === '/profile' ? 'secondary' : 'ghost'}
          className={cn(
            "w-full h-12 justify-start px-4 rounded-xl transition-all",
            location.pathname === '/profile' ? "bg-primary/10 text-primary border border-primary/20 font-bold" : "hover:bg-white/5"
          )}
          onClick={() => handleNavigation('/profile')}
        >
          <User className="mr-3 h-5 w-5" />
          Profile
        </Button>
      </div>

      <div className="pt-6 mt-2 border-t border-white/10">
        <p className="px-4 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Partner with us</p>
        <Button
          variant="ghost"
          className="w-full h-12 justify-start px-4 rounded-xl hover:bg-primary-gradient hover:text-white transition-all group"
          onClick={() => handleNavigation('/partner/onboarding')}
        >
          <Briefcase className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
          List your Property
        </Button>
      </div>
    </div>
  )

  const renderHotelManagerMenu = () => (
    <div className="space-y-1.5">
      <Button
        variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}
        className={cn(
          "w-full h-12 justify-start px-4 rounded-xl transition-all font-bold",
          location.pathname === '/dashboard' ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-white/5"
        )}
        onClick={() => handleNavigation('/dashboard')}
      >
        <Home className="mr-3 h-5 w-5" />
        Dashboard
      </Button>
      <Button
        variant={location.pathname === '/properties' ? 'secondary' : 'ghost'}
        className={cn(
          "w-full h-12 justify-start px-4 rounded-xl transition-all font-bold",
          location.pathname === '/properties' ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-white/5"
        )}
        onClick={() => handleNavigation('/properties')}
      >
        <Building2 className="mr-3 h-5 w-5" />
        My Properties
      </Button>
      <Button
        variant={location.pathname === '/bookings' ? 'secondary' : 'ghost'}
        className={cn(
          "w-full h-12 justify-start px-4 rounded-xl transition-all font-bold",
          location.pathname === '/bookings' ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-white/5"
        )}
        onClick={() => handleNavigation('/bookings')}
      >
        <Briefcase className="mr-3 h-5 w-5" />
        Bookings
      </Button>
    </div>
  )

  const renderTourOperatorMenu = () => (
    <div className="space-y-1.5">
      <Button
        variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}
        className={cn(
          "w-full h-12 justify-start px-4 rounded-xl transition-all font-bold",
          location.pathname === '/dashboard' ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-white/5"
        )}
        onClick={() => handleNavigation('/dashboard')}
      >
        <Home className="mr-3 h-5 w-5" />
        Dashboard
      </Button>
      <Button
        variant={location.pathname === '/tours' ? 'secondary' : 'ghost'}
        className={cn(
          "w-full h-12 justify-start px-4 rounded-xl transition-all font-bold",
          location.pathname === '/tours' ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-white/5"
        )}
        onClick={() => handleNavigation('/tours')}
      >
        <MapPin className="mr-3 h-5 w-5" />
        My Tours
      </Button>
      <Button
        variant={location.pathname === '/bookings' ? 'secondary' : 'ghost'}
        className={cn(
          "w-full h-12 justify-start px-4 rounded-xl transition-all font-bold",
          location.pathname === '/bookings' ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-white/5"
        )}
        onClick={() => handleNavigation('/bookings')}
      >
        <Briefcase className="mr-3 h-5 w-5" />
        Bookings
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
      <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0 border-r-0 sm:border-r glass-card overflow-hidden">
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

          <div className="p-6 border-t border-white/20 mt-auto bg-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
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
              className="w-full h-12 rounded-xl font-bold flex items-center justify-start px-4 shadow-lg shadow-destructive/10" 
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
