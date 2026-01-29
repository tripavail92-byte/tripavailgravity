import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Minus, ArrowRight, Upload, X, Star, Check } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

// Step 4: Rooms & Accommodation
export function RoomsStep({ onComplete, existingData, onUpdate }: any) {
  const [rooms, setRooms] = useState(existingData?.rooms || []);
  const [showAddRoom, setShowAddRoom] = useState(false);

  const roomTypes = [
    { id: 'standard', name: 'Standard Room', description: 'Basic comfortable room' },
    { id: 'deluxe', name: 'Deluxe Room', description: 'Enhanced comfort and space' },
    { id: 'suite', name: 'Suite', description: 'Separate living area' },
    { id: 'family', name: 'Family Room', description: 'Spacious for families' },
    { id: 'executive', name: 'Executive Room', description: 'Business traveler focused' },
    { id: 'presidential', name: 'Presidential Suite', description: 'Luxury accommodation' },
    { id: 'penthouse', name: 'Penthouse', description: 'Top floor luxury' },
    { id: 'studio', name: 'Studio Apartment', description: 'Self-contained unit' }
  ];

  const bedTypes = [
    'Single Bed', 'Double Bed', 'Queen Bed', 'King Bed', 
    '2 Single Beds', '2 Double Beds', 'Sofa Bed', 'Bunk Bed'
  ];

  const roomAmenities = [
    'Private Bathroom', 'Air Conditioning', 'TV', 'Mini Fridge', 'Safe',
    'Work Desk', 'Balcony', 'City View', 'Ocean View', 'Mountain View',
    'Kitchenette', 'Sofa', 'Coffee Machine', 'Hair Dryer', 'Iron',
    'Bathrobes', 'Slippers', 'Toiletries', 'WiFi', 'Room Service'
  ];

  const addRoom = (roomData: any) => {
    const newRoom = {
      id: Date.now().toString(),
      ...roomData
    };
    const newRooms = [...rooms, newRoom];
    setRooms(newRooms);
    onUpdate({ rooms: newRooms });
    setShowAddRoom(false);
  };

  const removeRoom = (roomId: string) => {
    const newRooms = rooms.filter((room: any) => room.id !== roomId);
    setRooms(newRooms);
    onUpdate({ rooms: newRooms });
  };

  const handleContinue = () => {
    if (rooms.length > 0) {
      onComplete({ rooms });
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Rooms */}
      {rooms.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Your Room Types</h3>
          {rooms.map((room: any) => (
            <Card key={room.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{room.type}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {room.capacity} guests • {room.beds} • {room.size} sq ft
                  </p>
                  <p className="text-sm font-medium text-[#ff5a5f]">
                    PKR {room.basePrice}/night
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.amenities?.slice(0, 3).map((amenity: string) => (
                      <span key={amenity} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities?.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeRoom(room.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Room Button */}
      {!showAddRoom && (
        <Button
          onClick={() => setShowAddRoom(true)}
          variant="outline"
          className="w-full py-6 border-2 border-dashed border-gray-300 hover:border-[#ff5a5f]"
        >
          <Plus className="mr-2" size={20} />
          Add Room Type
        </Button>
      )}

      {/* Add Room Form */}
      {showAddRoom && (
        <AddRoomForm
          roomTypes={roomTypes}
          bedTypes={bedTypes}
          roomAmenities={roomAmenities}
          onAdd={addRoom}
          onCancel={() => setShowAddRoom(false)}
        />
      )}

      {/* Continue Button */}
      {rooms.length > 0 && (
        <Button
          onClick={handleContinue}
          className="w-full py-3 bg-[#ff5a5f] hover:bg-[#ff5a5f]/90 text-white"
        >
          Continue to Policies
          <ArrowRight className="ml-2" size={18} />
        </Button>
      )}
    </div>
  );
}

// Add Room Form Component
function AddRoomForm({ roomTypes, bedTypes, roomAmenities, onAdd, onCancel }: any) {
  const [formData, setFormData] = useState({
    type: '',
    capacity: 2,
    beds: '',
    size: 200,
    amenities: [] as string[],
    basePrice: 5000,
    currency: 'PKR'
  });

  const handleSubmit = () => {
    if (formData.type && formData.beds && formData.basePrice) {
      onAdd(formData);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Add New Room Type</h3>
      
      <div className="space-y-4">
        {/* Room Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {roomTypes.map((type: any) => (
              <button
                key={type.id}
                onClick={() => setFormData({ ...formData, type: type.name })}
                className={`p-3 rounded-lg border text-left ${
                  formData.type === type.name
                    ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-medium text-sm">{type.name}</h4>
                <p className="text-xs text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Capacity and Bed Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests *</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFormData({ ...formData, capacity: Math.max(1, formData.capacity - 1) })}
                className="p-2 border rounded-lg"
              >
                <Minus size={16} />
              </button>
              <span className="px-4 py-2 border rounded-lg">{formData.capacity}</span>
              <button
                onClick={() => setFormData({ ...formData, capacity: formData.capacity + 1 })}
                className="p-2 border rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bed Configuration *</label>
            <select
              value={formData.beds}
              onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select bed type</option>
              {bedTypes.map((bed) => (
                <option key={bed} value={bed}>{bed}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Size and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Size (sq ft)</label>
            <Input
              type="number"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) || 0 })}
              placeholder="200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (PKR/night) *</label>
            <Input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
              placeholder="5000"
            />
          </div>
        </div>

        {/* Room Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Amenities</label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {roomAmenities.map((amenity: string) => (
              <button
                key={amenity}
                onClick={() => {
                  const newAmenities = formData.amenities.includes(amenity)
                    ? formData.amenities.filter(a => a !== amenity)
                    : [...formData.amenities, amenity];
                  setFormData({ ...formData, amenities: newAmenities });
                }}
                className={`p-2 rounded-lg border text-sm ${
                  formData.amenities.includes(amenity)
                    ? 'border-[#ff5a5f] bg-[#ff5a5f]/5 text-[#ff5a5f]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.type || !formData.beds || !formData.basePrice}
            className="flex-1 bg-[#ff5a5f] hover:bg-[#ff5a5f]/90 text-white"
          >
            Add Room Type
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Step 5: Policies & Rules
export function PoliciesStep({ onComplete, existingData, onUpdate }: any) {
  const [formData, setFormData] = useState({
    checkIn: existingData?.checkIn || '15:00',
    checkOut: existingData?.checkOut || '11:00',
    cancellationPolicy: existingData?.cancellationPolicy || '',
    houseRules: existingData?.houseRules || [],
    childrenPolicy: existingData?.childrenPolicy || '',
    petPolicy: existingData?.petPolicy || '',
    smokingPolicy: existingData?.smokingPolicy || ''
  });

  const cancellationPolicies = [
    { id: 'flexible', name: 'Flexible', description: 'Free cancellation 24 hours before check-in' },
    { id: 'moderate', name: 'Moderate', description: 'Free cancellation 5 days before check-in' },
    { id: 'strict', name: 'Strict', description: 'Free cancellation 14 days before check-in' },
    { id: 'super-strict', name: 'Super Strict', description: 'Non-refundable' }
  ];

  const commonHouseRules = [
    'No smoking in rooms',
    'No parties or events',
    'Quiet hours 10 PM - 7 AM',
    'No pets allowed',
    'Check-in ID required',
    'Maximum occupancy strictly enforced',
    'No outside guests after 10 PM',
    'Respect other guests',
    'No illegal activities',
    'Damage charges apply'
  ];

  const childrenPolicies = [
    'Children of all ages welcome',
    'Children under 12 stay free',
    'Children under 6 stay free',
    'Adult-only property',
    'Supervised children only'
  ];

  const petPolicies = [
    'Pets not allowed',
    'Pets allowed with additional fee',
    'Small pets only (under 10kg)',
    'Service animals only',
    'Pets allowed - no fee'
  ];

  const smokingPolicies = [
    'Non-smoking property',
    'Designated smoking areas only',
    'Smoking allowed in some rooms',
    'Outdoor smoking only'
  ];

  const toggleHouseRule = (rule: string) => {
    const newRules = formData.houseRules.includes(rule)
      ? formData.houseRules.filter((r: string) => r !== rule)
      : [...formData.houseRules, rule];
    
    const newData = { ...formData, houseRules: newRules };
    setFormData(newData);
    onUpdate(newData);
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const handleContinue = () => {
    if (formData.checkIn && formData.checkOut && formData.cancellationPolicy) {
      onComplete(formData);
    }
  };

  const isValid = formData.checkIn && formData.checkOut && formData.cancellationPolicy;

  return (
    <div className="space-y-6">
      {/* Check-in/Check-out Times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Time *</label>
          <Input
            type="time"
            value={formData.checkIn}
            onChange={(e) => handleInputChange('checkIn', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Time *</label>
          <Input
            type="time"
            value={formData.checkOut}
            onChange={(e) => handleInputChange('checkOut', e.target.value)}
          />
        </div>
      </div>

      {/* Cancellation Policy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Cancellation Policy *</label>
        <div className="space-y-2">
          {cancellationPolicies.map((policy) => (
            <button
              key={policy.id}
              onClick={() => handleInputChange('cancellationPolicy', policy.id)}
              className={`w-full p-3 rounded-lg border text-left ${
                formData.cancellationPolicy === policy.id
                  ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className={`font-medium ${
                formData.cancellationPolicy === policy.id ? 'text-[#ff5a5f]' : 'text-gray-900'
              }`}>
                {policy.name}
              </h4>
              <p className="text-sm text-gray-600">{policy.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* House Rules */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">House Rules</label>
        <div className="grid grid-cols-1 gap-2">
          {commonHouseRules.map((rule) => (
            <button
              key={rule}
              onClick={() => toggleHouseRule(rule)}
              className={`p-3 rounded-lg border text-left ${
                formData.houseRules.includes(rule)
                  ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${
                  formData.houseRules.includes(rule) ? 'text-[#ff5a5f]' : 'text-gray-900'
                }`}>
                  {rule}
                </span>
                {formData.houseRules.includes(rule) && (
                  <Check size={16} className="text-[#ff5a5f]" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Children Policy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Children Policy</label>
        <div className="space-y-2">
          {childrenPolicies.map((policy) => (
            <button
              key={policy}
              onClick={() => handleInputChange('childrenPolicy', policy)}
              className={`w-full p-3 rounded-lg border text-left ${
                formData.childrenPolicy === policy
                  ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`text-sm ${
                formData.childrenPolicy === policy ? 'text-[#ff5a5f]' : 'text-gray-900'
              }`}>
                {policy}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pet Policy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Pet Policy</label>
        <div className="space-y-2">
          {petPolicies.map((policy) => (
            <button
              key={policy}
              onClick={() => handleInputChange('petPolicy', policy)}
              className={`w-full p-3 rounded-lg border text-left ${
                formData.petPolicy === policy
                  ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`text-sm ${
                formData.petPolicy === policy ? 'text-[#ff5a5f]' : 'text-gray-900'
              }`}>
                {policy}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Smoking Policy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Smoking Policy</label>
        <div className="space-y-2">
          {smokingPolicies.map((policy) => (
            <button
              key={policy}
              onClick={() => handleInputChange('smokingPolicy', policy)}
              className={`w-full p-3 rounded-lg border text-left ${
                formData.smokingPolicy === policy
                  ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`text-sm ${
                formData.smokingPolicy === policy ? 'text-[#ff5a5f]' : 'text-gray-900'
              }`}>
                {policy}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!isValid}
        className={`w-full py-3 ${
          isValid 
            ? 'bg-[#ff5a5f] hover:bg-[#ff5a5f]/90 text-white' 
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        Continue to Photos
        <ArrowRight className="ml-2" size={18} />
      </Button>
    </div>
  );
}

// Step 6: Photos & Media
export function PhotosStep({ onComplete, existingData, onUpdate }: any) {
  const [photos, setPhotos] = useState(existingData?.photos || {
    exterior: [],
    lobby: [],
    rooms: [],
    amenities: [],
    dining: [],
    other: []
  });

  const photoCategories = [
    { 
      id: 'exterior', 
      name: 'Exterior & Building', 
      description: 'Outside views, entrance, facade',
      required: true,
      icon: '🏢'
    },
    { 
      id: 'lobby', 
      name: 'Lobby & Reception', 
      description: 'Front desk, waiting areas, lobby',
      required: true,
      icon: '🛎️'
    },
    { 
      id: 'rooms', 
      name: 'Guest Rooms', 
      description: 'Bedrooms, bathrooms, room amenities',
      required: true,
      icon: '🛏️'
    },
    { 
      id: 'amenities', 
      name: 'Facilities & Amenities', 
      description: 'Pool, gym, spa, business center',
      required: false,
      icon: '🏊'
    },
    { 
      id: 'dining', 
      name: 'Dining & Bar', 
      description: 'Restaurant, bar, breakfast area',
      required: false,
      icon: '🍽️'
    },
    { 
      id: 'other', 
      name: 'Other Areas', 
      description: 'Garden, parking, meeting rooms',
      required: false,
      icon: '📷'
    }
  ];

  const simulatePhotoUpload = (categoryId: string) => {
    // Simulate photo upload
    const newPhotos = { ...photos };
    const currentPhotos = newPhotos[categoryId as keyof typeof photos] || [];
    const newPhotoId = Date.now().toString();
    newPhotos[categoryId as keyof typeof photos] = [...currentPhotos, newPhotoId];
    
    setPhotos(newPhotos);
    onUpdate({ photos: newPhotos });
  };

  const removePhoto = (categoryId: string, photoId: string) => {
    const newPhotos = { ...photos };
    newPhotos[categoryId as keyof typeof photos] = newPhotos[categoryId as keyof typeof photos].filter(
      (id: string) => id !== photoId
    );
    setPhotos(newPhotos);
    onUpdate({ photos: newPhotos });
  };

  const getTotalPhotos = () => {
    return Object.values(photos).reduce((total, categoryPhotos) => total + categoryPhotos.length, 0);
  };

  const getRequiredPhotosCount = () => {
    const requiredCategories = photoCategories.filter(cat => cat.required);
    return requiredCategories.reduce((count, cat) => {
      const categoryPhotos = photos[cat.id as keyof typeof photos] || [];
      return count + (categoryPhotos.length > 0 ? 1 : 0);
    }, 0);
  };

  const handleContinue = () => {
    const requiredCategoriesWithPhotos = getRequiredPhotosCount();
    if (requiredCategoriesWithPhotos >= 3) { // At least 3 required categories
      onComplete({ photos });
    }
  };

  const canContinue = getRequiredPhotosCount() >= 3;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 mb-2">
          Upload photos to showcase your property
        </p>
        <p className="text-xs text-gray-500">
          {getTotalPhotos()} photos uploaded • {getRequiredPhotosCount()}/3 required categories completed
        </p>
      </div>

      {/* Photo Categories */}
      <div className="space-y-4">
        {photoCategories.map((category) => {
          const categoryPhotos = photos[category.id as keyof typeof photos] || [];
          
          return (
            <Card key={category.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      {category.name}
                      {category.required && (
                        <span className="text-xs bg-[#ff5a5f] text-white px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {categoryPhotos.length} photos
                </div>
              </div>

              {/* Photos Grid */}
              {categoryPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {categoryPhotos.map((photoId: string) => (
                    <div key={photoId} className="relative">
                      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Photo</span>
                      </div>
                      <button
                        onClick={() => removePhoto(category.id, photoId)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={() => simulatePhotoUpload(category.id)}
                variant="outline"
                className="w-full border-2 border-dashed border-gray-300 hover:border-[#ff5a5f] py-8"
              >
                <Upload className="mr-2" size={20} />
                {categoryPhotos.length === 0 ? 'Upload Photos' : 'Add More Photos'}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Photo Requirements Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Photo Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload at least 1 photo in each required category</li>
          <li>• Use high-quality, well-lit photos</li>
          <li>• Show different angles and perspectives</li>
          <li>• Avoid blurry or dark images</li>
          <li>• Include both wide shots and detail photos</li>
        </ul>
      </Card>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!canContinue}
        className={`w-full py-3 ${
          canContinue 
            ? 'bg-[#ff5a5f] hover:bg-[#ff5a5f]/90 text-white' 
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {canContinue 
          ? `Continue with ${getTotalPhotos()} photos`
          : `Upload photos in ${3 - getRequiredPhotosCount()} more required categories`
        }
      </Button>
    </div>
  );
}

// Step 7: Additional Services
export function ServicesStep({ onComplete, existingData, onUpdate }: any) {
  const [selectedServices, setSelectedServices] = useState<string[]>(existingData?.services || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(existingData?.languages || []);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>(existingData?.accessibility || []);

  const additionalServices = [
    'Airport Transfer', 'Tour Booking', 'Car Rental', 'Laundry Service',
    'Dry Cleaning', 'Babysitting', 'Pet Care', 'Grocery Shopping',
    'Event Planning', 'Catering', 'Photography', 'Translation Services',
    'Medical Assistance', 'Equipment Rental', 'Ticket Booking', 'Currency Exchange'
  ];

  const languages = [
    'English', 'Urdu', 'Hindi', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi',
    'Arabic', 'Persian', 'Chinese', 'Japanese', 'French', 'German', 'Spanish'
  ];

  const accessibilityFeatures = [
    'Wheelchair Accessible Entrance', 'Wheelchair Accessible Rooms', 'Elevator Access',
    'Accessible Bathroom', 'Braille Signage', 'Hearing Loop System', 'Visual Alarms',
    'Accessible Parking', 'Ramps', 'Grab Bars', 'Roll-in Shower', 'Accessible Pool'
  ];

  const toggleItem = (item: string, list: string[], setList: any, updateKey: string) => {
    const newList = list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item];
    
    setList(newList);
    onUpdate({ [updateKey]: newList });
  };

  const handleContinue = () => {
    onComplete({
      services: selectedServices,
      languages: selectedLanguages,
      accessibility: selectedAccessibility
    });
  };

  return (
    <div className="space-y-6">
      {/* Additional Services */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Additional Services</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select any additional services you offer to guests
        </p>
        <div className="grid grid-cols-2 gap-2">
          {additionalServices.map((service) => (
            <button
              key={service}
              onClick={() => toggleItem(service, selectedServices, setSelectedServices, 'services')}
              className={`p-3 rounded-lg border text-left ${
                selectedServices.includes(service)
                  ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${
                  selectedServices.includes(service) ? 'text-[#ff5a5f]' : 'text-gray-900'
                }`}>
                  {service}
                </span>
                {selectedServices.includes(service) && (
                  <Check size={16} className="text-[#ff5a5f]" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Languages Spoken */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Languages Spoken by Staff</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select languages your staff can communicate in
        </p>
        <div className="grid grid-cols-3 gap-2">
          {languages.map((language) => (
            <button
              key={language}
              onClick={() => toggleItem(language, selectedLanguages, setSelectedLanguages, 'languages')}
              className={`p-2 rounded-lg border text-center ${
                selectedLanguages.includes(language)
                  ? 'border-[#ff5a5f] bg-[#ff5a5f]/5 text-[#ff5a5f]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm">{language}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility Features */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Accessibility Features</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select accessibility features available at your property
        </p>
        <div className="grid grid-cols-1 gap-2">
          {accessibilityFeatures.map((feature) => (
            <button
              key={feature}
              onClick={() => toggleItem(feature, selectedAccessibility, setSelectedAccessibility, 'accessibility')}
              className={`p-3 rounded-lg border text-left ${
                selectedAccessibility.includes(feature)
                  ? 'border-[#ff5a5f] bg-[#ff5a5f]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${
                  selectedAccessibility.includes(feature) ? 'text-[#ff5a5f]' : 'text-gray-900'
                }`}>
                  {feature}
                </span>
                {selectedAccessibility.includes(feature) && (
                  <Check size={16} className="text-[#ff5a5f]" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>{selectedServices.length} additional services</p>
          <p>{selectedLanguages.length} languages supported</p>
          <p>{selectedAccessibility.length} accessibility features</p>
        </div>
      </Card>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        className="w-full py-3 bg-[#ff5a5f] hover:bg-[#ff5a5f]/90 text-white"
      >
        Continue to Review
        <ArrowRight className="ml-2" size={18} />
      </Button>
    </div>
  );
}

// Step 8: Review & Publish
export function ReviewStep({ onComplete, existingData }: any) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    
    // Simulate publishing process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onComplete(existingData);
  };

  const getCompletionStats = () => {
    let stats = {
      totalSections: 8,
      completedSections: 0,
      totalItems: 0,
      completedItems: 0
    };

    // Calculate completion based on data
    if (existingData?.hotelName) stats.completedSections++;
    if (existingData?.city) stats.completedSections++;
    if (existingData?.amenities?.length > 0) stats.completedSections++;
    if (existingData?.rooms?.length > 0) stats.completedSections++;
    if (existingData?.checkIn) stats.completedSections++;
    if (existingData?.photos && Object.values(existingData.photos).some((arr: any) => arr.length > 0)) stats.completedSections++;
    if (existingData?.services) stats.completedSections++;
    stats.completedSections++; // Review step

    return stats;
  };

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      {/* Completion Summary */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-cyan-50 border-purple-200 dark:border-purple-700 dark:from-purple-900/20 dark:to-cyan-900/20">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#9D4EDD] to-[#00D4FF] rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            🎉 Your Hotel Listing is Ready!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You've completed all the essential steps to list your property
          </p>
          <div className="text-2xl font-bold bg-gradient-to-r from-[#9D4EDD] to-[#00D4FF] bg-clip-text text-transparent">
            {Math.round((stats.completedSections / stats.totalSections) * 100)}% Complete
          </div>
        </div>
      </Card>

      {/* Listing Summary */}
      <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Listing Summary</h3>
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Hotel Name:</span>
            <span className="font-medium dark:text-white">{existingData?.hotelName || 'Not set'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Property Type:</span>
            <span className="font-medium dark:text-white">{existingData?.propertyType || 'Not set'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Location:</span>
            <span className="font-medium dark:text-white">{existingData?.city || 'Not set'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Amenities:</span>
            <span className="font-medium dark:text-white">{existingData?.amenities?.length || 0} selected</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Room Types:</span>
            <span className="font-medium dark:text-white">{existingData?.rooms?.length || 0} configured</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Photos:</span>
            <span className="font-medium dark:text-white">
              {existingData?.photos ? Object.values(existingData.photos).reduce((total: number, arr: any) => total + arr.length, 0) : 0} uploaded
            </span>
          </div>
        </div>
      </Card>

      {/* What Happens Next */}
      <Card className="p-6 bg-gradient-to-br from-purple-50/50 to-cyan-50/50 border-purple-200 dark:border-purple-700 dark:from-purple-900/10 dark:to-cyan-900/10 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What happens next?</h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <li className="flex items-start gap-2">
            <Star className="w-4 h-4 mt-0.5 text-[#9D4EDD]" />
            <span>Your listing will be reviewed by our team (usually within 24 hours)</span>
          </li>
          <li className="flex items-start gap-2">
            <Star className="w-4 h-4 mt-0.5 text-[#9D4EDD]" />
            <span>Once approved, it will go live on TripAvail</span>
          </li>
          <li className="flex items-start gap-2">
            <Star className="w-4 h-4 mt-0.5 text-[#00D4FF]" />
            <span>You'll receive booking notifications and can manage your property</span>
          </li>
          <li className="flex items-start gap-2">
            <Star className="w-4 h-4 mt-0.5 text-[#00D4FF]" />
            <span>Our support team will help you optimize your listing</span>
          </li>
        </ul>
      </Card>

      {/* Publish Button */}
      <Button
        onClick={handlePublish}
        disabled={isPublishing}
        className="w-full h-14 bg-gradient-to-r from-[#9D4EDD] to-[#00D4FF] hover:opacity-90 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
      >
        {isPublishing ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Publishing Your Hotel...
          </div>
        ) : (
          <>
            🚀 Publish Your Hotel Listing
          </>
        )}
      </Button>

      {/* Help Text */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        You can always edit your listing later from your dashboard
      </p>
    </div>
  );
}