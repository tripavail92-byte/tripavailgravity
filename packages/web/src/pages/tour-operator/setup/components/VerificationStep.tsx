import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Upload, FileCheck, Info, Loader2 } from 'lucide-react';
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

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
        <div className="space-y-6 w-full max-w-2xl mx-auto">
            <div className="mb-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-4">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Trust & Verification</h3>
                <p className="text-gray-600 max-w-sm text-center">Verify your business to earn the trusted badge and unlock full features.</p>
            </div>

            <div className="space-y-4">
                {DOCUMENTS.map((doc) => (
                    <Card key={doc.id} className={`p-6 border-gray-100 shadow-sm rounded-3xl transition-all ${uploads[doc.id] ? 'bg-primary/[0.02] border-primary/20' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${uploads[doc.id] ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <FileCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{doc.title}</p>
                                    <p className="text-xs text-gray-500">{doc.desc}</p>
                                </div>
                            </div>

                            {uploads[doc.id] ? (
                                <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-primary/20 flex items-center gap-2">
                                    <FileCheck className="w-3.5 h-3.5" />
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
                                    />
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl border-gray-200 hover:border-primary hover:text-primary transition-all font-semibold"
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

            <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 flex gap-4 mt-8">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <Info className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-gray-900 text-sm italic">Review Process</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Our compliance team will review your documents within 48-72 hours. You can still create drafts and partial packages while waiting for approval.
                    </p>
                </div>
            </div>
        </div>
    );
}
