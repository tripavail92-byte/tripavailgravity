// Auth Routes
// Handle user authentication (signup, signin, signout)

import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

const getSupabaseAdmin = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};

// POST /api/auth/signup - Register new user
app.post('/signup', async (c) => {
  try {
    const { email, password, full_name } = await c.req.json();
    
    if (!email || !password) {
      return c.json({
        success: false,
        error: 'Email and password are required'
      }, 400);
    }
    
    const supabase = getSupabaseAdmin();
    
    // Create user with auto-confirmed email
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server
      user_metadata: {
        full_name: full_name || ''
      }
    });
    
    if (error) throw error;
    
    // Create user profile
    await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: full_name || '',
        current_role: 'traveler' // Default role
      });
    
    return c.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      },
      message: 'User created successfully'
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({
      success: false,
      error: 'Signup failed',
      message: error.message
    }, 500);
  }
});

// POST /api/auth/signin - Sign in existing user
app.post('/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({
        success: false,
        error: 'Email and password are required'
      }, 400);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        access_token: data.session.access_token
      },
      message: 'Signed in successfully'
    });
  } catch (error) {
    console.error('Signin error:', error);
    return c.json({
      success: false,
      error: 'Invalid credentials',
      message: error.message
    }, 401);
  }
});

// POST /api/auth/signout - Sign out user
app.post('/signout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({
        success: false,
        error: 'No session to sign out'
      }, 400);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    await supabase.auth.admin.signOut(token);
    
    return c.json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (error) {
    console.error('Signout error:', error);
    return c.json({
      success: false,
      error: 'Signout failed',
      message: error.message
    }, 500);
  }
});

// GET /api/auth/session - Get current session
app.get('/session', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({
        success: false,
        error: 'No session found'
      }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: { user: data.user }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid session',
      message: error.message
    }, 401);
  }
});

export default app;
