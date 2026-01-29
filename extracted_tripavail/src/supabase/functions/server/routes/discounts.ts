// Discounts Routes
// Handle property discount settings

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

// Validation constants
const DISCOUNT_LIMITS = {
  MIN_PERCENTAGE: 5,
  MAX_PERCENTAGE: 70,
  DEFAULT_PERCENTAGE: 10
};

// =====================================================
// DISCOUNT ROUTES
// =====================================================

// POST /api/discounts/:propertyId - Set/Update discount
app.post('/:propertyId', authMiddleware, async (c) => {
  try {
    const propertyId = c.req.param('propertyId');
    const user = c.get('user');
    const body = await c.req.json();
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    // Verify property ownership
    const { data: property } = await supabase
      .from('properties')
      .select('id, owner_id, base_price_per_night')
      .eq('id', propertyId)
      .single();
    
    if (!property || property.owner_id !== user.id) {
      return c.json({
        success: false,
        error: 'Property not found or unauthorized'
      }, 404);
    }
    
    // Validate discount data
    const { is_enabled, percentage, start_date, end_date, description } = body;
    
    if (is_enabled && (!percentage || percentage < DISCOUNT_LIMITS.MIN_PERCENTAGE || percentage > DISCOUNT_LIMITS.MAX_PERCENTAGE)) {
      return c.json({
        success: false,
        error: 'Invalid discount percentage',
        message: `Percentage must be between ${DISCOUNT_LIMITS.MIN_PERCENTAGE}% and ${DISCOUNT_LIMITS.MAX_PERCENTAGE}%`
      }, 400);
    }
    
    // Calculate pricing
    const originalPrice = property.base_price_per_night;
    const discountAmount = is_enabled ? (originalPrice * percentage / 100) : 0;
    const finalPrice = originalPrice - discountAmount;
    
    // Upsert discount (insert or update if exists)
    const { data: discount, error } = await supabase
      .from('discounts')
      .upsert({
        property_id: propertyId,
        is_enabled: is_enabled || false,
        percentage: is_enabled ? percentage : DISCOUNT_LIMITS.DEFAULT_PERCENTAGE,
        start_date: start_date || null,
        end_date: end_date || null,
        description: description || null
      }, {
        onConflict: 'property_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({
      success: true,
      data: {
        discount_id: discount.id,
        property_id: propertyId,
        settings: discount,
        pricing: {
          original_price: originalPrice,
          discount_amount: discountAmount,
          final_price: finalPrice,
          savings_per_night: discountAmount
        }
      },
      message: 'Discount settings saved successfully'
    });
  } catch (error) {
    console.error('Save discount error:', error);
    return c.json({
      success: false,
      error: 'Failed to save discount',
      message: error.message
    }, 500);
  }
});

// GET /api/discounts/:propertyId - Get discount settings
app.get('/:propertyId', async (c) => {
  try {
    const propertyId = c.req.param('propertyId');
    const supabase = getSupabaseClient(c.req.header('Authorization'));
    
    // Get discount and property details
    const { data: discount, error } = await supabase
      .from('discounts')
      .select('*, property:properties(base_price_per_night)')
      .eq('property_id', propertyId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }
    
    if (!discount) {
      return c.json({
        success: true,
        data: null,
        message: 'No discount set for this property'
      }, 404);
    }
    
    // Calculate pricing
    const originalPrice = discount.property.base_price_per_night;
    const discountAmount = discount.is_enabled ? (originalPrice * discount.percentage / 100) : 0;
    const finalPrice = originalPrice - discountAmount;
    
    return c.json({
      success: true,
      data: {
        settings: {
          is_enabled: discount.is_enabled,
          percentage: discount.percentage,
          start_date: discount.start_date,
          end_date: discount.end_date,
          description: discount.description
        },
        pricing: {
          original_price: originalPrice,
          discount_amount: discountAmount,
          final_price: finalPrice
        }
      }
    });
  } catch (error) {
    console.error('Get discount error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch discount',
      message: error.message
    }, 500);
  }
});

// DELETE /api/discounts/:propertyId - Remove discount
app.delete('/:propertyId', authMiddleware, async (c) => {
  try {
    const propertyId = c.req.param('propertyId');
    const user = c.get('user');
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
    
    // Delete discount
    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('property_id', propertyId);
    
    if (error) throw error;
    
    return c.json({
      success: true,
      message: 'Discount removed successfully'
    });
  } catch (error) {
    console.error('Delete discount error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete discount',
      message: error.message
    }, 500);
  }
});

export default app;
