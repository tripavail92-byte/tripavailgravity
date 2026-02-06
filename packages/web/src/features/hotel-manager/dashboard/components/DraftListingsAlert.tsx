import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { hotelService } from '@/features/hotel-listing/services/hotelService';
import { useNavigate } from 'react-router-dom';

interface Draft {
    id: string;
    name: string;
    draft_data: any;
}

export function DraftListingsAlert() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const fetchDrafts = async () => {
            setLoading(true);
            const result = await hotelService.fetchDrafts(user.id);
            if (result.success && result.drafts) {
                setDrafts(result.drafts);
            }
            setLoading(false);
        };

        fetchDrafts();
    }, [user?.id]);

    const calculateCompletion = (draftData: any) => {
        const requiredFields = [
            'propertyType',
            'hotelName',
            'description',
            'amenities',
            'rooms',
            'policies',
            'photos',
        ];

        const completed = requiredFields.filter(field => {
            const value = draftData?.[field];
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object') return Object.keys(value || {}).length > 0;
            return !!value;
        });

        return Math.round((completed.length / requiredFields.length) * 100);
    };

    const getMissingItems = (draftData: any) => {
        const missing: string[] = [];

        if (!draftData?.hotelName) missing.push('Hotel Name');
        if (!draftData?.description) missing.push('Description');
        if (!draftData?.amenities?.length) missing.push('Amenities');
        if (!draftData?.rooms?.length) missing.push('Rooms');
        if (!draftData?.policies) missing.push('Policies');
        if (!draftData?.photos?.propertyPhotos?.length) missing.push('Photos');

        return missing.length > 0 ? missing : ['Minor Details'];
    };

    const handleContinueSetup = (draftId: string) => {
        // TODO: Navigate to listing flow with draft data pre-populated
        navigate(`/manager/list-hotel?draftId=${draftId}`);
    };

    if (loading) return null;
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
                            {drafts.map((draft) => {
                                const completion = calculateCompletion(draft.draft_data);
                                const missing = getMissingItems(draft.draft_data);

                                return (
                                    <div
                                        key={draft.id}
                                        className="bg-white rounded-lg p-4 flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-medium text-gray-900">{draft.name}</h4>
                                                <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                                    {completion}% Complete
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${completion}%` }}
                                                />
                                            </div>

                                            <p className="text-sm text-gray-600">
                                                Missing: {missing.join(', ')}
                                            </p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            onClick={() => handleContinueSetup(draft.id)}
                                            className="ml-4 hover:bg-purple-50"
                                            style={{ color: '#9D4EDD' }}
                                        >
                                            Continue Setup
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
