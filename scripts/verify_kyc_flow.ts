
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env parser
function loadEnv(filePath: string) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const env: Record<string, string> = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });
    return env;
}

const env = loadEnv(path.resolve(__dirname, '../.env'));
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// 1. Admin Client (for setup)
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('🚀 Starting KYC End-to-End Verification Test (Node.js)...');

    // 2. Create User (Admin - Auto Confirm)
    const email = `test_operator_${Date.now()}@tripavail.com`;
    const password = 'TestUser123!';
    console.log(`\n👤 Creating user (Admin): ${email}`);

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Test Setup Operator' }
    });

    if (authError) {
        console.error('❌ User creation failed:', authError.message);
        process.exit(1);
    }
    
    // In createUser response, user is in authData.user
    const userId = authData.user.id;
    console.log(`✅ User created: ${userId}`);

    // 3. Setup Role
    console.log(`\n🔑 Assigning role: tour_operator`);
    const { error: roleError } = await adminClient.from('user_roles').insert({
        user_id: userId,
        role_type: 'tour_operator',
        is_active: true,
        verification_status: 'incomplete', // Default state
        profile_completion: 0
    });

    if (roleError) {
        console.error('❌ Role assignment failed:', roleError.message);
        // Continue anyway, maybe trigger handled it
    } else {
        console.log('✅ Role assigned');
    }

    // 4. Log in as User (Client Context)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: loginData, error: loginError } = await userClient.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('❌ Login failed:', loginError.message);
        process.exit(1);
    }
    console.log('✅ Logged in successfully');

    // 4b. Ensure Bucket is Public (The Fix)
    console.log('\n🔧 Updating bucket tour-operator-assets to PUBLIC...');
    const { data: bucketData, error: bucketError } = await adminClient.storage.updateBucket('tour-operator-assets', {
        public: true
    });
    if (bucketError) {
        console.error('❌ Bucket update failed:', bucketError);
         // Try creating if not exists? No, assumed valid.
    } else {
        console.log('✅ Bucket updated to PUBLIC');
    }

    // 5. Upload Assets
    console.log('\nQw Uploading assets...');
    const idPath = path.resolve(__dirname, '../packages/web/public/test-assets/id_front.png');
    // Using back as selfie (swapped)
    const selfiePath = path.resolve(__dirname, '../packages/web/public/test-assets/id_back.png'); 

    if (!fs.existsSync(idPath) || !fs.existsSync(selfiePath)) {
        console.error('❌ Assets not found at:', idPath);
        process.exit(1);
    }

    async function upload(filePath: string, name: string) {
        try {
            const fileData = fs.readFileSync(filePath);
            const fileName = `${userId}/verification/test/${name}.png`;
            const { data, error } = await adminClient.storage // Use admin to ensure bucket perms don't block test
                .from('tour-operator-assets')
                .upload(fileName, fileData, { contentType: 'image/png', upsert: true });

            if (error) throw error;

            const { data: urlData } = adminClient.storage
                .from('tour-operator-assets')
                .getPublicUrl(fileName);
            
            return urlData.publicUrl;
        } catch (e) {
            console.error(`❌ Upload failed for ${name}:`, e);
            throw e;
        }
    }

    const idUrl = await upload(idPath, 'id_card');
    const selfieUrl = await upload(selfiePath, 'selfie');
    console.log('✅ Assets uploaded:');
    console.log('   ID:', idUrl);
    console.log('   Selfie:', selfieUrl);

    // Check reachability
    console.log('\n🌐 Checking asset reachability...');
    try {
        const res = await fetch(idUrl);
        if (!res.ok) {
            console.error(`❌ Asset URL not reachable: ${res.status} ${res.statusText}`);
            console.error('   This likely means the bucket is PRIVATE. Edge Function cannot read it.');
        } else {
            console.log('✅ Asset reachable (200 OK)');
        }
    } catch (e) {
        console.error('❌ Network error checking asset:', e);
    }

    // 6. Test Edge Function: Validate ID (RAW FETCH)
    console.log('\n🧠 Testing Edge Function: validate_id (via FETCH)...');
    
    const functionUrl = `${SUPABASE_URL}/functions/v1/verify-identity`;
    const payload = { 
        idCardUrl: idUrl, 
        userId, 
        role: 'tour_operator',
        taskType: 'validate_id' 
    };

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        
        if (!response.ok) {
            console.error('❌ Edge Function Failed');
            console.error('Body:', text);
        } else {
            console.log('✅ Edge Function Success (Manual Fetch)');
            const data = JSON.parse(text);
            console.log('   Result:', data);
        }

    } catch (e) {
        console.error('❌ Network Fetch Error:', e);
    }

    // 7. Test Edge Function: Face Match (RAW FETCH)
    console.log('\n🧠 Testing Edge Function: face_match (via FETCH)...');
    
    const facePayload = { 
        idCardUrl: idUrl, 
        selfieUrl: selfieUrl,
        userId, 
        role: 'tour_operator',
        taskType: 'face_match' 
    };

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(facePayload)
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);
        const text = await response.text();

        if (!response.ok) {
            console.error('❌ Edge Function Failed (Face Match)');
            console.error('Body:', text);
        } else {
            console.log('✅ Edge Function Success (Face Match)');
            const data = JSON.parse(text);
            console.log('   Result:', data);
        }

    } catch (e) {
        console.error('❌ Network Fetch Error (Face Match):', e);
    }
}

main().catch(err => console.error(err));
