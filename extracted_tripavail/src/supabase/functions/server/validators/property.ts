// Property Validation
// Validate property data before insertion/update

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export function validateProperty(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields for property creation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Property name is required');
  }
  
  if (!data.property_type) {
    errors.push('Property type is required');
  }
  
  if (!data.address || data.address.trim().length === 0) {
    errors.push('Address is required');
  }
  
  if (!data.city || data.city.trim().length === 0) {
    errors.push('City is required');
  }
  
  if (!data.country || data.country.trim().length === 0) {
    errors.push('Country is required');
  }
  
  if (!data.base_price_per_night || data.base_price_per_night <= 0) {
    errors.push('Valid base price per night is required');
  }
  
  if (!data.max_guests || data.max_guests < 1) {
    errors.push('Maximum guests must be at least 1');
  }
  
  // Validate property type
  const validPropertyTypes = [
    'hotel', 'resort', 'hostel', 'villa', 'apartment',
    'guesthouse', 'motel', 'boutique_hotel', 'bed_and_breakfast',
    'lodge', 'cottage', 'cabin'
  ];
  
  if (data.property_type && !validPropertyTypes.includes(data.property_type)) {
    errors.push(`Invalid property type. Must be one of: ${validPropertyTypes.join(', ')}`);
  }
  
  // Validate price ranges
  if (data.base_price_per_night && (data.base_price_per_night < 10 || data.base_price_per_night > 100000)) {
    errors.push('Base price must be between $10 and $100,000 per night');
  }
  
  // Validate latitude/longitude if provided
  if (data.latitude !== undefined && data.latitude !== null) {
    if (data.latitude < -90 || data.latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
  }
  
  if (data.longitude !== undefined && data.longitude !== null) {
    if (data.longitude < -180 || data.longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
  }
  
  // Validate minimum/maximum stay
  if (data.minimum_stay_nights && data.minimum_stay_nights < 1) {
    errors.push('Minimum stay must be at least 1 night');
  }
  
  if (data.maximum_stay_nights && data.maximum_stay_nights < 1) {
    errors.push('Maximum stay must be at least 1 night');
  }
  
  if (data.minimum_stay_nights && data.maximum_stay_nights) {
    if (data.minimum_stay_nights > data.maximum_stay_nights) {
      errors.push('Minimum stay cannot be greater than maximum stay');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function validatePropertyUpdate(data: any): ValidationResult {
  // For updates, fields are optional but must be valid if provided
  const errors: string[] = [];
  
  if (data.base_price_per_night !== undefined && data.base_price_per_night <= 0) {
    errors.push('Base price must be greater than 0');
  }
  
  if (data.max_guests !== undefined && data.max_guests < 1) {
    errors.push('Maximum guests must be at least 1');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
