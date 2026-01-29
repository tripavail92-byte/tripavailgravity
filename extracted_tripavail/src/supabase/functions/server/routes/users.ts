// Users Routes
// Handle user profile operations

import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { authMiddleware } from '../middleware/auth.ts';

const app = new Hono();

const getSupabaseClient = (authHeader?: string) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = authHeader 
    ? authHeader.replace('Bearer ', '')
    : Deno.env.get('SUPABASE_ANON_KEY')!;
    
  return createClient(supabaseUrl, supabaseKey);
};

// GET /api/users/me - Get current user profile
app.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    }, 500);
  }
});

// PUT /api/users/me - Update user profile
app.put('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    // Don't allow changing id or email through this endpoint
    delete body.id;
    delete body.email;
    
    const { data: profile, error } = await supabase
      .from('users')
      .update(body)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    }, 500);
  }
});

// POST /api/users/me/switch-role - Switch user role
app.post('/me/switch-role', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { role } = await c.req.json();
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    const validRoles = ['traveler', 'hotel_manager', 'tour_operator'];
    
    if (!validRoles.includes(role)) {
      return c.json({
        success: false,
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}`
      }, 400);
    }
    
    const { data: profile, error } = await supabase
      .from('users')
      .update({ current_role: role })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: profile,
      message: `Switched to ${role} role`
    });
  } catch (error) {
    console.error('Switch role error:', error);
    return c.json({
      success: false,
      error: 'Failed to switch role',
      message: error.message
    }, 500);
  }
});

export default app;
