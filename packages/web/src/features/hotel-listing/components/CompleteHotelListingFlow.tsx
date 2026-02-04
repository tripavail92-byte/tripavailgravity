import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CompleteHotelListingFlowProps {
    initialPropertyType: string;
}

export function CompleteHotelListingFlow({ initialPropertyType }: CompleteHotelListingFlowProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h1 className="text-3xl font-bold mb-4">List Your Hotel</h1>
                <p className="text-gray-600 mb-8">Starting flow for: <span className="font-semibold capitalize">{initialPropertyType}</span></p>

                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                    <h2 className="text-xl font-semibold mb-4">Step {currentStep}: Property Type</h2>
                    <p className="mb-6">This is a placeholder for the full 13-step wizard.</p>

                    <div className="flex justify-between">
                        <button
                            onClick={() => navigate('/manager/dashboard')}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                            disabled
                        >
                            Next
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
