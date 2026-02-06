import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DashboardHeader() {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <h2 className="text-xl font-semibold text-gray-900">
                            TripAvail Manager
                        </h2>
                    </div>

                    {/* Search Bar - Hidden on mobile */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search listings, bookings..."
                                className="pl-10 w-full"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* User Menu */}
                        <Button variant="ghost" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <span className="hidden md:inline text-gray-900 font-medium">
                                Sarah M.
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
