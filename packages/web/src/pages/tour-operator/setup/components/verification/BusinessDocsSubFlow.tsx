import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    FileText, 
    Upload, 
    Check, 
    Loader2, 
    Briefcase,
    FileCheck,
    ScrollText,
    ArrowRight
} from 'lucide-react';
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface BusinessDocsSubFlowProps {
    onComplete: (data: Record<string, string>) => void;
    initialData?: any;
}

const REQUIRED_DOCS = [
    { id: 'secp_certificate', title: 'SECP Certificate', desc: 'Company incorporation doc', icon: ScrollText },
    { id: 'tourism_license', title: 'Tourism License', desc: 'DTS government permit', icon: FileCheck },
    { id: 'tax_certificate', title: 'Tax Registration (NTN)', desc: 'FBR registration document', icon: FileText },
];

export function BusinessDocsSubFlow({ onComplete, initialData }: BusinessDocsSubFlowProps) {
    const { user } = useAuth();
    const [urls, setUrls] = useState<Record<string, string>>(initialData || {});
    const [isUploading, setIsUploading] = useState<string | null>(null);

    const handleUpload = async (id: string, file: File) => {
        if (!user?.id) return;
        setIsUploading(id);
        try {
            const url = await tourOperatorService.uploadAsset(user.id, file, `verification/${id}`);
            const nextUrls = { ...urls, [id]: url };
            setUrls(nextUrls);
            toast.success('Document uploaded!');
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setIsUploading(null);
        }
    };

    const isAllComplete = REQUIRED_DOCS.every(doc => !!urls[doc.id]);

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                    <Briefcase className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Business Credentials</h4>
                <p className="text-gray-500 mt-2 font-medium">Please provide your official registration documents to verify your business status.</p>
            </div>

            <div className="space-y-4">
                {REQUIRED_DOCS.map((doc) => (
                    <Card key={doc.id} className={cn(
                        "p-6 rounded-[32px] border-gray-100 transition-all",
                        urls[doc.id] ? "bg-primary/[0.03] border-primary/20" : "bg-white"
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                                    urls[doc.id] ? "bg-primary text-white" : "bg-gray-50 text-gray-400"
                                )}>
                                    <doc.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-extrabold text-gray-900 text-base">{doc.title}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{doc.desc}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <input
                                    type="file"
                                    id={`doc-${doc.id}`}
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(doc.id, e.target.files[0])}
                                    disabled={!!isUploading}
                                />
                                {urls[doc.id] ? (
                                    <div className="bg-white text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/10 flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Complete
                                    </div>
                                ) : (
                                    <Button asChild variant="outline" size="sm" className="rounded-xl border-gray-200 hover:border-primary font-black uppercase tracking-widest h-10 px-6">
                                        <label htmlFor={`doc-${doc.id}`} className="cursor-pointer">
                                            {isUploading === doc.id ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Upload className="mr-2 w-4 h-4" />}
                                            Upload
                                        </label>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-12 flex justify-center">
                <Button 
                    className="rounded-2xl h-14 bg-primary-gradient px-12 font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20 min-w-[300px]"
                    disabled={!isAllComplete}
                    onClick={() => onComplete(urls)}
                >
                    Finalize Verification <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
