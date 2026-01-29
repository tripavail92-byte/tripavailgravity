// Amenities Routes
// Handle amenities listing and property amenities assignment

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

// =====================================================
// AMENITIES ROUTES
// =====================================================

// GET /api/amenities - Get all amenities (grouped by category)
app.get('/', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data: amenities, error } = await supabase
      .from('amenities')
      .select('*')
      .order('category')
      .order('display_order');
    
    if (error) throw error;
    
    // Group by category
    const grouped = amenities.reduce((acc, amenity) => {
      if (!acc[amenity.category]) {
        acc[amenity.category] = [];
      }
      acc[amenity.category].push(amenity);
      return acc;
    }, {} as Record<string, any[]>);
    
    return c.json({
      success: true,
      data: {
        all: amenities,
        by_category: grouped,
        total_count: amenities.length
      }
    });
  } catch (error) {
    console.error('Get amenities error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch amenities',
      message: error.message
    }, 500);
  }
});

// POST /api/amenities/:propertyId - Set property amenities
app.post('/:propertyId', authMiddleware, async (c) => {
  try {
    const propertyId = c.req.param('propertyId');
    const user = c.get('user');
    const { amenity_ids } = await c.req.json();
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    // Verify property ownership
    const { data: property } = await supabase
      .from('properties')
      .select('owner_id')
      .eq('id', propertyId)
      .single();
    
    if (!property || property.owner_id !== user.id) {
      return c.json({
        success: false,
        error: 'Property not found or unauthorized'
      }, 404);
    }
    
    // Validate amenity_ids
    if (!Array.isArray(amenity_ids) || amenity_ids.length === 0) {
      return c.json({
        success: false,
        error: 'amenity_ids must be a non-empty array'
      }, 400);
    }
    
    // Delete existing amenities for this property
    await supabase
      .from('property_amenities')
      .delete()
      .eq('property_id', propertyId);
    
    // Insert new amenities
    const amenitiesData = amenity_ids.map(amenity_id => ({
      property_id: propertyId,
      amenity_id
    }));
    
    const { data: inserted, error } = await supabase
      .from('property_amenities')
      .insert(amenitiesData)
      .select('*, amenity:amenities(*)');
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: inserted,
      message: `${inserted.length} amenities added successfully`
    });
  } catch (error) {
    console.error('Set amenities error:', error);
    return c.json({
      success: false,
      error: 'Failed to set amenities',
      message: error.message
    }, 500);
  }
});

// GET /api/amenities/:propertyId - Get property amenities
app.get('/:propertyId', async (c) => {
  try {
    const propertyId = c.req.param('propertyId');
    const supabase = getSupabaseClient();
    
    const { data: propertyAmenities, error } = await supabase
      .from('property_amenities')
      .select('amenity:amenities(*)')
      .eq('property_id', propertyId);
    
    if (error) throw error;
    
    const amenities = propertyAmenities.map(pa => pa.amenity);
    
    return c.json({
      success: true,
      data: amenities,
      count: amenities.length
    });
  } catch (error) {
    console.error('Get property amenities error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch property amenities',
      message: error.message
    }, 500);
  }
});

export default app;
