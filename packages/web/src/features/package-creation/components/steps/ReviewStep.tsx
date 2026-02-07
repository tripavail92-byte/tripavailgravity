import { Check, Edit2, Package, Image, Lightbulb, PlusCircle, XCircle, Calendar, FileText, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageData } from '../../types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ReviewStepProps {
    packageData: PackageData;
    onBack: () => void;
    onEdit: (stepId: number) => void;
    onSubmit: () => void;
}

export function ReviewStep({ packageData, onBack, onEdit, onSubmit }: ReviewStepProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSubmit();
    };

    const sections = [
        {
            id: 1,
            title: 'Package Type',
            icon: Package,
            data: packageData.packageType,
            render: () => (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 border-primary/30 text-primary">
                        {packageData.packageType}
                    </Badge>
                </div>
            )
        },
        {
            id: 2,
            title: 'Basic Information',
            icon: FileText,
            data: packageData.name,
            render: () => (
                <div className="space-y-2">
                    <div>
                        <span className="text-sm text-gray-500">Name:</span>
                        <p className="font-medium">{packageData.name}</p>
                    </div>
                    {packageData.description && (
                        <div>
                            <span className="text-sm text-gray-500">Description:</span>
                            <p className="text-gray-700 text-sm">{packageData.description}</p>
                        </div>
                    )}
                    <div className="flex gap-4 text-sm">
                        {packageData.duration && (
                            <div>
                                <span className="text-gray-500">Duration:</span>
                                <span className="ml-1 font-medium">{packageData.duration} days</span>
                            </div>
                        )}
                        {packageData.groupSize && (
                            <div>
                                <span className="text-gray-500">Group Size:</span>
                                <span className="ml-1 font-medium">{packageData.groupSize} people</span>
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            id: 3,
            title: 'Media',
            icon: Image,
            data: packageData.photos?.length,
            render: () => (
                <div>
                    <p className="text-sm text-gray-600 mb-2">
                        {packageData.photos?.length || 0} photo(s) uploaded
                    </p>
                    {packageData.photos && packageData.photos.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                            {packageData.photos.slice(0, 4).map((photo, idx) => (
                                <img
                                    key={idx}
                                    src={photo}
                                    alt={`Package ${idx + 1}`}
                                    className="w-full h-20 object-cover rounded-lg"
                                />
                            ))}
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 4,
            title: 'Highlights',
            icon: Lightbulb,
            data: packageData.highlights?.length,
            render: () => (
                <div className="space-y-1">
                    {packageData.highlights?.map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                            <Check size={16} className="text-success mt-0.5 flex-shrink-0" />
                            <span>{highlight}</span>
                        </div>
                    )) || <p className="text-sm text-gray-500">No highlights added</p>}
                </div>
            )
        },
        {
            id: 5,
            title: 'Inclusions',
            icon: PlusCircle,
            data: packageData.inclusions?.length,
            render: () => (
                <div className="flex flex-wrap gap-2">
                    {packageData.inclusions?.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="bg-success/5 border-success/30 text-success">
                            {item}
                        </Badge>
                    )) || <p className="text-sm text-gray-500">No inclusions specified</p>}
                </div>
            )
        },
        {
            id: 6,
            title: 'Exclusions',
            icon: XCircle,
            data: packageData.exclusions?.length,
            render: () => (
                <div className="flex flex-wrap gap-2">
                    {packageData.exclusions?.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="bg-error/5 border-error/30 text-error">
                            {item}
                        </Badge>
                    )) || <p className="text-sm text-gray-500">No exclusions specified</p>}
                </div>
            )
        },
        {
            id: 8,
            title: 'Availability',
            icon: Calendar,
            data: packageData.availabilityType,
            render: () => (
                <div className="space-y-2">
                    <div>
                        <span className="text-sm text-gray-500">Type:</span>
                        <span className="ml-2 font-medium capitalize">{packageData.availabilityType?.replace('-', ' ')}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Min Stay:</span>
                            <span className="ml-1 font-medium">{packageData.minStay} nights</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Max Stay:</span>
                            <span className="ml-1 font-medium">{packageData.maxStay} nights</span>
                        </div>
                    </div>
                    {packageData.blackoutDates && packageData.blackoutDates.length > 0 && (
                        <div>
                            <span className="text-sm text-gray-500">Blackout Dates:</span>
                            <span className="ml-2 text-sm font-medium">{packageData.blackoutDates.length} dates blocked</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 9,
            title: 'Policies',
            icon: FileText,
            data: packageData.cancellationPolicy,
            render: () => (
                <div className="space-y-2">
                    <div>
                        <span className="text-sm text-gray-500">Cancellation:</span>
                        <span className="ml-2 font-medium capitalize">{packageData.cancellationPolicy}</span>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500">Payment:</span>
                        <span className="ml-2 font-medium capitalize">{packageData.paymentTerms?.replace('-', ' ')}</span>
                    </div>
                </div>
            )
        }
    ];

    const completedSections = sections.filter(s => s.data);
    const totalSections = sections.length;
    const completionPercentage = Math.round((completedSections.length / totalSections) * 100);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Package</h2>
                <p className="text-gray-600">Review all details before publishing your package</p>
            </div>

            {/* Completion Progress */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Completion Status</span>
                    <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
                <p className="text-sm text-gray-600">
                    {completedSections.length} of {totalSections} sections completed
                </p>
            </Card>

            {/* Sections Review */}
            <div className="space-y-4">
                {sections.map(section => {
                    const IconComponent = section.icon;
                    const hasData = section.data !== undefined && section.data !== null;

                    return (
                        <Card key={section.id} className={cn("p-6", !hasData && "bg-gray-50")}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        hasData ? "bg-primary/10" : "bg-gray-200"
                                    )}>
                                        <IconComponent size={20} className={hasData ? "text-primary" : "text-gray-400"} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                                        {!hasData && <p className="text-sm text-gray-500">Not completed</p>}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(section.id)}
                                    className="text-primary hover:text-primary"
                                >
                                    <Edit2 size={16} className="mr-1" />
                                    Edit
                                </Button>
                            </div>
                            {hasData && <div>{section.render()}</div>}
                        </Card>
                    );
                })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
                    Back
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={completionPercentage < 100 || isSubmitting}
                    className="min-w-[140px]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Publishing...
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Publish Package
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
