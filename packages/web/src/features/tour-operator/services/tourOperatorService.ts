import { supabase } from '../../../../../shared/src/core/client';

export interface TourOperatorOnboardingData {
    personalInfo?: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        contactPerson: string;
    };
    profilePicture?: string;
    businessInfo?: {
        companyLogo: string;
        businessName: string;
        yearsInBusiness: string;
        teamSize: string;
        description: string;
    };
    services?: {
        categories: string[];
        customServices: string[];
    };
    coverage?: {
        primaryCity: string;
        range: string;
    };
    policies?: {
        accepted: boolean;
        mode: 'templates' | 'upload';
        custom: Record<string, string>;
        uploads: Record<string, boolean>;
    };
    verification?: {
        uploads: Record<string, boolean>;
    };
}

export const tourOperatorService = {
    async saveOnboardingData(userId: string, data: Partial<TourOperatorOnboardingData>, setupCompleted: boolean = false) {
        if (!userId) throw new Error('User ID required');

        const profilePayload = {
            user_id: userId,
            first_name: data.personalInfo?.firstName,
            last_name: data.personalInfo?.lastName,
            email: data.personalInfo?.email,
            phone_number: data.personalInfo?.phoneNumber,
            contact_person: data.personalInfo?.contactPerson,
            profile_picture_url: data.profilePicture,
            company_logo_url: data.businessInfo?.companyLogo,
            company_name: data.businessInfo?.businessName,
            years_experience: data.businessInfo?.yearsInBusiness,
            team_size: data.businessInfo?.teamSize,
            description: data.businessInfo?.description,
            categories: data.services?.categories,
            primary_city: data.coverage?.primaryCity,
            coverage_range: data.coverage?.range,
            policies: data.policies,
            verification_documents: data.verification?.uploads,
            setup_completed: setupCompleted,
            updated_at: new Date().toISOString()
        };

        try {
            console.log('📤 Saving tour operator profile:', profilePayload);
            const { error } = await supabase
                .from('tour_operator_profiles')
                .upsert(profilePayload);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('❌ Error saving tour operator profile:', error);
            throw error;
        }
    },

    async getOnboardingData(userId: string) {
        if (!userId) throw new Error('User ID required');

        try {
            const { data, error } = await supabase
                .from('tour_operator_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (!data) return null;

            // Map DB columns back to frontend structure
            const profile = data as any;
            const onboardingData: TourOperatorOnboardingData = {
                personalInfo: {
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    email: profile.email || '',
                    phoneNumber: profile.phone_number || '',
                    contactPerson: profile.contact_person || '',
                },
                profilePicture: profile.profile_picture_url,
                businessInfo: {
                    companyLogo: profile.company_logo_url || '',
                    businessName: profile.company_name || '',
                    yearsInBusiness: profile.years_experience || '',
                    teamSize: profile.team_size || '',
                    description: profile.description || '',
                },
                services: {
                    categories: profile.categories || [],
                    customServices: []
                },
                coverage: {
                    primaryCity: profile.primary_city || '',
                    range: profile.coverage_range || ''
                },
                policies: profile.policies,
                verification: {
                    uploads: profile.verification_documents || {}
                }
            };

            return onboardingData;
        } catch (error) {
            console.error('❌ Error fetching tour operator profile:', error);
            throw error;
        }
    },

    async uploadAsset(userId: string, file: File, folder: string) {
        if (!userId) throw new Error('User ID required');

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${userId}/${folder}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('tour-operator-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('tour-operator-assets')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('❌ Error uploading asset:', error);
            throw error;
        }
    }
};
