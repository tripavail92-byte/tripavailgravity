import { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Upload, FileText, Loader2, Check } from 'lucide-react';
import { hotelManagerService } from '@/features/hotel-manager/services/hotelManagerService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function BusinessLicenseStep({ onUpdate, data }: StepProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState(data.businessInfo || {
        businessName: '',
        registrationNumber: '',
        businessAddress: '',
    });
    const [uploads, setUploads] = useState<Record<string, string>>(data.verification?.businessDocs || {});
    const [isUploading, setIsUploading] = useState<string | null>(null);

    const handleInputChange = (field: string, value: string) => {
        const next = { ...formData, [field]: value };
        setFormData(next);
        onUpdate({ businessInfo: next });
    };

    const handleUpload = async (id: string, file: File) => {
        if (!user?.id) return;
        setIsUploading(id);
        try {
            const publicUrl = await hotelManagerService.uploadAsset(user.id, file, `verification/${id}`);
            const urls = { ...data.verification?.businessDocs, [id]: publicUrl };
            
            setUploads(urls);
            onUpdate({ 
                verification: { 
                    ...data.verification,
                    businessDocs: urls
                } 
            });
            toast.success('License uploaded!');
        } catch (error) {
            console.error('License upload error:', error);
            toast.error('Upload failed');
        } finally {
            setIsUploading(null);
        }
    };

    return (
        <div className="space-y-12">
            <div className="text-center flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-primary rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-primary/30 -rotate-6"
                >
                    <Building2 className="w-12 h-12" />
                </motion.div>
                <h3 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter uppercase italic">Business Details</h3>
                <p className="text-xl text-gray-500 max-w-md mx-auto leading-relaxed font-medium">Verify your registered business entity.</p>
            </div>

            <Card className="p-8 space-y-8 border-gray-100 shadow-sm rounded-[32px] bg-white ring-1 ring-black/[0.02]">
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Company Name</Label>
                    <Input
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        placeholder="Official registered name"
                        className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Registration Number</Label>
                    <Input
                        value={formData.registrationNumber}
                        onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                        placeholder="Tax ID or Business Registration No."
                        className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20"
                    />
                </div>

                <div className="pt-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1 mb-4 block">Business License Document</Label>
                    <div className={cn(
                        "p-6 border-2 border-dashed rounded-[24px] transition-all flex items-center justify-between",
                        uploads['business_license'] ? "bg-primary/[0.03] border-primary/20" : "bg-gray-50/50 border-gray-100"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                uploads['business_license'] ? "bg-primary text-white" : "bg-white text-gray-300"
                            )}>
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Registration Certificate</p>
                                <p className="text-xs text-gray-400 font-medium tracking-tight">PDF, JPG or PNG (Max 5MB)</p>
                            </div>
                        </div>

                        {uploads['business_license'] ? (
                            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                                <Check className="w-4 h-4 stroke-[3]" />
                                Uploaded
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="file"
                                    id="license-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload('business_license', file);
                                    }}
                                />
                                <Button asChild variant="outline" size="sm" className="rounded-xl border-gray-200 font-black h-10 px-5">
                                    <label htmlFor="license-upload" className="cursor-pointer">
                                        {isUploading === 'business_license' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    </label>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
