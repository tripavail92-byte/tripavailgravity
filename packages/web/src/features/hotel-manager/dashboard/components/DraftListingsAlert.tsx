import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function DraftListingsAlert() {
    // Mock data - will be replaced with real data
    const drafts = [
        {
            id: '1',
            name: 'Downtown Business Hotel',
            completion: 75,
            missing: ['Photos', 'Pricing'],
        },
        {
            id: '2',
            name: 'Lakeside Cabin Resort',
            completion: 40,
            missing: ['Rooms', 'Photos', 'Policies'],
        },
    ];

    if (drafts.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-l-4 border-amber-500 bg-amber-50 p-6">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {drafts.length} Draft Listing{drafts.length > 1 ? 's' : ''} Need Your Attention
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Complete these listings to start receiving bookings
                        </p>

                        {/* Draft Items */}
                        <div className="space-y-3">
                            {drafts.map((draft) => (
                                <div
                                    key={draft.id}
                                    className="bg-white rounded-lg p-4 flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-medium text-gray-900">{draft.name}</h4>
                                            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                                {draft.completion}% Complete
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                            <div
                                                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${draft.completion}%` }}
                                            />
                                        </div>

                                        <p className="text-sm text-gray-600">
                                            Missing: {draft.missing.join(', ')}
                                        </p>
                                    </div>

                                    <Button variant="ghost" className="ml-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                        Continue Setup
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
