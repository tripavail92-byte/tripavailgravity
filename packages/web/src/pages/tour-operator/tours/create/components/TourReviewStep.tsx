import { Tour } from '@/features/tour-operator/services/tourService';
import { Button } from '@/components/ui/button';

interface TourReviewStepProps {
    data: Partial<Tour>;
    onBack: () => void;
    onPublish: () => void;
}

export function TourReviewStep({ data, onBack, onPublish }: TourReviewStepProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Review & Publish</h2>
            <div className="space-y-4 border rounded-md p-4 bg-gray-50">
                <p className="text-gray-500">Review your tour details before publishing.</p>
                {/* Review summary will go here */}
                <div>
                    <strong>Title:</strong> {data.title}
                </div>
            </div>
            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onPublish}>Publish Tour</Button>
            </div>
        </div>
    );
}
