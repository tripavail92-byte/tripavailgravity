import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { supabase } from '@tripavail/shared/core/client'
import { Button } from '@/components/ui/button'
import { CompletePackageCreationFlow } from '@/features/package-creation/components/CompletePackageCreationFlow'
import { useAuth } from '@/hooks/useAuth'

export default function ListPackagePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [gateLoading, setGateLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!user?.id) {
        if (!cancelled) setGateLoading(false)
        return
      }

      try {
        const { count, error } = await supabase
          .from('hotels')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('is_published', true)

        if (error) throw error

        if ((count ?? 0) === 0) {
          toast.error('Create a hotel listing before listing packages')
          navigate('/manager/list-hotel', { replace: true })
          return
        }
      } catch (e) {
        console.error('[ListPackagePage] Failed to check hotel listing completion', e)
        toast.error('Unable to verify hotel listing status')
        navigate('/manager/list-hotel', { replace: true })
        return
      } finally {
        if (!cancelled) setGateLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate, user?.id])

  if (gateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium tracking-tight">Checking listings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              T
            </div>
            <span className="font-bold text-xl text-gray-900">TripAvail</span>
          </div>
          <div className="h-6 w-px bg-gray-200 mx-2" />
          <span className="text-gray-500 font-medium">Package Creator</span>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Exit
        </Button>
      </header>

      <main className="flex-1">
        <CompletePackageCreationFlow />
      </main>
    </div>
  )
}
