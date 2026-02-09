import { useState, ChangeEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Upload } from 'lucide-react';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function BusinessInfoStep({ onUpdate, data }: StepProps) {
    const [formData, setFormData] = useState(data.businessInfo || {
        businessName: '',
        yearsInBusiness: '',
        teamSize: '',
        businessDescription: '',
        companyLogo: null as string | null
    });

    const handleInputChange = (field: string, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onUpdate({ businessInfo: newData });
    };

    const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoUrl = e.target?.result as string;
                handleInputChange('companyLogo', logoUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Business Details</h3>
                <p className="text-gray-600">Tell travelers about your tour business operation.</p>
            </div>

            <Card className="p-6 space-y-6 border-gray-100 shadow-sm rounded-2xl">
                <div className="space-y-4">
                    <Label className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Company Logo
                    </Label>
                    <div className="flex items-center gap-6 p-4 border-2 border-dashed border-gray-100 rounded-2xl">
                        <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                            {formData.companyLogo ? (
                                <img src={formData.companyLogo} className="w-full h-full object-contain" />
                            ) : (
                                <Building className="w-8 h-8 text-gray-300" />
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <input
                                type="file"
                                id="logo-upload"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <label
                                htmlFor="logo-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl cursor-pointer transition-all font-medium text-sm"
                            >
                                <Upload className="w-4 h-4" />
                                {formData.companyLogo ? 'Change Logo' : 'Upload Logo'}
                            </label>
                            <p className="text-xs text-gray-400">
                                PNG or SVG (max. 2MB). Squarish format looks best.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Registered Business Name *
                    </Label>
                    <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        placeholder="Official company name"
                        className="rounded-xl border-gray-200 py-6"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold uppercase tracking-wider text-gray-500">Experience</Label>
                        <Select
                            value={formData.yearsInBusiness}
                            onValueChange={(v) => handleInputChange('yearsInBusiness', v)}
                        >
                            <SelectTrigger className="rounded-xl border-gray-200 py-6">
                                <SelectValue placeholder="Years in bus..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 shadow-xl overflow-hidden">
                                <SelectItem value="lt-1">New Operation</SelectItem>
                                <SelectItem value="1-3">1-3 years</SelectItem>
                                <SelectItem value="3-5">3-5 years</SelectItem>
                                <SelectItem value="5-plus">5+ years</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold uppercase tracking-wider text-gray-500">Team Size</Label>
                        <Select
                            value={formData.teamSize}
                            onValueChange={(v) => handleInputChange('teamSize', v)}
                        >
                            <SelectTrigger className="rounded-xl border-gray-200 py-6">
                                <SelectValue placeholder="Members..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 shadow-xl overflow-hidden">
                                <SelectItem value="1">Solo Operator</SelectItem>
                                <SelectItem value="2-5">2-5 staff</SelectItem>
                                <SelectItem value="6-15">6-15 staff</SelectItem>
                                <SelectItem value="15-plus">15+ staff</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Business Description
                    </Label>
                    <Textarea
                        id="description"
                        rows={4}
                        value={formData.businessDescription}
                        onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                        placeholder="Describe your specialties and experience..."
                        className="rounded-xl border-gray-200 min-h-[120px]"
                    />
                </div>
            </Card>
        </div>
    );
}
