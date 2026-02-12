import { IdentitySubFlow } from '../../../shared/verification/IdentitySubFlow';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function IdentityStep({ onUpdate, data }: StepProps) {
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
        // The parent wizard handles onNext
    };

    return (
        <div className="space-y-6">
            <IdentitySubFlow 
                onComplete={handleIdentityComplete}
                initialData={data.verification}
                role="hotel_manager"
            />
        </div>
    );
}
