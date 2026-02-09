import { motion } from 'motion/react';
import { StatsOverview } from '../../hotel-manager/dashboard/components/StatsOverview';
import { RecentBookings } from '../../hotel-manager/dashboard/components/RecentBookings';

export function TourOperatorDashboard() {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                >
                    {/* Welcome Section */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome back, Partner! 🎒
                        </h1>
                        <p className="text-gray-600">
                            Manage your tour packages and track your business performance
                        </p>
                    </div>

                    {/* Stats Overview */}
                    <StatsOverview />

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Tour Packages (2/3 width) */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border p-6 min-h-[400px]">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Active Tour Packages</h2>
                                    <button className="text-primary hover:underline text-sm font-medium">View all</button>
                                </div>
                                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                    <div className="bg-primary/5 p-4 rounded-full mb-4">
                                        <span className="text-4xl">🗓️</span>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No active tours yet</h3>
                                    <p className="text-gray-500 max-w-sm mb-6">
                                        Start by creating your first tour package to reach travellers worldwide.
                                    </p>
                                    <button className="bg-primary-gradient text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 shadow-lg shadow-primary/20">
                                        Create Tour Package
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Recent Activity (1/3 width) */}
                        <div className="lg:col-span-1">
                            <RecentBookings />
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
