/**
 * AI Verification Service
 * Handles face-to-ID matching and document validation using OpenAI Vision
 */

import { toast } from 'react-hot-toast';

interface VerificationResult {
    success: boolean;
    score: number;
    match: boolean;
    reason?: string;
}

export const aiVerificationService = {
    /**
     * Compare a selfie with an ID card photo
     * @param idCardUrl Public URL of the ID card image
     * @param selfieUrl Public URL of the selfie holding the ID
     */
    async compareFaceToId(idCardUrl: string, selfieUrl: string): Promise<VerificationResult> {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
        
        if (!apiKey) {
            console.error('OpenAI API key missing');
            // Mock response for development if key is missing
            return {
                success: true,
                score: 85,
                match: true,
                reason: "Developer Mode: Simulated match"
            };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini", // Using mini for cost/speed, but can be gpt-4o
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Compare the person's face in the selfie (image 2) with the photo on the government ID card (image 1). Are they the same person? Provide a similarity score from 0 to 100 and a brief justification. Return ONLY a JSON object with keys: 'match' (boolean), 'score' (number), and 'reason' (string)."
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: idCardUrl }
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: selfieUrl }
                                }
                            ]
                        }
                    ],
                    max_tokens: 300,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'AI verification failed');
            }

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);

            return {
                success: true,
                score: result.score,
                match: result.match,
                reason: result.reason
            };
        } catch (error: any) {
            console.error('AI Matching Error:', error);
            toast.error('Face matching failed. Please ensure images are clear.');
            return {
                success: false,
                score: 0,
                match: false,
                reason: error.message
            };
        }
    }
};
