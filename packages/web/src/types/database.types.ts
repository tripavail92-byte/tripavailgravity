export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_settings: {
        Row: {
          allow_messages_from_anyone: boolean | null
          booking_reminders: boolean | null
          created_at: string
          currency: string | null
          email_notifications_enabled: boolean | null
          language: string | null
          marketing_emails: boolean | null
          profile_visibility: string | null
          push_notifications_enabled: boolean | null
          share_location_with_hosts: boolean | null
          show_activity: boolean | null
          sms_notifications_enabled: boolean | null
          theme: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_messages_from_anyone?: boolean | null
          booking_reminders?: boolean | null
          created_at?: string
          currency?: string | null
          email_notifications_enabled?: boolean | null
          language?: string | null
          marketing_emails?: boolean | null
          profile_visibility?: string | null
          push_notifications_enabled?: boolean | null
          share_location_with_hosts?: boolean | null
          show_activity?: boolean | null
          sms_notifications_enabled?: boolean | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_messages_from_anyone?: boolean | null
          booking_reminders?: boolean | null
          created_at?: string
          currency?: string | null
          email_notifications_enabled?: boolean | null
          language?: string | null
          marketing_emails?: boolean | null
          profile_visibility?: string | null
          push_notifications_enabled?: boolean | null
          share_location_with_hosts?: boolean | null
          show_activity?: boolean | null
          sms_notifications_enabled?: boolean | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_action_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_state: Json | null
          previous_state: Json | null
          reason: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          reason?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_action_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_login_logs: {
        Row: {
          admin_id: string
          id: string
          ip_address: string | null
          login_at: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          admin_id: string
          id?: string
          ip_address?: string | null
          login_at?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_id?: string
          id?: string
          ip_address?: string | null
          login_at?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_login_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["admin_role_enum"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role: Database["public"]["Enums"]["admin_role_enum"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role_enum"]
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          email: string
          id: string
          sent_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          email: string
          id?: string
          sent_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          sent_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      hotel_manager_profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status_enum"]
          bank_info: Json | null
          business_address: string | null
          business_license: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          ownership_type: string | null
          phone_number: string | null
          profile_picture_url: string | null
          property_address: string | null
          property_name: string | null
          registration_number: string | null
          setup_completed: boolean | null
          status_reason: string | null
          status_updated_at: string | null
          status_updated_by: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          verification_urls: Json | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          bank_info?: Json | null
          business_address?: string | null
          business_license?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          ownership_type?: string | null
          phone_number?: string | null
          profile_picture_url?: string | null
          property_address?: string | null
          property_name?: string | null
          registration_number?: string | null
          setup_completed?: boolean | null
          status_reason?: string | null
          status_updated_at?: string | null
          status_updated_by?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          verification_documents?: Json | null
          verification_urls?: Json | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          bank_info?: Json | null
          business_address?: string | null
          business_license?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          ownership_type?: string | null
          phone_number?: string | null
          profile_picture_url?: string | null
          property_address?: string | null
          property_name?: string | null
          registration_number?: string | null
          setup_completed?: boolean | null
          status_reason?: string | null
          status_updated_at?: string | null
          status_updated_by?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          verification_documents?: Json | null
          verification_urls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_manager_profiles_status_updated_by_fkey"
            columns: ["status_updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_manager_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_manager_settings: {
        Row: {
          bank_account_number: string | null
          bank_routing_number: string | null
          base_price_per_night: number | null
          booking_notifications: boolean | null
          business_email: string | null
          business_name: string | null
          business_phone: string | null
          business_registration_number: string | null
          cancellation_days_before: number | null
          cancellation_policy: string | null
          created_at: string
          currency: string | null
          manager_id: string
          messaging_notifications: boolean | null
          payment_method: string | null
          payment_notifications: boolean | null
          payment_verified: boolean | null
          pricing_strategy: string | null
          property_id: string | null
          review_notifications: boolean | null
          stripe_account_id: string | null
          tax_id: string | null
          track_analytics: boolean | null
          two_factor_enabled: boolean | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          bank_account_number?: string | null
          bank_routing_number?: string | null
          base_price_per_night?: number | null
          booking_notifications?: boolean | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_registration_number?: string | null
          cancellation_days_before?: number | null
          cancellation_policy?: string | null
          created_at?: string
          currency?: string | null
          manager_id: string
          messaging_notifications?: boolean | null
          payment_method?: string | null
          payment_notifications?: boolean | null
          payment_verified?: boolean | null
          pricing_strategy?: string | null
          property_id?: string | null
          review_notifications?: boolean | null
          stripe_account_id?: string | null
          tax_id?: string | null
          track_analytics?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          bank_account_number?: string | null
          bank_routing_number?: string | null
          base_price_per_night?: number | null
          booking_notifications?: boolean | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_registration_number?: string | null
          cancellation_days_before?: number | null
          cancellation_policy?: string | null
          created_at?: string
          currency?: string | null
          manager_id?: string
          messaging_notifications?: boolean | null
          payment_method?: string | null
          payment_notifications?: boolean | null
          payment_verified?: boolean | null
          pricing_strategy?: string | null
          property_id?: string | null
          review_notifications?: boolean | null
          stripe_account_id?: string | null
          tax_id?: string | null
          track_analytics?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      hotels: {
        Row: {
          address: string | null
          amenities: string[] | null
          area: string | null
          base_price_per_night: number
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          description: string | null
          draft_data: Json | null
          id: string
          image_urls: string[] | null
          images: Json | null
          is_published: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          main_image_url: string | null
          name: string
          owner_id: string
          policies: Json | null
          property_type: string | null
          rating: number | null
          review_count: number | null
          services: Json | null
          star_rating: number | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          base_price_per_night: number
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          draft_data?: Json | null
          id?: string
          image_urls?: string[] | null
          images?: Json | null
          is_published?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          main_image_url?: string | null
          name: string
          owner_id: string
          policies?: Json | null
          property_type?: string | null
          rating?: number | null
          review_count?: number | null
          services?: Json | null
          star_rating?: number | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          base_price_per_night?: number
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          draft_data?: Json | null
          id?: string
          image_urls?: string[] | null
          images?: Json | null
          is_published?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          main_image_url?: string | null
          name?: string
          owner_id?: string
          policies?: Json | null
          property_type?: string | null
          rating?: number | null
          review_count?: number | null
          services?: Json | null
          star_rating?: number | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      package_bookings: {
        Row: {
          booking_date: string | null
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          expires_at: string | null
          guest_count: number
          id: string
          metadata: Json | null
          number_of_nights: number | null
          package_id: string
          paid_at: string | null
          payment_metadata: Json | null
          payment_method: string | null
          payment_status: string | null
          price_per_night: number | null
          status: string | null
          stripe_payment_intent_id: string | null
          total_price: number
          traveler_id: string
          updated_at: string | null
        }
        Insert: {
          booking_date?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          expires_at?: string | null
          guest_count?: number
          id?: string
          metadata?: Json | null
          number_of_nights?: number | null
          package_id: string
          paid_at?: string | null
          payment_metadata?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          price_per_night?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_price: number
          traveler_id: string
          updated_at?: string | null
        }
        Update: {
          booking_date?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          expires_at?: string | null
          guest_count?: number
          id?: string
          metadata?: Json | null
          number_of_nights?: number | null
          package_id?: string
          paid_at?: string | null
          payment_metadata?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          price_per_night?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_price?: number
          traveler_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_bookings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          base_price_per_night: number | null
          cancellation_policy: string | null
          cover_image: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          discount_offers: Json | null
          exclusions: string[] | null
          free_inclusions: Json | null
          highlights: string[] | null
          hotel_id: string | null
          id: string
          inclusions: string[] | null
          is_published: boolean | null
          max_guests: number | null
          maximum_nights: number | null
          media_urls: string[] | null
          minimum_nights: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          name: string
          owner_id: string
          package_type: string
          payment_terms: string | null
          room_configuration: Json | null
          room_ids: string[] | null
          rooms_config: Json | null
          slug: string | null
          status: Database["public"]["Enums"]["moderation_status_enum"]
          updated_at: string | null
        }
        Insert: {
          base_price_per_night?: number | null
          cancellation_policy?: string | null
          cover_image?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_offers?: Json | null
          exclusions?: string[] | null
          free_inclusions?: Json | null
          highlights?: string[] | null
          hotel_id?: string | null
          id?: string
          inclusions?: string[] | null
          is_published?: boolean | null
          max_guests?: number | null
          maximum_nights?: number | null
          media_urls?: string[] | null
          minimum_nights?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          name: string
          owner_id: string
          package_type: string
          payment_terms?: string | null
          room_configuration?: Json | null
          room_ids?: string[] | null
          rooms_config?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["moderation_status_enum"]
          updated_at?: string | null
        }
        Update: {
          base_price_per_night?: number | null
          cancellation_policy?: string | null
          cover_image?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_offers?: Json | null
          exclusions?: string[] | null
          free_inclusions?: Json | null
          highlights?: string[] | null
          hotel_id?: string | null
          id?: string
          inclusions?: string[] | null
          is_published?: boolean | null
          max_guests?: number | null
          maximum_nights?: number | null
          media_urls?: string[] | null
          minimum_nights?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          name?: string
          owner_id?: string
          package_type?: string
          payment_terms?: string | null
          room_configuration?: Json | null
          room_ids?: string[] | null
          rooms_config?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["moderation_status_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          booking_id: string
          booking_type: string
          created_at: string | null
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          booking_type: string
          created_at?: string | null
          error_message?: string | null
          event_data: Json
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          booking_type?: string
          created_at?: string | null
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          otp: string
          phone: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          otp: string
          phone: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          otp?: string
          phone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status_enum"]
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          phone_verified: boolean | null
          status_reason: string | null
          status_updated_at: string | null
          status_updated_by: string | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          email_verified?: boolean | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          status_reason?: string | null
          status_updated_at?: string | null
          status_updated_by?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          status_reason?: string | null
          status_updated_at?: string | null
          status_updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_status_updated_by_fkey"
            columns: ["status_updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          report_reason: string
          reporter_id: string | null
          status: Database["public"]["Enums"]["report_status_enum"]
          status_reason: string | null
          status_updated_at: string | null
          status_updated_by: string | null
          target_entity_id: string
          target_entity_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          report_reason: string
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status_enum"]
          status_reason?: string | null
          status_updated_at?: string | null
          status_updated_by?: string | null
          target_entity_id: string
          target_entity_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          report_reason?: string
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status_enum"]
          status_reason?: string | null
          status_updated_at?: string | null
          status_updated_by?: string | null
          target_entity_id?: string
          target_entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_status_updated_by_fkey"
            columns: ["status_updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          bed_config: Json | null
          capacity_adults: number | null
          capacity_children: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          hotel_id: string | null
          id: string
          images: Json | null
          initial_stock: number | null
          name: string
          price_override: number | null
          room_type: string | null
          size_sqm: number | null
        }
        Insert: {
          amenities?: string[] | null
          bed_config?: Json | null
          capacity_adults?: number | null
          capacity_children?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          hotel_id?: string | null
          id?: string
          images?: Json | null
          initial_stock?: number | null
          name: string
          price_override?: number | null
          room_type?: string | null
          size_sqm?: number | null
        }
        Update: {
          amenities?: string[] | null
          bed_config?: Json | null
          capacity_adults?: number | null
          capacity_children?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          hotel_id?: string | null
          id?: string
          images?: Json | null
          initial_stock?: number | null
          name?: string
          price_override?: number | null
          room_type?: string | null
          size_sqm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_bookings: {
        Row: {
          booking_date: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          pax_count: number
          payment_metadata: Json | null
          payment_method: string | null
          payment_status: string | null
          schedule_id: string
          status: string | null
          stripe_payment_intent_id: string | null
          total_price: number
          tour_id: string
          traveler_id: string
        }
        Insert: {
          booking_date?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          pax_count?: number
          payment_metadata?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          schedule_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_price: number
          tour_id: string
          traveler_id: string
        }
        Update: {
          booking_date?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          pax_count?: number
          payment_metadata?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          schedule_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_price?: number
          tour_id?: string
          traveler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_bookings_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "tour_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_operator_profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status_enum"]
          categories: string[] | null
          company_logo_url: string | null
          company_name: string | null
          contact_person: string | null
          coverage_range: string | null
          created_at: string | null
          description: string | null
          email: string | null
          first_name: string | null
          insurance_certificate: string | null
          last_name: string | null
          operator_license: string | null
          phone_number: string | null
          policies: Json | null
          primary_city: string | null
          profile_picture_url: string | null
          registration_number: string | null
          setup_completed: boolean | null
          status_reason: string | null
          status_updated_at: string | null
          status_updated_by: string | null
          team_size: string | null
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          verification_urls: Json | null
          years_experience: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          categories?: string[] | null
          company_logo_url?: string | null
          company_name?: string | null
          contact_person?: string | null
          coverage_range?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          first_name?: string | null
          insurance_certificate?: string | null
          last_name?: string | null
          operator_license?: string | null
          phone_number?: string | null
          policies?: Json | null
          primary_city?: string | null
          profile_picture_url?: string | null
          registration_number?: string | null
          setup_completed?: boolean | null
          status_reason?: string | null
          status_updated_at?: string | null
          status_updated_by?: string | null
          team_size?: string | null
          updated_at?: string | null
          user_id: string
          verification_documents?: Json | null
          verification_urls?: Json | null
          years_experience?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status_enum"]
          categories?: string[] | null
          company_logo_url?: string | null
          company_name?: string | null
          contact_person?: string | null
          coverage_range?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          first_name?: string | null
          insurance_certificate?: string | null
          last_name?: string | null
          operator_license?: string | null
          phone_number?: string | null
          policies?: Json | null
          primary_city?: string | null
          profile_picture_url?: string | null
          registration_number?: string | null
          setup_completed?: boolean | null
          status_reason?: string | null
          status_updated_at?: string | null
          status_updated_by?: string | null
          team_size?: string | null
          updated_at?: string | null
          user_id?: string
          verification_documents?: Json | null
          verification_urls?: Json | null
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_operator_profiles_status_updated_by_fkey"
            columns: ["status_updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_operator_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_operator_settings: {
        Row: {
          bank_account_number: string | null
          base_tour_price: number | null
          booking_notifications: boolean | null
          business_email: string | null
          business_name: string | null
          business_phone: string | null
          business_registration_number: string | null
          cancellation_days_before: number | null
          cancellation_policy: string | null
          created_at: string
          currency: string | null
          max_group_size: number | null
          messaging_notifications: boolean | null
          operator_id: string
          pause_bookings: boolean | null
          payment_method: string | null
          payment_notifications: boolean | null
          payment_verified: boolean | null
          pricing_strategy: string | null
          refund_percentage: number | null
          review_notifications: boolean | null
          stripe_account_id: string | null
          tax_id: string | null
          tour_reminders: boolean | null
          track_analytics: boolean | null
          track_bookings: boolean | null
          two_factor_enabled: boolean | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          bank_account_number?: string | null
          base_tour_price?: number | null
          booking_notifications?: boolean | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_registration_number?: string | null
          cancellation_days_before?: number | null
          cancellation_policy?: string | null
          created_at?: string
          currency?: string | null
          max_group_size?: number | null
          messaging_notifications?: boolean | null
          operator_id: string
          pause_bookings?: boolean | null
          payment_method?: string | null
          payment_notifications?: boolean | null
          payment_verified?: boolean | null
          pricing_strategy?: string | null
          refund_percentage?: number | null
          review_notifications?: boolean | null
          stripe_account_id?: string | null
          tax_id?: string | null
          tour_reminders?: boolean | null
          track_analytics?: boolean | null
          track_bookings?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          bank_account_number?: string | null
          base_tour_price?: number | null
          booking_notifications?: boolean | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_registration_number?: string | null
          cancellation_days_before?: number | null
          cancellation_policy?: string | null
          created_at?: string
          currency?: string | null
          max_group_size?: number | null
          messaging_notifications?: boolean | null
          operator_id?: string
          pause_bookings?: boolean | null
          payment_method?: string | null
          payment_notifications?: boolean | null
          payment_verified?: boolean | null
          pricing_strategy?: string | null
          refund_percentage?: number | null
          review_notifications?: boolean | null
          stripe_account_id?: string | null
          tax_id?: string | null
          tour_reminders?: boolean | null
          track_analytics?: boolean | null
          track_bookings?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      tour_schedules: {
        Row: {
          booked_count: number | null
          capacity: number
          created_at: string | null
          end_time: string
          id: string
          price_override: number | null
          start_time: string
          status: string | null
          tour_id: string
        }
        Insert: {
          booked_count?: number | null
          capacity: number
          created_at?: string | null
          end_time: string
          id?: string
          price_override?: number | null
          start_time: string
          status?: string | null
          tour_id: string
        }
        Update: {
          booked_count?: number | null
          capacity?: number
          created_at?: string | null
          end_time?: string
          id?: string
          price_override?: number | null
          start_time?: string
          status?: string | null
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_schedules_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          cancellation_policy: string | null
          created_at: string | null
          currency: string
          deleted_at: string | null
          deposit_percentage: number | null
          deposit_required: boolean | null
          description: string | null
          difficulty_level: string | null
          draft_data: Json | null
          duration: string
          exclusions: string[] | null
          group_discounts: boolean | null
          highlights: string[] | null
          id: string
          images: Json | null
          inclusions: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          is_verified: boolean | null
          itinerary: Json | null
          languages: string[] | null
          location: Json
          max_age: number | null
          max_participants: number | null
          min_age: number | null
          min_participants: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          off_season_multiplier: number | null
          operator_id: string
          peak_season_multiplier: number | null
          price: number
          pricing_tiers: Json | null
          rating: number | null
          requirements: string[] | null
          review_count: number | null
          schedules: Json | null
          seasonal_pricing: boolean | null
          short_description: string | null
          slug: string | null
          status: Database["public"]["Enums"]["moderation_status_enum"]
          title: string
          tour_type: string
          updated_at: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          created_at?: string | null
          currency?: string
          deleted_at?: string | null
          deposit_percentage?: number | null
          deposit_required?: boolean | null
          description?: string | null
          difficulty_level?: string | null
          draft_data?: Json | null
          duration: string
          exclusions?: string[] | null
          group_discounts?: boolean | null
          highlights?: string[] | null
          id?: string
          images?: Json | null
          inclusions?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_verified?: boolean | null
          itinerary?: Json | null
          languages?: string[] | null
          location?: Json
          max_age?: number | null
          max_participants?: number | null
          min_age?: number | null
          min_participants?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          off_season_multiplier?: number | null
          operator_id: string
          peak_season_multiplier?: number | null
          price?: number
          pricing_tiers?: Json | null
          rating?: number | null
          requirements?: string[] | null
          review_count?: number | null
          schedules?: Json | null
          seasonal_pricing?: boolean | null
          short_description?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["moderation_status_enum"]
          title: string
          tour_type: string
          updated_at?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          created_at?: string | null
          currency?: string
          deleted_at?: string | null
          deposit_percentage?: number | null
          deposit_required?: boolean | null
          description?: string | null
          difficulty_level?: string | null
          draft_data?: Json | null
          duration?: string
          exclusions?: string[] | null
          group_discounts?: boolean | null
          highlights?: string[] | null
          id?: string
          images?: Json | null
          inclusions?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_verified?: boolean | null
          itinerary?: Json | null
          languages?: string[] | null
          location?: Json
          max_age?: number | null
          max_participants?: number | null
          min_age?: number | null
          min_participants?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          off_season_multiplier?: number | null
          operator_id?: string
          peak_season_multiplier?: number | null
          price?: number
          pricing_tiers?: Json | null
          rating?: number | null
          requirements?: string[] | null
          review_count?: number | null
          schedules?: Json | null
          seasonal_pricing?: boolean | null
          short_description?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["moderation_status_enum"]
          title?: string
          tour_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      traveller_profiles: {
        Row: {
          created_at: string | null
          loyalty_points: number | null
          preferences: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          loyalty_points?: number | null
          preferences?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          loyalty_points?: number | null
          preferences?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveller_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          enabled_at: string | null
          id: string
          is_active: boolean | null
          profile_completion: number | null
          role_type: string
          user_id: string | null
          verification_status: string | null
        }
        Insert: {
          enabled_at?: string | null
          id?: string
          is_active?: boolean | null
          profile_completion?: number | null
          role_type: string
          user_id?: string | null
          verification_status?: string | null
        }
        Update: {
          enabled_at?: string | null
          id?: string
          is_active?: boolean | null
          profile_completion?: number | null
          role_type?: string
          user_id?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      verification_activity_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          role: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          created_at: string | null
          id: string
          meta_info: Json | null
          payload: Json
          processed: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meta_info?: Json | null
          payload: Json
          processed?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meta_info?: Json | null
          payload?: Json
          processed?: boolean | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_profiles_with_auth: {
        Row: {
          address: string | null
          auth_email: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          email_confirmed_at: string | null
          email_verified: boolean | null
          first_name: string | null
          id: string | null
          last_name: string | null
          last_sign_in_at: string | null
          phone: string | null
          phone_verified: boolean | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_log_action: {
        Args: {
          p_action_type: string
          p_entity_id: string
          p_entity_type: string
          p_new_state: Json
          p_previous_state: Json
          p_reason: string
        }
        Returns: string
      }
      admin_log_login:
        | {
            Args: { p_ip_address?: string; p_user_agent?: string }
            Returns: undefined
          }
        | {
            Args: {
              p_ip_address?: string
              p_session_id?: string
              p_user_agent?: string
            }
            Returns: undefined
          }
      admin_moderate_package: {
        Args: {
          p_package_id: string
          p_reason: string
          p_status: Database["public"]["Enums"]["moderation_status_enum"]
        }
        Returns: {
          base_price_per_night: number | null
          cancellation_policy: string | null
          cover_image: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          discount_offers: Json | null
          exclusions: string[] | null
          free_inclusions: Json | null
          highlights: string[] | null
          hotel_id: string | null
          id: string
          inclusions: string[] | null
          is_published: boolean | null
          max_guests: number | null
          maximum_nights: number | null
          media_urls: string[] | null
          minimum_nights: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          name: string
          owner_id: string
          package_type: string
          payment_terms: string | null
          room_configuration: Json | null
          room_ids: string[] | null
          rooms_config: Json | null
          slug: string | null
          status: Database["public"]["Enums"]["moderation_status_enum"]
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "packages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_moderate_tour: {
        Args: {
          p_reason: string
          p_status: Database["public"]["Enums"]["moderation_status_enum"]
          p_tour_id: string
        }
        Returns: {
          cancellation_policy: string | null
          created_at: string | null
          currency: string
          deleted_at: string | null
          deposit_percentage: number | null
          deposit_required: boolean | null
          description: string | null
          difficulty_level: string | null
          draft_data: Json | null
          duration: string
          exclusions: string[] | null
          group_discounts: boolean | null
          highlights: string[] | null
          id: string
          images: Json | null
          inclusions: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          is_verified: boolean | null
          itinerary: Json | null
          languages: string[] | null
          location: Json
          max_age: number | null
          max_participants: number | null
          min_age: number | null
          min_participants: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          off_season_multiplier: number | null
          operator_id: string
          peak_season_multiplier: number | null
          price: number
          pricing_tiers: Json | null
          rating: number | null
          requirements: string[] | null
          review_count: number | null
          schedules: Json | null
          seasonal_pricing: boolean | null
          short_description: string | null
          slug: string | null
          status: Database["public"]["Enums"]["moderation_status_enum"]
          title: string
          tour_type: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tours"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_hotel_manager_status: {
        Args: {
          p_reason: string
          p_status: Database["public"]["Enums"]["account_status_enum"]
          p_user_id: string
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status_enum"]
          bank_info: Json | null
          business_address: string | null
          business_license: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          ownership_type: string | null
          phone_number: string | null
          profile_picture_url: string | null
          property_address: string | null
          property_name: string | null
          registration_number: string | null
          setup_completed: boolean | null
          status_reason: string | null
          status_updated_at: string | null
          status_updated_by: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          verification_urls: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "hotel_manager_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_report_status: {
        Args: {
          p_reason: string
          p_report_id: string
          p_status: Database["public"]["Enums"]["report_status_enum"]
        }
        Returns: {
          created_at: string
          details: string | null
          id: string
          report_reason: string
          reporter_id: string | null
          status: Database["public"]["Enums"]["report_status_enum"]
          status_reason: string | null
          status_updated_at: string | null
          status_updated_by: string | null
          target_entity_id: string
          target_entity_type: string
        }
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_tour_operator_status: {
        Args: {
          p_reason: string
          p_status: Database["public"]["Enums"]["account_status_enum"]
          p_user_id: string
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status_enum"]
          categories: string[] | null
          company_logo_url: string | null
          company_name: string | null
          contact_person: string | null
          coverage_range: string | null
          created_at: string | null
          description: string | null
          email: string | null
          first_name: string | null
          insurance_certificate: string | null
          last_name: string | null
          operator_license: string | null
          phone_number: string | null
          policies: Json | null
          primary_city: string | null
          profile_picture_url: string | null
          registration_number: string | null
          setup_completed: boolean | null
          status_reason: string | null
          status_updated_at: string | null
          status_updated_by: string | null
          team_size: string | null
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          verification_urls: Json | null
          years_experience: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tour_operator_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_traveler_status: {
        Args: {
          p_reason: string
          p_status: Database["public"]["Enums"]["account_status_enum"]
          p_user_id: string
        }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status_enum"]
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          phone_verified: boolean | null
          status_reason: string | null
          status_updated_at: string | null
          status_updated_by: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_package_price: {
        Args: {
          check_in_param: string
          check_out_param: string
          package_id_param: string
        }
        Returns: {
          number_of_nights: number
          price_per_night: number
          total_price: number
        }[]
      }
      check_package_availability: {
        Args: {
          check_in_param: string
          check_out_param: string
          package_id_param: string
        }
        Returns: boolean
      }
      create_package_booking_atomic: {
        Args: {
          check_in_param: string
          check_out_param: string
          guest_count_param: number
          package_id_param: string
          traveler_id_param: string
        }
        Returns: string
      }
      delete_expired_otps: { Args: never; Returns: undefined }
      expire_package_bookings: {
        Args: never
        Returns: {
          expired_count: number
        }[]
      }
      generate_slug: { Args: { title: string }; Returns: string }
      get_admin_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["admin_role_enum"]
      }
      get_available_slots: {
        Args: { schedule_id_param: string }
        Returns: number
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      switch_user_role: {
        Args: { p_role_type: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      account_status_enum: "active" | "suspended" | "deleted"
      admin_role_enum: "super_admin" | "moderator" | "support"
      moderation_status_enum: "live" | "hidden" | "suspended" | "deleted"
      report_status_enum: "open" | "in_review" | "resolved" | "dismissed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status_enum: ["active", "suspended", "deleted"],
      admin_role_enum: ["super_admin", "moderator", "support"],
      moderation_status_enum: ["live", "hidden", "suspended", "deleted"],
      report_status_enum: ["open", "in_review", "resolved", "dismissed"],
    },
  },
} as const
