import { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Upload, FileText, Loader2, Check, Info } from 'lucide-react';
import { hotelManagerService } from '@/features/hotel-manager/services/hotelManagerService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function PropertyOwnershipStep({ onUpdate, data }: StepProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState(data.propertyDetails || {
        propertyName: '',
        propertyAddress: '',
        ownershipType: 'owner',
    });
    const [uploads, setUploads] = useState<Record<string, boolean>>(data.verification?.uploads || {});
    const [isUploading, setIsUploading] = useState<string | null>(null);

    const handleInputChange = (field: string, value: string) => {
        const next = { ...formData, [field]: value };
        setFormData(next);
        onUpdate({ propertyDetails: next });
    };

    const handleUpload = async (id: string, file: File) => {
        if (!user?.id) return;
        setIsUploading(id);
        try {
            const publicUrl = await hotelManagerService.uploadAsset(user.id, file, `verification/${id}`);
            const nextUploads = { ...uploads, [id]: true };
            const nextUrls = { ...data.verification?.documentUrls, [id]: publicUrl };
            
            setUploads(nextUploads);
            onUpdate({ 
                verification: { 
                    uploads: nextUploads,
                    documentUrls: nextUrls
                } 
            });
            toast.success('Document uploaded!');
        } catch (error) {
            console.error('Property doc upload error:', error);
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
                    className="w-24 h-24 bg-primary rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-primary/30 rotate-6"
                >
                    <Home className="w-12 h-12" />
                </motion.div>
                <h3 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter uppercase italic">Property Link</h3>
                <p className="text-xl text-gray-500 max-w-md mx-auto leading-relaxed font-medium">Clear ownership or management rights for the property.</p>
            </div>

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

                <div className="pt-4 border-t border-gray-100">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1 mb-4 block">Ownership/Management Proof</Label>
                    <div className={cn(
                        "p-6 border-2 border-dashed rounded-[24px] transition-all flex items-center justify-between",
                        uploads['property_proof'] ? "bg-primary/[0.03] border-primary/20" : "bg-gray-50/50 border-gray-100"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                uploads['property_proof'] ? "bg-primary text-white" : "bg-white text-gray-300"
                            )}>
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Deed or Lease Agreement</p>
                                <p className="text-xs text-gray-400 font-medium tracking-tight">Contract or Ownership Docs</p>
                            </div>
                        </div>

                        {uploads['property_proof'] ? (
                            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                                <Check className="w-4 h-4 stroke-[3]" />
                                Uploaded
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="file"
                                    id="property-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload('property_proof', file);
                                    }}
                                />
                                <Button asChild variant="outline" size="sm" className="rounded-xl border-gray-200 font-black h-10 px-5">
                                    <label htmlFor="property-upload" className="cursor-pointer">
                                        {isUploading === 'property_proof' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    </label>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <div className="flex items-center gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Property verification typically takes 24 hours longer as it involves cross-referencing public records or conducting a quick phone interview.
                </p>
            </div>
        </div>
    );
}
