# TripAvail - Startup Guide (Week 0 & Week 1)

> **Document Purpose**: Step-by-step guide to start the TripAvail project from scratch.

---

## 🚀 QUICK START OVERVIEW

```
Week 0 (1-2 days)  → Lock product constraints
Week 1 (5-7 days)  → Project setup + Supabase foundation
Week 2+            → Backend development
```

**You are here**: Ready to start Week 0

---

## 📋 WEEK 0: PRODUCT CONSTRAINTS LOCK (1-2 DAYS)

### **Objective**: Lock all product rules in writing BEFORE any code

### **Step 1: Create Product Constraints Document**

Create: `d:\Tripfinal\product_constraints.md`

```markdown
# TripAvail - Product Constraints (LOCKED)

## 1. Role Constraint (Mutual Exclusivity)
✓ Every user starts as Traveller
✓ Traveller can choose ONLY ONE partner role:
  - Hotel Manager OR Tour Operator (never both)
✓ This choice is permanent
✓ User can switch between: Traveller ↔ chosen partner role
✓ Database trigger enforces this constraint

## 2. Verification Semantics
✓ Traveller: Optional (unlocks verified badge)
✓ Hotel Manager: Required for publishing properties
✓ Tour Operator: Required for publishing tours
✓ Verification gates:
  - Publishing (draft → published)
  - Payout eligibility
  - Search visibility (may be reduced if unverified)

## 3. Booking Ownership Rules
✓ Traveller creates bookings
✓ Hotel Manager receives property bookings
✓ Tour Operator receives tour bookings
✓ Same user can have bookings in multiple roles
✓ Bookings are role-context aware

## 4. Data Persistence Rules
✓ All data linked to user_id (not role)
✓ Properties persist when switching to Traveller
✓ Tours persist when switching to Traveller
✓ Traveller bookings persist when switching to partner

## 5. Payment Gateway (Postponed Decision)
⚠️ Payment gateway choice not locked yet (Stripe vs Razorpay vs both)
⚠️ This decision will be made in Phase 4 (backend implementation)
⚠️ Booking checkout UI will be built with abstraction layer
✓ Payment integration will be pluggable (not hardcoded)

## 6. Frontend Design Constraint 🔒 NON-NEGOTIABLE
✓ The folder `extracted_tripavail_frontend_screens` contains ~90% of final frontend
✓ These screens are NOT references, NOT inspiration, NOT drafts
✓ Web portal MUST look and behave EXACTLY like existing screens
✓ Any missing screens MUST follow same visual language
✓ Treat extracted frontend screens as single source of truth for UI

## 7. Role-Based Branding
✓ Traveller: Airbnb Rose (#FF385C + gradient)
✓ Hotel Manager: Purple Cyan Flow (#9D4EDD → #00D4FF)
✓ Tour Operator: Bright Coral (#FD5E53)
✓ Implemented via CSS variables + Tailwind tokens
✓ NO role branching in components
```

### **Step 2: Get Product Owner Sign-Off**

- [ ] Review constraints with product owner
- [ ] Get written approval (email/Slack confirmation)
- [ ] Document approval date and approver name
- [ ] Commit `product_constraints.md` to repository

**⚠️ DO NOT PROCEED TO WEEK 1 WITHOUT SIGN-OFF**

---

## 🛠️ WEEK 1: PROJECT SETUP (5-7 DAYS)

### **Day 1: Initialize Monorepo**

#### **1.1 Install pnpm (if not installed)**

```bash
# Windows (PowerShell)
iwr https://get.pnpm.io/install.ps1 -useb | iex

# Verify installation
pnpm --version
```

#### **1.2 Create Project Structure**

```bash
# Navigate to project directory
cd d:\Tripfinal

# Initialize root package.json
pnpm init

# Create monorepo structure
mkdir -p packages/shared/src
mkdir -p packages/web/src
mkdir -p supabase/migrations
mkdir -p scripts
mkdir -p .github/workflows
```

#### **1.3 Create Workspace Configuration**

Create: `pnpm-workspace.yaml`
```yaml
packages:
  - 'packages/*'
```

Create: `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "outputs": []
    },
    "test": {
      "outputs": []
    }
  }
}
```

Create: `package.json` (root)
```json
{
  "name": "tripavail",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.3"
  }
}
```

#### **1.4 Install Dependencies**

```bash
pnpm install
```

---

### **Day 2: Set Up Supabase Project**

#### **2.1 Create Supabase Account**

1. Go to https://supabase.com
2. Sign up / Log in
3. Create new project:
   - Name: `tripavail`
   - Database Password: (save securely)
   - Region: (closest to your users)

#### **2.2 Install Supabase CLI**

```bash
# Windows (PowerShell)
scoop install supabase

# Or download from https://github.com/supabase/cli/releases

# Verify installation
supabase --version
```

#### **2.3 Initialize Supabase Locally**

```bash
cd d:\Tripfinal

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Initialize (creates supabase/ folder)
supabase init
```

#### **2.4 Create Environment Variables**

Create: `.env.local`
```env
# Supabase
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Get these from Supabase Dashboard → Settings → API
```

**⚠️ Add to `.gitignore`:**
```
.env.local
.env
```

---

### **Day 3: Database Schema (Core Tables)**

#### **3.1 Create First Migration**

```bash
cd d:\Tripfinal

# Create migration file
supabase migration new initial_schema
```

