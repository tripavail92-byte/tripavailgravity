import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function PersonalInfoStep({ onUpdate, data }: StepProps) {
    const [formData, setFormData] = useState(data.personalInfo || {
        operatorName: '',
        email: '',
        phone: '',
        contactPerson: ''
    });

    const handleChange = (field: string, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onUpdate({ personalInfo: newData });
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h3>
                <p className="text-gray-600">Let's start with your basic contact information.</p>
            </div>

            <Card className="p-6 space-y-5 border-gray-100 shadow-sm rounded-2xl">
                <div className="space-y-2">
                    <Label htmlFor="operatorName" className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Tour Operator Name *
                    </Label>
                    <Input
                        id="operatorName"
                        value={formData.operatorName}
                        onChange={(e) => handleChange('operatorName', e.target.value)}
                        placeholder="e.g. Peak Adventures Ltd"
                        className="rounded-xl border-gray-200 py-6"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Work Email Address *
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="hello@adventure.com"
                        className="rounded-xl border-gray-200 py-6"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Phone Number *
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+92 XXX XXXXXXX"
                        className="rounded-xl border-gray-200 py-6"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Primary Contact Person
                    </Label>
                    <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => handleChange('contactPerson', e.target.value)}
                        placeholder="Name of the person managing the account"
                        className="rounded-xl border-gray-200 py-6"
                    />
                </div>
            </Card>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <span className="text-amber-500 text-xl font-bold italic">!</span>
                <p className="text-sm text-amber-800 leading-relaxed">
                    Make sure your email and phone number are correct. We'll use these for important booking notifications and account verification.
                </p>
            </div>
        </div>
    );
}
