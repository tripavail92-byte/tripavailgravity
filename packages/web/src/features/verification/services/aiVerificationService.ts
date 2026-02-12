import { supabase } from '../../../../../shared/src/core/client';

interface VerificationResult {
    success: boolean;
    score: number;
    match: boolean;
    reason?: string;
}

export const aiVerificationService = {
    /**
     * Helper to log verification activity to Supabase
     */
    async logActivity(params: {
        userId: string;
        role: 'tour_operator' | 'hotel_manager';
        eventType: 'document_validation' | 'biometric_match';
        status: 'success' | 'failure' | 'flagged';
        details: any;
    }) {
        try {
            await (supabase.from('verification_activity_logs' as any) as any).insert({
                user_id: params.userId,
                role: params.role,
                event_type: params.eventType,
                status: params.status,
                details: params.details
            });
        } catch (error) {
            console.error('Failed to log verification activity:', error);
        }
    },

    /**
     * Compare a selfie with an ID card photo
     * @param idCardUrl Public URL of the ID card image
     * @param selfieUrl Public URL of the selfie holding the ID
     */
    async compareFaceToId(
        idCardUrl: string, 
        selfieUrl: string, 
        userId: string, 
        role: 'tour_operator' | 'hotel_manager'
    ): Promise<VerificationResult> {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
        
        if (!apiKey) {
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
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Analyze these two images. Image 1 is a Government ID. Image 2 is a selfie of a person holding that ID. 1) Does the person in the selfie match the photo on the ID? 2) Is the person in the selfie CLEARLY holding the same ID card shown in Image 1? 3) Return a similarity score (0-100) and a detailed justification. Return ONLY a JSON object with keys: 'match' (boolean), 'score' (number), and 'reason' (string)."
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

            if (!response.ok) throw new Error('AI verification failed');

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);

            // Log activity
            await this.logActivity({
                userId,
                role,
                eventType: 'biometric_match',
                status: result.match ? 'success' : 'failure',
                details: { score: result.score, reason: result.reason }
            });

            return {
                success: true,
                score: result.score,
                match: result.match,
                reason: result.reason
            };
        } catch (error: any) {
            console.error('AI Matching Error:', error);
            return {
                success: false,
                score: 0,
                match: false,
                reason: error.message
            };
        }
    },

    /**
     * Validate if an uploaded image is a government ID
     */
    async validateIdCard(
        imageUrl: string,
        userId: string,
        role: 'tour_operator' | 'hotel_manager'
    ): Promise<{ valid: boolean; reason?: string }> {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
        
        if (!apiKey) {
            return { valid: true, reason: "Developer Mode: Simulated success" };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Analyze this image. Is it a valid government-issued ID (Passport, ID Card, or Driver's License)? Also check for quality: is it blurry, is there heavy glare, or is the document cut off? Return ONLY a JSON object with keys: 'valid' (boolean) and 'reason' (string, if invalid explaining why, if valid confirming document type)."
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: imageUrl }
                                }
                            ]
                        }
                    ],
                    max_tokens: 200,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error('AI validation failed');

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);

            // Log activity
            await this.logActivity({
                userId,
                role,
                eventType: 'document_validation',
                status: result.valid ? 'success' : 'failure',
                details: { reason: result.reason }
            });

            return {
                valid: result.valid,
                reason: result.reason
            };
        } catch (error: any) {
            console.error('AI Validation Error:', error);
            return { valid: false, reason: "Verification server busy. Please try again." };
        }
    }
};
