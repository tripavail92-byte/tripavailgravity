import { CompletePackageCreationFlow } from '@/features/package-creation/components/CompletePackageCreationFlow'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function ListPackagePage() {
  const navigate = useNavigate()

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
