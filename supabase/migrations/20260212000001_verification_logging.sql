-- Migration: Create Verification Activity Logs Table
-- Created: 2026-02-12
-- Purpose: Track all verification attempts, AI decisions, and scores for audit and user history.

CREATE TABLE IF NOT EXISTS public.verification_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('tour_operator', 'hotel_manager')),
    event_type TEXT NOT NULL CHECK (event_type IN ('document_validation', 'biometric_match', 'manual_review', 'status_change')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'pending', 'flagged')),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.verification_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own verification logs"
    ON public.verification_activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_verification_logs_user_id ON public.verification_activity_logs(user_id);
CREATE INDEX idx_verification_logs_created_at ON public.verification_activity_logs(created_at DESC);

-- Function to easily log events from application
COMMENT ON TABLE public.verification_activity_logs IS 'Audit trail for partner verification events and AI decisions.';