#### **3.2 Define Core Schema**

Edit: `supabase/migrations/<timestamp>_initial_schema.sql`

```sql
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
```

#### **3.3 Apply Migration**

```bash
# Apply migration locally
supabase db reset

# Push to remote Supabase project
supabase db push
```

---

### **Day 4: Shared Package Setup**

#### **4.1 Initialize Shared Package**

```bash
cd packages/shared

# Initialize package
pnpm init

# Install dependencies
pnpm add @supabase/supabase-js zod
pnpm add -D typescript @types/node
```

#### **4.2 Create TypeScript Config**

Create: `packages/shared/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### **4.3 Create Domain Structure**

```bash
cd packages/shared/src

# Create domain folders
mkdir -p auth
mkdir -p roles
mkdir -p core

# Create files
touch auth/api.ts auth/service.ts auth/types.ts auth/hooks.ts
touch roles/api.ts roles/service.ts roles/types.ts roles/hooks.ts
touch core/client.ts core/constants.ts
```

#### **4.4 Create Supabase Client**

Create: `packages/shared/src/core/client.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### **4.5 Generate TypeScript Types from Supabase**

```bash
# Generate types
supabase gen types typescript --local > packages/shared/src/types/database.ts
```

---

### **Day 5: Web Package Setup (React + Vite)**

#### **5.1 Create Vite Project**

```bash
cd packages

# Create Vite project
pnpm create vite web --template react-ts

cd web

# Install dependencies
pnpm install

# Install additional dependencies
pnpm add react-router-dom @tanstack/react-query zustand
pnpm add @supabase/supabase-js
pnpm add -D tailwindcss postcss autoprefixer
```

#### **5.2 Initialize Tailwind CSS**

```bash
cd packages/web

# Initialize Tailwind
npx tailwindcss init -p
```

Create: `packages/web/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
        },
      },
      backgroundImage: {
        'primary-gradient': 'var(--primary-gradient)',
      },
      maxWidth: {
        'content': '1280px',
      },
    },
  },
  plugins: [],
}
```

Create: `packages/web/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Role-based theming */
:root[data-role="traveller"] {
  --primary-gradient: linear-gradient(135deg, #FF385C 0%, #FF6B9D 100%);
  --primary: #FF385C;
  --primary-hover: #E0304F;
  --primary-light: #FFE8ED;
}

:root[data-role="hotel-manager"] {
  --primary-gradient: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);
  --primary: #9D4EDD;
  --primary-hover: #8B44C7;
  --primary-light: #F3E8FF;
}

:root[data-role="tour-operator"] {
  --primary: #FD5E53;
  --primary-hover: #E34D44;
  --primary-light: #FFE9E7;
}
```

#### **5.3 Update Package.json**

Edit: `packages/web/package.json`
```json
{
  "name": "@tripavail/web",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

---

### **Day 6-7: Verification & Testing**

#### **6.1 Test Supabase Connection**

Create: `packages/web/src/App.tsx`
```tsx
import { useEffect, useState } from 'react'
import { supabase } from '@tripavail/shared/core/client'

function App() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    supabase.from('users').select('count').then(() => {
      setConnected(true)
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">TripAvail</h1>
        <p className={connected ? 'text-green-600' : 'text-red-600'}>
          {connected ? '✅ Supabase Connected' : '❌ Supabase Not Connected'}
        </p>
      </div>
    </div>
  )
}

export default App
```

#### **6.2 Run Development Server**

```bash
cd packages/web

# Start dev server
pnpm dev
```

Open: http://localhost:5173

**Expected**: "✅ Supabase Connected" message

#### **6.3 Verify Database**

```bash
# Check tables exist
supabase db diff

# View data in Supabase Dashboard
# Go to: https://app.supabase.com → Your Project → Table Editor
```

---

## ✅ WEEK 1 COMPLETION CHECKLIST

- [ ] Product constraints documented and approved
- [ ] Monorepo initialized with pnpm + Turborepo
- [ ] Supabase project created and linked
- [ ] Database schema created with RLS policies
- [ ] Partner role exclusivity trigger working
- [ ] `packages/shared` set up with domain structure
- [ ] `packages/web` set up with React + Vite + Tailwind
- [ ] Role-based theming CSS variables configured
- [ ] Supabase connection verified
- [ ] Dev server running successfully

---

## 🎯 NEXT STEPS (Week 2)

After Week 1 completion:

1. **Backend Development**
   - Create RPC functions for role switching
   - Set up real-time channels
   - Implement authentication flows

2. **Shared Package Development**
   - Build RoleService
   - Build AuthService
   - Create custom hooks (useAuth, useRole)

3. **Frontend Development**
   - Set up React Router
   - Create authentication screens
   - Build role switcher component

---

## 📞 NEED HELP?

**Common Issues**:

1. **Supabase connection fails**
   - Check `.env.local` has correct URL and keys
   - Verify project is running in Supabase dashboard

2. **pnpm not found**
   - Restart terminal after installation
   - Check PATH environment variable

3. **Migration fails**
   - Check SQL syntax
   - Verify Supabase CLI is logged in
   - Try `supabase db reset` to start fresh

4. **TypeScript errors**
   - Run `pnpm install` in all packages
   - Verify tsconfig.json is correct
   - Restart VS Code

---

*Last Updated: 2026-01-30*  
*Document Version: 1.0*  
*Ready to execute!*
