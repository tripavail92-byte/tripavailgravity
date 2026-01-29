// Properties Routes
// Handle property CRUD operations

import { Hono } from 'npm:hono@4';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { authMiddleware } from '../middleware/auth.ts';
import { validateProperty } from '../validators/property.ts';

const app = new Hono();

// Get Supabase client
const getSupabaseClient = (authHeader?: string) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = authHeader 
    ? authHeader.replace('Bearer ', '')
    : Deno.env.get('SUPABASE_ANON_KEY')!;
    
  return createClient(supabaseUrl, supabaseKey);
};

// =====================================================
// PUBLIC ROUTES
// =====================================================

// GET /api/properties - List all published properties
app.get('/', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    // Get query parameters for filtering
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    const { data: properties, error, count } = await supabase
      .from('properties')
      .select('*, property_images(*), discounts(*)', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: properties,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch properties',
      message: error.message
    }, 500);
  }
});

// GET /api/properties/:id - Get single property
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:users!owner_id(*),
        property_images(*),
        property_amenities(
          amenity:amenities(*)
        ),
        discounts(*),
        reviews(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!property) {
      return c.json({
        success: false,
        error: 'Property not found'
      }, 404);
    }
    
    // Increment view count
    await supabase
      .from('properties')
      .update({ view_count: (property.view_count || 0) + 1 })
      .eq('id', id);
    
    return c.json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Get property error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch property',
      message: error.message
    }, 500);
  }
});

// =====================================================
// PROTECTED ROUTES (Require Authentication)
// =====================================================

// POST /api/properties - Create property
app.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    // Validate user is hotel manager
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    const { data: userData } = await supabase
      .from('users')
      .select('current_role')
      .eq('id', user.id)
      .single();
    
    if (userData?.current_role !== 'hotel_manager') {
      return c.json({
        success: false,
        error: 'Only hotel managers can create properties'
      }, 403);
    }
    
    // Validate input
    const validation = validateProperty(body);
    if (!validation.isValid) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }, 400);
    }
    
    // Create property
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        ...body,
        owner_id: user.id,
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: property,
      message: 'Property created successfully'
    }, 201);
  } catch (error) {
    console.error('Create property error:', error);
    return c.json({
      success: false,
      error: 'Failed to create property',
      message: error.message
    }, 500);
  }
});

// PUT /api/properties/:id - Update property
app.put('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json();
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    // Verify ownership
    const { data: existing } = await supabase
      .from('properties')
      .select('owner_id')
      .eq('id', id)
      .single();
    
    if (!existing || existing.owner_id !== user.id) {
      return c.json({
        success: false,
        error: 'Property not found or unauthorized'
      }, 404);
    }
    
    // Update property
    const { data: property, error } = await supabase
      .from('properties')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: property,
      message: 'Property updated successfully'
    });
  } catch (error) {
    console.error('Update property error:', error);
    return c.json({
      success: false,
      error: 'Failed to update property',
      message: error.message
    }, 500);
  }
});

// POST /api/properties/:id/publish - Publish property
app.post('/:id/publish', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    // Verify ownership
    const { data: property } = await supabase
      .from('properties')
      .select('*, property_images(*), property_amenities(*)')
      .eq('id', id)
      .single();
    
    if (!property || property.owner_id !== user.id) {
      return c.json({
        success: false,
        error: 'Property not found or unauthorized'
      }, 404);
    }
    
    // Validate property is ready to publish
    const errors = [];
    if (!property.name) errors.push('Property name is required');
    if (!property.description) errors.push('Description is required');
    if (!property.base_price_per_night) errors.push('Price is required');
    if (!property.property_images || property.property_images.length < 5) {
      errors.push('At least 5 photos required');
    }
    if (!property.property_amenities || property.property_amenities.length < 5) {
      errors.push('At least 5 amenities required');
    }
    
    if (errors.length > 0) {
      return c.json({
        success: false,
        error: 'Property not ready to publish',
        details: errors
      }, 400);
    }
    
    // Publish property
    const { data: published, error } = await supabase
      .from('properties')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: published,
      message: 'Property published successfully!'
    });
  } catch (error) {
    console.error('Publish property error:', error);
    return c.json({
      success: false,
      error: 'Failed to publish property',
      message: error.message
    }, 500);
  }
});

// DELETE /api/properties/:id - Delete property
app.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    // Verify ownership
    const { data: existing } = await supabase
      .from('properties')
      .select('owner_id')
      .eq('id', id)
      .single();
    
    if (!existing || existing.owner_id !== user.id) {
      return c.json({
        success: false,
        error: 'Property not found or unauthorized'
      }, 404);
    }
    
    // Delete property (cascade will handle related records)
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return c.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete property',
      message: error.message
    }, 500);
  }
});

// GET /api/properties/user/my-properties - Get user's properties
app.get('/user/my-properties', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*, property_images(*), discounts(*)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Get user properties error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch properties',
      message: error.message
    }, 500);
  }
});

export default app;
