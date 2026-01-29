// Authentication Middleware
// Verify JWT tokens from Supabase Auth

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Context, Next } from 'npm:hono@4';

export async function authMiddleware(c: Context, next: Next) {
  try {
    // Get Authorization header
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      }, 401);
    }
    
    // Extract token
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );
    
    // Verify user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      }, 401);
    }
    
    // Attach user to context
    c.set('user', user);
    c.set('supabase', supabase);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    }, 401);
  }
}

// Middleware to check user role
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    try {
      const user = c.get('user');
      const supabase = c.get('supabase');
      
      if (!user) {
        return c.json({
          success: false,
          error: 'Unauthorized'
        }, 401);
      }
      
      // Get user's current role
      const { data: userData } = await supabase
        .from('users')
        .select('current_role')
        .eq('id', user.id)
        .single();
      
      if (!userData || !allowedRoles.includes(userData.current_role)) {
        return c.json({
          success: false,
          error: 'Forbidden',
          message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
        }, 403);
      }
      
      c.set('userRole', userData.current_role);
      
      await next();
    } catch (error) {
      console.error('Role check error:', error);
      return c.json({
        success: false,
        error: 'Authorization failed',
        message: error.message
      }, 403);
    }
  };
}
