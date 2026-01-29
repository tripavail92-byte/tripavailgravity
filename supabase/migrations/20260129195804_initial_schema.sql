-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('traveller', 'hotel_manager', 'tour_operator')),
  is_active BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  profile_completion INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'incomplete')),
  UNIQUE(user_id, role_type)
);

-- Constraint: Ensure only one partner role per user
CREATE OR REPLACE FUNCTION check_partner_role_exclusivity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role_type IN ('hotel_manager', 'tour_operator') THEN
    IF EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = NEW.user_id
      AND role_type IN ('hotel_manager', 'tour_operator')
      AND role_type != NEW.role_type
    ) THEN
      RAISE EXCEPTION 'User can only have one partner role (hotel_manager OR tour_operator)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_partner_role_exclusivity
  BEFORE INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION check_partner_role_exclusivity();

-- Traveller profiles
CREATE TABLE public.traveller_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotel Manager profiles
CREATE TABLE public.hotel_manager_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT,
  business_license TEXT,
  tax_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour Operator profiles
CREATE TABLE public.tour_operator_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT,
  operator_license TEXT,
  insurance_certificate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traveller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_operator_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own traveller profile" ON public.traveller_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own hotel manager profile" ON public.hotel_manager_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tour operator profile" ON public.tour_operator_profiles
  FOR SELECT USING (auth.uid() = user_id);
