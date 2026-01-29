import { SearchForm } from '@/components/search/SearchForm';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 flex justify-between items-center border-b">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-[#FF385C] rounded-full flex items-center justify-center text-white font-bold">
                        T
                    </div>
                    <span className="text-xl font-bold text-[#FF385C]">TripAvail</span>
                </div>

                <div className="flex gap-4">
                    {!user ? (
                        <Link to="/auth">
                            <Button>Log in</Button>
                        </Link>
                    ) : (
                        <Link to="/dashboard">
                            <Button variant="ghost"><Settings className="mr-2 h-4 w-4" /> Dashboard</Button>
                        </Link>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 bg-gray-50 flex flex-col items-center pt-20 px-4">
                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 text-center">
                    Find your next stay
                </h1>
                <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl">
                    Search low prices on hotels, homes and much more...
                </p>

                {/* Search Bar */}
                <SearchForm className="mb-20 shadow-2xl" />

                {/* Placeholder Categories */}
                <div className="w-full max-w-6xl">
                    <h2 className="text-2xl font-bold mb-4">Explore by Role</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-40 bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-semibold mb-2">Traveller</h3>
                            <p className="text-sm text-gray-500">Book your perfect vacation.</p>
                        </div>
                        <div className="h-40 bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-semibold mb-2">Hotel Manager</h3>
                            <p className="text-sm text-gray-500">List your property today.</p>
                        </div>
                        <div className="h-40 bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-semibold mb-2">Tour Operator</h3>
                            <p className="text-sm text-gray-500">Offer unique experiences.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
