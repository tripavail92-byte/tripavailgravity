import { supabase } from '../../../../../shared/src/core/client';

export interface HotelManagerOnboardingData {
    personalInfo?: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
    };
    profilePicture?: string;
    businessInfo?: {
        businessName: string;
        registrationNumber: string;
        businessAddress: string;
    };
    propertyDetails?: {
        propertyName: string;
        propertyAddress: string;
        ownershipType: 'owner' | 'manager' | 'lease';
    };
    verification?: {
        uploads: Record<string, boolean>;
        documentUrls?: Record<string, string>;
    };
    bankInfo?: {
        bankName: string;
        accountHolder: string;
        accountNumber: string;
        routingNumber: string;
    };
}

export const hotelManagerService = {
    async saveOnboardingData(userId: string, data: Partial<HotelManagerOnboardingData>, setupCompleted: boolean = false) {
        if (!userId) throw new Error('User ID required');

        const profilePayload = {
            user_id: userId,
            first_name: data.personalInfo?.firstName,
            last_name: data.personalInfo?.lastName,
            email: data.personalInfo?.email,
            phone_number: data.personalInfo?.phoneNumber,
            profile_picture_url: data.profilePicture,
            business_name: data.businessInfo?.businessName,
            registration_number: data.businessInfo?.registrationNumber,
            business_address: data.businessInfo?.businessAddress,
            property_name: data.propertyDetails?.propertyName,
            property_address: data.propertyDetails?.propertyAddress,
            ownership_type: data.propertyDetails?.ownershipType,
            bank_info: data.bankInfo,
            verification_documents: data.verification?.uploads,
            verification_urls: data.verification?.documentUrls,
            setup_completed: setupCompleted,
            updated_at: new Date().toISOString()
        };

        try {
            console.log('📤 Saving hotel manager profile:', profilePayload);
            const { error } = await supabase
                .from('hotel_manager_profiles')
                .upsert(profilePayload);

            if (error) throw error;

            // If setup is completed, update the user_role status from 'incomplete' to 'pending'
            if (setupCompleted) {
                await supabase
                    .from('user_roles')
                    .update({ verification_status: 'pending' })
                    .eq('user_id', userId)
                    .eq('role_type', 'hotel_manager');
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Error saving hotel manager profile:', error);
            throw error;
        }
    },

    async getOnboardingData(userId: string) {
        if (!userId) throw new Error('User ID required');

        try {
            const { data, error } = await supabase
                .from('hotel_manager_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (!data) return null;

            const profile = data as any;
            return {
                personalInfo: {
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    email: profile.email || '',
                    phoneNumber: profile.phone_number || '',
                },
                profilePicture: profile.profile_picture_url,
                businessInfo: {
                    businessName: profile.business_name || '',
                    registrationNumber: profile.registration_number || '',
                    businessAddress: profile.business_address || '',
                },
                propertyDetails: {
                    propertyName: profile.property_name || '',
                    propertyAddress: profile.property_address || '',
                    ownershipType: profile.ownership_type || 'owner',
                },
                bankInfo: profile.bank_info || {},
                verification: {
                    uploads: profile.verification_documents || {},
                    documentUrls: profile.verification_urls || {}
                }
            } as HotelManagerOnboardingData;
        } catch (error) {
            console.error('❌ Error fetching hotel manager profile:', error);
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
                .from('hotel-manager-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('hotel-manager-assets')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error('❌ Error uploading asset:', error);
            throw error;
        }
    }
};
