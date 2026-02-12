import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PropertyOwnershipSubFlow } from './verification/PropertyOwnershipSubFlow';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function PropertyOwnershipStep({ onUpdate, data }: StepProps) {
    const [formData, setFormData] = useState(data.propertyDetails || {
        propertyName: '',
        propertyAddress: '',
        ownershipType: 'owner',
    });

    const handleInputChange = (field: string, value: string) => {
        const next = { ...formData, [field]: value };
        setFormData(next);
        onUpdate({ propertyDetails: next });
    };

    const handleOwnershipComplete = (ownershipDocs: {
        titleDeedUrl: string;
        utilityBillUrl: string;
        propertyLivePhotoUrl: string;
    }) => {
        onUpdate({
            verification: {
                ...data.verification,
                ownershipDocs
            }
        });
    };

    return (
        <div className="space-y-12">
            <Card className="p-8 space-y-8 border-gray-100 shadow-sm rounded-[32px] bg-white ring-1 ring-black/[0.02]">
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Property Name</Label>
                    <Textarea
                        value={formData.propertyName}
                        onChange={(e) => handleInputChange('propertyName', e.target.value)}
                        placeholder="e.g. Grand Continental Hotel"
                        className="rounded-2xl border-gray-200 focus-visible:ring-primary/20 min-h-[60px]"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Physical Address</Label>
                    <Textarea
                        value={formData.propertyAddress}
                        onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                        placeholder="Exact location of the property"
                        className="rounded-2xl border-gray-200 min-h-[100px] focus-visible:ring-primary/20"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Your Relationship</Label>
                    <Select
                        value={formData.ownershipType}
                        onValueChange={(v: any) => handleInputChange('ownershipType', v)}
                    >
                        <SelectTrigger className="rounded-2xl border-gray-200 py-7 focus:ring-primary/20 font-medium">
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="owner">I am the Owner</SelectItem>
                            <SelectItem value="manager">Professional Manager</SelectItem>
                            <SelectItem value="lease">Lease Holder</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            <div className="pt-8 border-t border-gray-100">
                <PropertyOwnershipSubFlow 
                    onComplete={handleOwnershipComplete}
                    initialData={data.verification?.ownershipDocs}
                />
            </div>
        </div>
    );
}
