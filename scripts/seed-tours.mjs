import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbjpcrytdiwxwemtmjpk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZianBjcnl0ZGl3eHdlbXRtanBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzE5MzQxMSwiZXhwIjoyMDUyNzY5NDExfQ.p9Hxvz5IfBGdELZqUSUx8HJuNWuxokV_2F9w6XXBm5c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTours() {
  console.log('🔍 Checking tours in database...\n');
  
  const { data: tours, error } = await supabase
    .from('tours')
    .select('id, title, tour_type, location, is_active')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Error fetching tours:', error);
    return;
  }
  
  console.log(`📊 Found ${tours?.length || 0} tours:\n`);
  
  if (tours && tours.length > 0) {
    tours.forEach((tour, idx) => {
      console.log(`${idx + 1}. ${tour.title}`);
      console.log(`   Type: ${tour.tour_type}`);
      console.log(`   Location: ${tour.location?.city}, ${tour.location?.country}`);
      console.log(`   Active: ${tour.is_active}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No tours found. Will seed sample tours.\n');
  }
  
  return tours;
}

async function seedTours() {
  console.log('🌱 Seeding sample tours...\n');
  
  // Get a tour operator user ID (or use a test one)
  const { data: operators } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role_type', 'tour_operator')
    .limit(1)
    .single();
    
  const operatorId = operators?.user_id || '00000000-0000-0000-0000-000000000000';
  
  const sampleTours = [
    {
      operator_id: operatorId,
      title: 'Grand Canyon Sunset Adventure',
      tour_type: 'adventure',
      location: {
        city: 'Page',
        country: 'USA',
        address: 'Grand Canyon National Park, Arizona'
      },
      duration: '6 hours',
      price: 189,
      currency: 'USD',
      description: 'Experience the breathtaking beauty of the Grand Canyon at sunset. This adventure tour includes guided hiking, photo opportunities, and a gourmet picnic dinner overlooking one of the world\'s natural wonders.',
      short_description: 'Sunset hiking and dinner at the Grand Canyon',
      images: ['https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'],
      highlights: ['Stunning sunset views', 'Expert local guide', 'Gourmet picnic dinner', 'Small group size (max 12)', 'All equipment provided'],
      inclusions: ['Professional guide', 'All hiking equipment', 'Dinner and refreshments', 'Park entrance fees', 'Hotel pickup/dropoff'],
      exclusions: ['Personal expenses', 'Gratuities', 'Travel insurance'],
      requirements: ['Moderate fitness level required', 'Comfortable hiking shoes', 'Water bottle', 'Sun protection'],
      min_participants: 4,
      max_participants: 12,
      min_age: 12,
      max_age: 70,
      difficulty_level: 'moderate',
      languages: ['English', 'Spanish'],
      group_discounts: true,
      pricing_tiers: [
        { id: '1', name: 'Solo/Duo', minPeople: 1, maxPeople: 2, pricePerPerson: 189 },
        { id: '2', name: 'Small Group', minPeople: 3, maxPeople: 6, pricePerPerson: 169 },
        { id: '3', name: 'Large Group', minPeople: 7, maxPeople: 12, pricePerPerson: 149 }
      ],
      seasonal_pricing: false,
      peak_season_multiplier: 1.0,
      off_season_multiplier: 1.0,
      deposit_required: true,
      deposit_percentage: 30,
      cancellation_policy: 'moderate',
      rating: 4.8,
      review_count: 127,
      is_active: true,
      is_verified: true,
      is_featured: true
    },
    {
      operator_id: operatorId,
      title: 'Tokyo Street Food & Culture Tour',
      tour_type: 'cultural',
      location: {
        city: 'Tokyo',
        country: 'Japan',
        address: 'Shibuya District, Tokyo'
      },
      duration: '4 hours',
      price: 95,
      currency: 'USD',
      description: 'Discover authentic Tokyo through its incredible street food scene. Visit hidden local spots, taste authentic Japanese cuisine, and learn about the culture from a knowledgeable local guide.',
      short_description: 'Authentic street food tasting tour in Tokyo',
      images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'],
      highlights: ['Visit 6+ food stops', 'Try authentic local dishes', 'Local expert guide', 'Off-the-beaten-path locations', 'Cultural insights'],
      inclusions: ['Food tastings at 6 venues', 'English-speaking guide', 'Cultural commentary', 'Small group experience'],
      exclusions: ['Additional food/drinks', 'Transportation to meeting point', 'Hotel transfers'],
      requirements: ['Come hungry!', 'Comfortable walking shoes', 'Willingness to try new foods'],
      min_participants: 2,
      max_participants: 10,
      min_age: 10,
      max_age: 99,
      difficulty_level: 'easy',
      languages: ['English', 'Japanese'],
      group_discounts: true,
      pricing_tiers: [
        { id: '1', name: 'Individual', minPeople: 1, maxPeople: 1, pricePerPerson: 95 },
        { id: '2', name: 'Group', minPeople: 2, maxPeople: 10, pricePerPerson: 85 }
      ],
      seasonal_pricing: false,
      peak_season_multiplier: 1.0,
      off_season_multiplier: 1.0,
      deposit_required: false,
      deposit_percentage: 0,
      cancellation_policy: 'flexible',
      rating: 4.9,
      review_count: 243,
      is_active: true,
      is_verified: true,
      is_featured: true
    },
    {
      operator_id: operatorId,
      title: 'Swiss Alps Paragliding Experience',
      tour_type: 'adventure',
      location: {
        city: 'Interlaken',
        country: 'Switzerland',
        address: 'Interlaken, Bernese Oberland'
      },
      duration: '3 hours',
      price: 199,
      currency: 'USD',
      description: 'Soar above the stunning Swiss Alps on this unforgettable paragliding adventure. Tandem flight with certified instructors, breathtaking mountain views, and memories that will last a lifetime.',
      short_description: 'Tandem paragliding over the Swiss Alps',
      images: ['https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
      highlights: ['15-20 minute tandem flight', 'Certified instructors', 'Stunning Alpine views', 'Photo/video package available', 'No experience needed'],
      inclusions: ['Tandem paragliding flight', 'All safety equipment', 'Pre-flight briefing', 'Certified pilot', 'Insurance'],
      exclusions: ['Photo/video package (€40)', 'Transportation', 'Food and drinks'],
      requirements: ['Good health required', 'Weight limit: 30-115 kg', 'Weather dependent', 'Signed waiver'],
      min_participants: 1,
      max_participants: 8,
      min_age: 14,
      max_age: 65,
      difficulty_level: 'moderate',
      languages: ['English', 'German', 'French'],
      group_discounts: false,
      pricing_tiers: [
        { id: '1', name: 'Standard', minPeople: 1, maxPeople: 8, pricePerPerson: 199 }
      ],
      seasonal_pricing: true,
      peak_season_multiplier: 1.3,
      off_season_multiplier: 0.85,
      deposit_required: true,
      deposit_percentage: 50,
      cancellation_policy: 'strict',
      rating: 5.0,
      review_count: 89,
      is_active: true,
      is_verified: true,
      is_featured: true
    },
    {
      operator_id: operatorId,
      title: 'Historic Rome Walking Tour',
      tour_type: 'cultural',
      location: {
        city: 'Rome',
        country: 'Italy',
        address: 'Historic Center, Rome'
      },
      duration: '3.5 hours',
      price: 65,
      currency: 'USD',
      description: 'Step back in time and explore ancient Rome with an expert historian guide. Visit the Colosseum, Roman Forum, and Pantheon while learning about the fascinating history of the Eternal City.',
      short_description: 'Guided tour of ancient Rome\'s iconic landmarks',
      images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'],
      highlights: ['Skip-the-line Colosseum access', 'Expert historian guide', 'Roman Forum exploration', 'Pantheon visit', 'Small group tour'],
      inclusions: ['Colosseum entrance ticket', 'Roman Forum access', 'Professional guide', 'Headsets for larger groups'],
      exclusions: ['Food and drinks', 'Hotel pickup', 'Gratuities'],
      requirements: ['Comfortable walking shoes', 'Water bottle', 'Sun protection in summer'],
      min_participants: 2,
      max_participants: 15,
      min_age: 8,
      max_age: 99,
      difficulty_level: 'easy',
      languages: ['English', 'Italian', 'Spanish'],
      group_discounts: true,
      pricing_tiers: [
        { id: '1', name: 'Adult', minPeople: 1, maxPeople: 99, pricePerPerson: 65 },
        { id: '2', name: 'Student/Senior', minPeople: 1, maxPeople: 99, pricePerPerson: 55 }
      ],
      seasonal_pricing: false,
      peak_season_multiplier: 1.0,
      off_season_multiplier: 1.0,
      deposit_required: false,
      deposit_percentage: 0,
      cancellation_policy: 'flexible',
      rating: 4.7,
      review_count: 512,
      is_active: true,
      is_verified: true,
      is_featured: false
    },
    {
      operator_id: operatorId,
      title: 'Bali Waterfall & Rice Terrace Adventure',
      tour_type: 'nature',
      location: {
        city: 'Ubud',
        country: 'Indonesia',
        address: 'Ubud, Bali'
      },
      duration: '8 hours',
      price: 85,
      currency: 'USD',
      description: 'Discover Bali\'s natural wonders on this full-day tour. Visit stunning waterfalls, explore UNESCO rice terraces, and experience traditional Balinese culture with a local guide.',
      short_description: 'Full-day nature and culture tour in Bali',
      images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800'],
      highlights: ['3 stunning waterfalls', 'Tegalalang Rice Terraces', 'Traditional lunch included', 'Coffee plantation visit', 'Temple stop'],
      inclusions: ['Hotel pickup/dropoff', 'Private air-conditioned vehicle', 'English-speaking driver', 'Entrance fees', 'Lunch'],
      exclusions: ['Personal expenses', 'Optional activities', 'Gratuities'],
      requirements: ['Modest dress for temples', 'Swimming clothes for waterfalls', 'Comfortable shoes'],
      min_participants: 1,
      max_participants: 6,
      min_age: 5,
      max_age: 75,
      difficulty_level: 'easy',
      languages: ['English', 'Indonesian'],
      group_discounts: true,
      pricing_tiers: [
        { id: '1', name: 'Private (1-2 pax)', minPeople: 1, maxPeople: 2, pricePerPerson: 85 },
        { id: '2', name: 'Private (3-4 pax)', minPeople: 3, maxPeople: 4, pricePerPerson: 70 },
        { id: '3', name: 'Private (5-6 pax)', minPeople: 5, maxPeople: 6, pricePerPerson: 60 }
      ],
      seasonal_pricing: false,
      peak_season_multiplier: 1.0,
      off_season_multiplier: 1.0,
      deposit_required: false,
      deposit_percentage: 0,
      cancellation_policy: 'moderate',
      rating: 4.8,
      review_count: 178,
      is_active: true,
      is_verified: true,
      is_featured: true
    }
  ];
  
  for (const tour of sampleTours) {
    const { data: newTour, error } = await supabase
      .from('tours')
      .insert(tour)
      .select()
      .single();
      
    if (error) {
      console.error(`❌ Error creating tour "${tour.title}":`, error.message);
    } else {
      console.log(`✅ Created tour: ${tour.title} (${newTour.id})`);
      
      // Add schedules for the next 14 days
      const schedules = [];
      for (let i = 1; i <= 14; i++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + i);
        startDate.setHours(9, 0, 0, 0);
        
        const endDate = new Date(startDate);
        const hoursMatch = tour.duration.match(/(\d+)\s*hour/);
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 4;
        endDate.setHours(startDate.getHours() + hours);
        
        schedules.push({
          tour_id: newTour.id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          capacity: tour.max_participants,
          booked_count: 0,
          status: 'scheduled'
        });
      }
      
      const { error: schedError } = await supabase
        .from('tour_schedules')
        .insert(schedules);
        
      if (schedError) {
        console.error(`   ⚠️  Error adding schedules: ${schedError.message}`);
      } else {
        console.log(`   📅 Added ${schedules.length} departure schedules`);
      }
    }
  }
  
  console.log('\n✅ Tour seeding complete!\n');
}

async function main() {
  const tours = await checkTours();
  
  if (!tours || tours.length === 0) {
    await seedTours();
  } else {
    console.log('ℹ️  Tours already exist. Skipping seed.\n');
    console.log('   To force re-seed, delete existing tours first or modify the script.\n');
  }
  
  console.log('🎉 Done!');
  process.exit(0);
}

main().catch(console.error);
