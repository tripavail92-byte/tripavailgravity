import { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Upload, FileCheck, Info, Loader2, Check } from 'lucide-react';
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

const DOCUMENTS = [
    { id: 'business_reg', title: 'Business Registration', desc: 'Valid certificate of incorporation' },
    { id: 'tourism_license', title: 'Tourism License', desc: 'Government issued operator permit' },
    { id: 'id_verification', title: 'Identity Document', desc: 'Passport or National ID of owner' },
];

export function VerificationStep({ onUpdate, data }: StepProps) {
    const { user } = useAuth();
    const [uploads, setUploads] = useState<Record<string, boolean>>(data.verification?.uploads || {});
    const [isUploading, setIsUploading] = useState<string | null>(null);

    const handleUpload = async (id: string, file: File) => {
        if (!user?.id) return;

        setIsUploading(id);
        try {
            await tourOperatorService.uploadAsset(user.id, file, `verification/${id}`);
            const next = { ...uploads, [id]: true };
            setUploads(next);
            onUpdate({ verification: { uploads: next } });
            toast.success('Document uploaded!');
        } catch (error) {
            console.error('Verification upload error:', error);
            toast.error('Failed to upload document');
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
                    className="w-24 h-24 bg-primary rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-primary/30 rotate-3 transition-transform hover:rotate-0 duration-500"
                >
                    <ShieldCheck className="w-12 h-12" aria-hidden="true" />
                </motion.div>
                <h3 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter uppercase italic">Trust & Verification</h3>
                <p className="text-xl text-gray-500 max-w-md mx-auto leading-relaxed font-medium">Verify your business to earn the trusted badge and unlock full features.</p>
            </div>

            <div className="space-y-4">
                {DOCUMENTS.map((doc) => (
                    <Card key={doc.id} className={cn(
                        "p-6 border-gray-100 shadow-sm rounded-[32px] transition-all hover:shadow-xl hover:shadow-black/5 ring-1 ring-black/[0.01]",
                        uploads[doc.id] ? "bg-primary/[0.03] border-primary/20 shadow-lg shadow-primary/5" : "bg-white"
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                                    uploads[doc.id] ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "bg-gray-50 text-gray-400"
                                )}>
                                    <FileCheck className="w-7 h-7" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="font-extrabold text-gray-900 tracking-tight text-lg">{doc.title}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{doc.desc}</p>
                                </div>
                            </div>

                            {uploads[doc.id] ? (
                                <div className="bg-white text-primary px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-primary/10 flex items-center gap-2 shadow-sm">
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    Uploaded
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id={`upload-${doc.id}`}
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUpload(doc.id, file);
                                        }}
                                        disabled={!!isUploading}
                                        aria-label={`Upload ${doc.title}`}
                                    />
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="rounded-2xl border-gray-200 hover:border-primary hover:text-primary transition-all font-black uppercase tracking-widest h-11 px-6 shadow-sm hover:scale-105"
                                        disabled={!!isUploading}
                                    >
                                        <label htmlFor={`upload-${doc.id}`} className="cursor-pointer flex items-center">
                                            {isUploading === doc.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Upload className="w-4 h-4 mr-2" />
                                            )}
                                            {isUploading === doc.id ? 'Uploading...' : 'Upload'}
                                        </label>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-[32px] p-8 flex gap-6 mt-12 transition-colors hover:bg-blue-50">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-blue-100 flex-shrink-0 transition-transform hover:rotate-12">
                    <Info className="w-6 h-6 text-blue-500" />
                </div>
                <div className="space-y-2">
                    <p className="font-black text-blue-900 text-xs uppercase tracking-widest italic">Review Process</p>
                    <p className="text-sm text-blue-800/80 leading-relaxed font-medium">
                        Our compliance team will review your documents within 48-72 hours. You can still create drafts and partial packages while waiting for approval.
                    </p>
                </div>
            </div>
        </div>
    );
}
