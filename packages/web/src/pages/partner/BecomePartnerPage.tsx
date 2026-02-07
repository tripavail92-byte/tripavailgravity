import { RoleType } from '@tripavail/shared/roles/types'
import { Building2, CheckCircle2, Map as MapIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

export default function BecomePartnerPage() {
  const { switchRole } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<RoleType | null>(null)

  const handleSelectRole = async (role: RoleType) => {
    setLoading(role)
    try {
      await switchRole(role)
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to switch role:', error)
      // In a real app, show a toast here
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Become a Partner</h1>
          <p className="text-muted-foreground text-lg">Choose how you want to list on TripAvail</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Hotel Manager Option */}
          <Card
            className="hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden group"
            onClick={() => handleSelectRole('hotel_manager')}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle>Hotel Manager</CardTitle>
              <CardDescription>Perfect for hotels, resorts, and vacation rentals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>List unlimited properties</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Manage bookings & availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Receive payouts directly</span>
                </div>
              </div>
              <Button className="w-full" disabled={loading === 'hotel_manager'}>
                {loading === 'hotel_manager' ? 'Switching...' : 'Select Hotel Manager'}
              </Button>
            </CardContent>
          </Card>

          {/* Tour Operator Option */}
          <Card
            className="hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden group"
            onClick={() => handleSelectRole('tour_operator')}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <MapIcon className="h-6 w-6" />
              </div>
              <CardTitle>Tour Operator</CardTitle>
              <CardDescription>Best for guided tours, activities, and experiences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Create unique daily itineraries</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Manage group capacities</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Smart scheduling tools</span>
                </div>
              </div>
              <Button className="w-full" disabled={loading === 'tour_operator'}>
                {loading === 'tour_operator' ? 'Switching...' : 'Select Tour Operator'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
