import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IdentitySubFlow } from '../../../shared/verification/IdentitySubFlow';
import { BusinessDocsSubFlow } from './verification/BusinessDocsSubFlow';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function VerificationStep({ onUpdate, data }: StepProps) {
    const [view, setView] = useState<'identity' | 'docs'>(
        data.verification?.matchingScore > 0 ? 'docs' : 'identity'
    );

    const handleIdentityComplete = (idData: { 
        idCardUrl: string; 
        selfieUrl: string; 
        matchingScore: number;
    }) => {
        onUpdate({
            verification: {
                ...data.verification,
                ...idData
            }
        });
        setView('docs');
    };

    const handleDocsComplete = (docs: Record<string, string>) => {
        onUpdate({
            verification: {
                ...data.verification,
                businessDocs: docs
            }
        });
        // The parent wizard will handle onNext via the main layout
    };

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {view === 'identity' ? (
                    <motion.div
                        key="identity-view"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        <IdentitySubFlow 
                            onComplete={handleIdentityComplete}
                            initialData={data.verification}
                            role="tour_operator"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="docs-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex justify-start mb-6">
                            <button 
                                onClick={() => setView('identity')}
                                className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:opacity-70 transition-opacity"
                            >
                                ← Back to Identity
                            </button>
                        </div>
                        <BusinessDocsSubFlow 
                            onComplete={handleDocsComplete}
                            initialData={data.verification?.businessDocs}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
