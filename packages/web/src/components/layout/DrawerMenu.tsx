import { Briefcase, Building2, Home, LogOut, MapPin, Menu, Search, User } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'

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
    <>
      <div className="space-y-1">
        <Button
          variant={location.pathname === '/search' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavigation('/search')}
        >
          <Search className="mr-2 h-4 w-4" />
          Explore Stays
        </Button>
        <Button
          variant={location.pathname === '/trips' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavigation('/trips')}
        >
          <MapPin className="mr-2 h-4 w-4" />
          My Trips
        </Button>
        <Button
          variant={location.pathname === '/profile' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavigation('/profile')}
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
      </div>

      <div className="pt-4 border-t mt-4">
        <h4 className="mb-2 px-2 text-sm font-semibold tracking-tight">Become a Partner</h4>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-primary"
          onClick={() => handleNavigation('/partner/onboarding')}
        >
          <Briefcase className="mr-2 h-4 w-4" />
          List your Property
        </Button>
      </div>
    </>
  )

  const renderHotelManagerMenu = () => (
    <>
      <div className="space-y-1">
        <Button
          variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavigation('/dashboard')}
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={location.pathname === '/properties' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavigation('/properties')}
        >
          <Building2 className="mr-2 h-4 w-4" />
          My Properties
        </Button>
        <Button
          variant={location.pathname === '/bookings' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavigation('/bookings')}
        >
          <Briefcase className="mr-2 h-4 w-4" />
          Bookings
        </Button>
      </div>
    </>
  )

  const renderTourOperatorMenu = () => (
    <>
      <div className="space-y-1">
        <Button
          variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavigation('/dashboard')}
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={location.pathname === '/tours' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavigation('/tours')}
        >
          <MapPin className="mr-2 h-4 w-4" />
          My Tours
        </Button>
        <Button
          variant={location.pathname === '/bookings' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavigation('/bookings')}
        >
          <Briefcase className="mr-2 h-4 w-4" />
          Bookings
        </Button>
      </div>
    </>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80vw] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>TripAvail</SheetTitle>
        </SheetHeader>
        <div className="py-6 flex flex-col h-full">
          <div className="flex-1">
            {activeRole?.role_type === 'traveller' && renderTravellerMenu()}
            {activeRole?.role_type === 'hotel_manager' && renderHotelManagerMenu()}
            {activeRole?.role_type === 'tour_operator' && renderTourOperatorMenu()}
          </div>

          <div className="pt-4 border-t mt-auto">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium leading-none truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
