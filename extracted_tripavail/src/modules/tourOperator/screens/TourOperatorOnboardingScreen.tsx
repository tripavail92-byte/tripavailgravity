import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Plane, MapPin, Users, Camera, Upload, Building, Plus, X } from 'lucide-react';
import exampleImage from 'figma:asset/4f669700d6395033a412c0184d2b94098b1a0b91.png';
import { 
  DayTripIcon, 
  WeekendGetawayIcon, 
  HikingIcon, 
  SightseeingIcon, 
  FestivalEventsIcon, 
  LeisureRelaxationIcon, 
  CustomOptionIcon 
} from '../../../components/icons/tour-services/AnimatedTourServiceIcons';
import {
  PlatformTermsIcon,
  CancellationIcon,
  LiabilityIcon,
  DataProtectionIcon,
  SafetyProtocolsIcon,
  BookingTermsIcon
} from '../../../components/icons/policies/AnimatedPolicyIcons';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { AirbnbBottomNav } from '../../../components/hotel-listing/AirbnbBottomNav';

interface TourOperatorOnboardingScreenProps {
  onNavigate: (screen: string) => void;
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to TripAvail',
    description: 'Let\'s set up your tour operator profile',
    component: 'WelcomeStep'
  },
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Tell us about yourself',
    component: 'PersonalInfoStep'
  },
  {
    id: 'profile-picture',
    title: 'Profile Picture',
    description: 'Add your profile picture',
    component: 'ProfilePictureStep'
  },
  {
    id: 'business-info',
    title: 'Business Information',
    description: 'Tell us about your tour business',
    component: 'BusinessInfoStep'
  },
  {
    id: 'services',
    title: 'Tour Services',
    description: 'What types of tours do you offer?',
    component: 'ServicesStep'
  },
  {
    id: 'coverage-area',
    title: 'Coverage Area',
    description: 'Where do you operate tours?',
    component: 'CoverageAreaStep'
  },
  {
    id: 'policies',
    title: 'Terms & Policies',
    description: 'Review and set your policies',
    component: 'PoliciesStep'
  },
  {
    id: 'verification',
    title: 'Verification',
    description: 'Verify your business credentials',
    component: 'VerificationStep'
  },
  {
    id: 'completion',
    title: 'Setup Complete',
    description: 'You\'re ready to create tours!',
    component: 'CompletionStep'
  }
];

export default function TourOperatorOnboardingScreen({ onNavigate }: TourOperatorOnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCompleting(false);
    onNavigate('dashboard');
  };

  const updateOnboardingData = (stepData: any) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return <PersonalInfoStep onNext={handleNext} onPrevious={handlePrevious} onUpdate={updateOnboardingData} />;
      case 2:
        return <ProfilePictureStep onNext={handleNext} onPrevious={handlePrevious} onUpdate={updateOnboardingData} />;
      case 3:
        return <BusinessInfoStep onNext={handleNext} onPrevious={handlePrevious} onUpdate={updateOnboardingData} />;
      case 4:
        return <ServicesStep onNext={handleNext} onPrevious={handlePrevious} onUpdate={updateOnboardingData} />;
      case 5:
        return <CoverageAreaStep onNext={handleNext} onPrevious={handlePrevious} onUpdate={updateOnboardingData} />;
      case 6:
        return <PoliciesStep onNext={handleNext} onPrevious={handlePrevious} onUpdate={updateOnboardingData} />;
      case 7:
        return <VerificationStep onNext={handleNext} onPrevious={handlePrevious} onUpdate={updateOnboardingData} />;
      case 8:
        return <CompletionStep onComplete={handleComplete} isCompleting={isCompleting} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Scrollable Step Content */}
      <div className="flex-1 overflow-y-auto pb-64 px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation - Airbnb Style */}
      <AirbnbBottomNav
        currentStep={currentStep + 1}
        totalSteps={ONBOARDING_STEPS.length}
        completedSteps={currentStep}
        onBack={() => {
          if (currentStep === 0) {
            onNavigate('dashboard'); // Exit to dashboard on first step
          } else {
            handlePrevious(); // Go to previous step
          }
        }}
        onNext={handleNext}
        showBack={true}
        showNext={true}
        backLabel="Back"
        nextLabel={currentStep === ONBOARDING_STEPS.length - 1 ? 'Complete Setup' : 'Next'}
        nextDisabled={isCompleting}
      />
    </div>
  );
}

// Step Components
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card className="p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="w-24 h-24 bg-[#5FAD43] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Plane className="w-12 h-12 text-[#5FAD43]" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to TripAvail</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Join our community of tour operators and start creating amazing travel experiences for adventurers around the world.
        </p>
        <Button
          onClick={onNext}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white px-8"
        >
          Get Started
        </Button>
      </motion.div>
    </Card>
  );
}

function PersonalInfoStep({ 
  onNext, 
  onPrevious, 
  onUpdate 
}: { 
  onNext: () => void; 
  onPrevious: () => void; 
  onUpdate: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    operatorName: '',
    email: '',
    phone: '',
    contactPerson: ''
  });

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate({ personalInfo: newData });
  };

  const isValid = formData.operatorName && formData.email && formData.phone;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
        <p className="text-gray-600">Let's start with your basic information</p>
      </div>
      
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tour Operator Name *
          </label>
          <input
            type="text"
            value={formData.operatorName}
            onChange={(e) => handleInputChange('operatorName', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-transparent"
            placeholder="Enter your name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-transparent"
            placeholder="+92 XXX XXXXXXX"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person (if different)
          </label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-transparent"
            placeholder="Primary contact person name"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function ProfilePictureStep({ 
  onNext, 
  onPrevious, 
  onUpdate 
}: { 
  onNext: () => void; 
  onPrevious: () => void; 
  onUpdate: (data: any) => void; 
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
        onUpdate({ profilePicture: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Picture</h3>
        <p className="text-gray-600">Add a professional photo to build trust with travelers</p>
      </div>
      
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center overflow-hidden">
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <input
            type="file"
            id="profile-upload"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <label
            htmlFor="profile-upload"
            className="absolute bottom-0 right-0 w-8 h-8 bg-[#5FAD43] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#5FAD43]/90 transition-colors"
          >
            <Upload className="w-4 h-4 text-white" />
          </label>
        </div>
        
        <div className="text-center">
          <label
            htmlFor="profile-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            {selectedImage ? 'Change Photo' : 'Upload Photo'}
          </label>
          <p className="text-sm text-gray-500 mt-2">
            JPG, PNG or GIF (max. 5MB)
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800">
          💡 A professional profile picture helps build trust and makes your tours more appealing to potential customers.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button onClick={onNext} className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white">
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function BusinessInfoStep({ 
  onNext, 
  onPrevious, 
  onUpdate 
}: { 
  onNext: () => void; 
  onPrevious: () => void; 
  onUpdate: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    businessName: '',
    yearsInBusiness: '',
    teamSize: '',
    businessDescription: '',
    companyLogo: null as string | null
  });

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate({ businessInfo: newData });
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        const newData = { ...formData, companyLogo: logoUrl };
        setFormData(newData);
        onUpdate({ businessInfo: newData });
      };
      reader.readAsDataURL(file);
    }
  };

  const isValid = formData.businessName.trim() !== '';

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Information</h3>
        <p className="text-gray-600">Tell us about your tour operation business</p>
      </div>
      
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-transparent"
            placeholder="Enter your business name"
          />
        </div>

        {/* Company Logo Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {formData.companyLogo ? (
                <img 
                  src={formData.companyLogo} 
                  alt="Company Logo" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                {formData.companyLogo ? 'Change Logo' : 'Upload Logo'}
              </label>
              <p className="text-sm text-gray-500 mt-1">
                PNG, JPG or SVG (max. 2MB). Square format recommended.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years in Business
            </label>
            <select 
              value={formData.yearsInBusiness}
              onChange={(e) => handleInputChange('yearsInBusiness', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-transparent"
            >
              <option value="">Select experience</option>
              <option value="less-than-1">Less than 1 year</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5-plus">5+ years</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Size
            </label>
            <select 
              value={formData.teamSize}
              onChange={(e) => handleInputChange('teamSize', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-transparent"
            >
              <option value="">Select team size</option>
              <option value="just-me">Just me</option>
              <option value="2-5">2-5 people</option>
              <option value="6-15">6-15 people</option>
              <option value="15-plus">15+ people</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description
          </label>
          <textarea
            rows={4}
            value={formData.businessDescription}
            onChange={(e) => handleInputChange('businessDescription', e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-transparent"
            placeholder="Describe your tour business, specialties, and what makes you unique..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function ServicesStep({ 
  onNext, 
  onPrevious, 
  onUpdate 
}: { 
  onNext: () => void; 
  onPrevious: () => void; 
  onUpdate: (data: any) => void; 
}) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customServiceInput, setCustomServiceInput] = useState('');

  const services = [
    { 
      id: 'day-trip', 
      name: 'Day Trips', 
      icon: DayTripIcon,
      description: 'Single-day adventures and excursions'
    },
    { 
      id: 'weekend-getaway', 
      name: 'Weekend Getaways', 
      icon: WeekendGetawayIcon,
      description: '2-3 day short breaks and retreats'
    },
    { 
      id: 'hiking', 
      name: 'Hiking & Trekking', 
      icon: HikingIcon,
      description: 'Mountain trails and nature walks'
    },
    { 
      id: 'sightseeing', 
      name: 'Sightseeing Tours', 
      icon: SightseeingIcon,
      description: 'Cultural landmarks and attractions'
    },
    { 
      id: 'festivals', 
      name: 'Festivals & Events', 
      icon: FestivalEventsIcon,
      description: 'Cultural celebrations and events'
    },
    { 
      id: 'leisure', 
      name: 'Leisure & Relaxation', 
      icon: LeisureRelaxationIcon,
      description: 'Spa retreats and wellness tours'
    }
  ];

  const toggleService = (serviceId: string) => {
    const newSelected = selectedServices.includes(serviceId) 
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];
    
    setSelectedServices(newSelected);
    onUpdate({ services: { selected: newSelected, custom: customServices } });
  };

  const addCustomService = () => {
    if (customServiceInput.trim() && !customServices.includes(customServiceInput.trim())) {
      const newCustomServices = [...customServices, customServiceInput.trim()];
      setCustomServices(newCustomServices);
      setCustomServiceInput('');
      setShowCustomInput(false);
      onUpdate({ services: { selected: selectedServices, custom: newCustomServices } });
    }
  };

  const removeCustomService = (service: string) => {
    const newCustomServices = customServices.filter(s => s !== service);
    setCustomServices(newCustomServices);
    onUpdate({ services: { selected: selectedServices, custom: newCustomServices } });
  };

  const handleCustomInputKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addCustomService();
    }
  };

  const isValid = selectedServices.length > 0 || customServices.length > 0;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tour Services</h3>
        <p className="text-gray-600">What types of tours do you specialize in? (Select all that apply)</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {services.map((service) => {
          const IconComponent = service.icon;
          const isSelected = selectedServices.includes(service.id);
          
          return (
            <motion.button
              key={service.id}
              onClick={() => toggleService(service.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                isSelected
                  ? 'border-[#5FAD43] bg-white shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex flex-col items-center text-center">
                <motion.div 
                  className="mb-3"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <IconComponent 
                    className="w-10 h-10" 
                    isActive={isSelected}
                  />
                </motion.div>
                <p className="font-medium mb-1 text-gray-900">
                  {service.name}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {service.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Services Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="font-medium text-gray-900">Custom Categories</h4>
          <motion.button
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Add Custom
          </motion.button>
        </div>

        {/* Custom Input */}
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 mb-3"
          >
            <input
              type="text"
              value={customServiceInput}
              onChange={(e) => setCustomServiceInput(e.target.value)}
              onKeyPress={handleCustomInputKeyPress}
              placeholder="Enter your custom tour category"
              className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-transparent text-sm"
              autoFocus
            />
            <Button 
              onClick={addCustomService}
              size="sm"
              className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
            >
              Add
            </Button>
            <Button 
              onClick={() => {
                setShowCustomInput(false);
                setCustomServiceInput('');
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </motion.div>
        )}

        {/* Custom Services List */}
        {customServices.length > 0 && (
          <div className="space-y-2">
            {customServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-white border border-[#5FAD43] rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CustomOptionIcon className="w-5 h-5" isActive={true} />
                  </motion.div>
                  <span className="text-sm font-medium text-gray-900">{service}</span>
                </div>
                <button
                  onClick={() => removeCustomService(service)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {(selectedServices.length > 0 || customServices.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-3 mb-6"
        >
          <p className="text-sm text-gray-600 mb-1">
            Selected: {selectedServices.length + customServices.length} service(s)
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedServices.map(serviceId => {
              const service = services.find(s => s.id === serviceId);
              return (
                <span key={serviceId} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {service?.name}
                </span>
              );
            })}
            {customServices.map(service => (
              <span key={service} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {service}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function CoverageAreaStep({ 
  onNext, 
  onPrevious, 
  onUpdate 
}: { 
  onNext: () => void; 
  onPrevious: () => void; 
  onUpdate: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    primaryLocation: '',
    coverageRadius: '',
    additionalLocations: ''
  });
  const [selectedRadius, setSelectedRadius] = useState('');

  // Import the coverage icons
  const { 
    CityOnlyIcon, 
    LocalRegionIcon, 
    ExtendedAreaIcon, 
    ProvincialIcon, 
    CountryWideIcon, 
    InternationalIcon 
  } = require('../../../components/icons/coverage/AnimatedCoverageIcons');

  const coverageOptions = [
    {
      id: 'city',
      title: 'City Only',
      description: 'Tours within city limits',
      icon: CityOnlyIcon,
      radius: '10-15 km',
      color: 'from-blue-500 to-blue-600',
      examples: 'Walking tours, city museums, local restaurants'
    },
    {
      id: '50km',
      title: 'Local Region',
      description: 'Nearby attractions & suburbs',
      icon: LocalRegionIcon,
      radius: 'Within 50 km',
      color: 'from-green-500 to-green-600',
      examples: 'Regional parks, nearby towns, day hikes'
    },
    {
      id: '100km',
      title: 'Extended Area',
      description: 'Day trip destinations',
      icon: ExtendedAreaIcon,
      radius: 'Within 100 km',
      color: 'from-purple-500 to-purple-600',
      examples: 'Mountain resorts, coastal areas, historical sites'
    },
    {
      id: 'provincial',
      title: 'Province/State',
      description: 'Multi-day regional tours',
      icon: ProvincialIcon,
      radius: 'Province-wide',
      color: 'from-orange-500 to-orange-600',
      examples: 'Provincial capitals, regional festivals, cultural circuits'
    },
    {
      id: 'country',
      title: 'Country-wide',
      description: 'National tour packages',
      icon: CountryWideIcon,
      radius: 'Nationwide',
      color: 'from-red-500 to-red-600',
      examples: 'Grand tours, national landmarks, multi-city packages'
    },
    {
      id: 'international',
      title: 'International',
      description: 'Cross-border adventures',
      icon: InternationalIcon,
      radius: 'Global reach',
      color: 'from-indigo-500 to-indigo-600',
      examples: 'Multi-country tours, international expeditions'
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate({ coverageArea: newData });
  };

  const handleRadiusSelect = (optionId: string) => {
    setSelectedRadius(optionId);
    handleInputChange('coverageRadius', optionId);
  };

  const isValid = formData.primaryLocation.trim() !== '' && selectedRadius !== '';

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Coverage Area</h3>
        <p className="text-gray-600">Where do you operate your tours?</p>
      </div>
      
      <div className="space-y-6 mb-8">
        {/* Primary Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <MapPin className="w-4 h-4 inline mr-1" />
            Primary Location *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.primaryLocation}
              onChange={(e) => handleInputChange('primaryLocation', e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5FAD43] focus:border-[#5FAD43] transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="e.g., Islamabad, Pakistan"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Coverage Radius - Modern Animated Cards */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Coverage Radius *
          </label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {coverageOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleRadiusSelect(option.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 overflow-hidden ${
                    selectedRadius === option.id
                      ? 'border-[#5FAD43] bg-white shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                  }`}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: selectedRadius === option.id ? 1.02 : 1.01 }}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 transition-opacity duration-300 ${
                    selectedRadius === option.id ? 'opacity-10' : ''
                  }`} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IconComponent 
                          className="w-8 h-8" 
                          isActive={selectedRadius === option.id}
                        />
                      </motion.div>
                      {selectedRadius === option.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-[#5FAD43] rounded-full flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{option.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      <span className="text-xs text-gray-500">{option.radius}</span>
                    </div>
                    <p className="text-xs text-gray-500 italic">{option.examples}</p>
                  </div>

                  {/* Selection indicator */}
                  {selectedRadius === option.id && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className="absolute bottom-0 left-0 h-1 bg-[#5FAD43]"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Additional Locations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Additional Locations <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <textarea
              rows={4}
              value={formData.additionalLocations}
              onChange={(e) => handleInputChange('additionalLocations', e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5FAD43] focus:border-[#5FAD43] transition-all duration-200 resize-none text-gray-900 placeholder-gray-500"
              placeholder="List other cities or regions where you operate tours..."
              maxLength={300}
            />
            <div className="absolute bottom-4 right-4">
              <div className="text-xs text-gray-400">
                {formData.additionalLocations.length}/300
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Adding more locations helps travelers find your tours when searching specific destinations
          </p>
        </div>

        {/* Coverage Summary */}
        {selectedRadius && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-800">Coverage Summary</h4>
            </div>
            <div className="text-sm text-green-700">
              <p className="mb-1">
                <strong>Base Location:</strong> {formData.primaryLocation || 'Not specified'}
              </p>
              <p className="mb-1">
                <strong>Coverage Radius:</strong> {coverageOptions.find(opt => opt.id === selectedRadius)?.title}
              </p>
              <p className="mb-1">
                <strong>Area Type:</strong> {coverageOptions.find(opt => opt.id === selectedRadius)?.examples}
              </p>
              {formData.additionalLocations && (
                <p>
                  <strong>Additional Areas:</strong> {formData.additionalLocations.split(',').filter(loc => loc.trim()).length} location(s)
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function PoliciesStep({ 
  onNext, 
  onPrevious, 
  onUpdate 
}: { 
  onNext: () => void; 
  onPrevious: () => void; 
  onUpdate: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    platformTermsAccepted: false,
    operatorPoliciesSet: false,
    cancellationPolicy: '',
    liabilityTerms: '',
    dataHandling: '',
    safetyProtocols: '',
    bookingTerms: ''
  });
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [operatorPolicies, setOperatorPolicies] = useState<{[key: string]: string}>({
    cancellation: '',
    liability: '',
    safety: '',
    booking: ''
  });

  const platformTermsData = [
    {
      id: 'platform-terms',
      title: 'TripAvail Platform Terms',
      icon: PlatformTermsIcon,
      description: 'Core platform rules and regulations',
      content: [
        'Use of TripAvail platform and services',
        'Commission structure and payment terms',
        'Content guidelines and intellectual property',
        'Platform dispute resolution process',
        'Account termination and suspension policies'
      ]
    },
    {
      id: 'data-protection',
      title: 'Data Protection & Privacy',
      icon: DataProtectionIcon,
      description: 'How we handle traveler and operator data',
      content: [
        'Personal data collection and processing',
        'GDPR compliance and user rights',
        'Data sharing with third parties',
        'Data retention and deletion policies',
        'Security measures and breach notifications'
      ]
    }
  ];

  const operatorPolicyTemplates = [
    {
      id: 'cancellation',
      title: 'Cancellation Policy',
      icon: CancellationIcon,
      description: 'Define your tour cancellation terms',
      placeholder: 'e.g., Full refund if cancelled 48 hours before tour date...',
      template: 'Tours cancelled 48+ hours in advance: Full refund\nTours cancelled 24-48 hours: 50% refund\nTours cancelled <24 hours: No refund\nWeather cancellations: Full refund or reschedule'
    },
    {
      id: 'liability',
      title: 'Liability & Insurance',
      icon: LiabilityIcon,
      description: 'Set liability limits and insurance coverage',
      placeholder: 'e.g., Comprehensive travel insurance covers all participants...',
      template: 'All tours include comprehensive insurance coverage\nOperator liability limited to tour cost\nParticipants advised to have personal travel insurance\nNot liable for acts of God or extreme weather'
    },
    {
      id: 'safety',
      title: 'Safety Protocols',
      icon: SafetyProtocolsIcon,
      description: 'Outline safety measures and requirements',
      placeholder: 'e.g., All participants must follow safety guidelines...',
      template: 'Safety briefing provided before all tours\nFirst aid certified guides on all tours\nEmergency contact procedures established\nAge and fitness requirements clearly communicated'
    },
    {
      id: 'booking',
      title: 'Booking Terms',
      icon: BookingTermsIcon,
      description: 'Payment and booking requirements',
      placeholder: 'e.g., 50% deposit required at booking...',
      template: '25% deposit required to secure booking\nFull payment due 7 days before tour\nGroup size minimums and maximums apply\nSpecial dietary requirements accommodated with notice'
    }
  ];

  const handlePlatformTermsAccept = () => {
    const newData = { ...formData, platformTermsAccepted: true };
    setFormData(newData);
    onUpdate({ policies: newData });
  };

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handlePolicyChange = (policyId: string, value: string) => {
    const newPolicies = { ...operatorPolicies, [policyId]: value };
    setOperatorPolicies(newPolicies);
    
    const hasAllPolicies = Object.values(newPolicies).every(policy => policy.trim() !== '');
    const newData = { 
      ...formData, 
      operatorPoliciesSet: hasAllPolicies,
      [`${policyId}Policy`]: value 
    };
    setFormData(newData);
    onUpdate({ policies: newData });
  };

  const useTemplate = (policyId: string, template: string) => {
    handlePolicyChange(policyId, template);
  };

  const isValid = formData.platformTermsAccepted && formData.operatorPoliciesSet;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms & Policies</h3>
        <p className="text-gray-600">Review platform terms and set your tour operation policies</p>
      </div>
      
      <div className="space-y-6 mb-8">
        {/* Platform Terms Section */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full" />
            </div>
            TripAvail Platform Terms
          </h4>
          
          <div className="space-y-3">
            {platformTermsData.map((section) => {
              const IconComponent = section.icon;
              const isExpanded = expandedSections.includes(section.id);
              
              return (
                <motion.div
                  key={section.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                  initial={false}
                >
                  <motion.button
                    onClick={() => handleSectionToggle(section.id)}
                    className="w-full p-4 bg-white hover:bg-gray-50 text-left transition-colors flex items-center justify-between"
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IconComponent 
                          className="w-6 h-6" 
                          isActive={isExpanded}
                        />
                      </motion.div>
                      <div>
                        <h5 className="font-medium text-gray-900">{section.title}</h5>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </motion.button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-50 border-t border-gray-200"
                      >
                        <div className="p-4">
                          <ul className="space-y-2">
                            {section.content.map((item, index) => (
                              <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-2 text-sm text-gray-700"
                              >
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          
          {/* Accept Platform Terms */}
          <motion.button
            onClick={handlePlatformTermsAccept}
            disabled={formData.platformTermsAccepted}
            className={`w-full mt-4 p-4 rounded-xl border-2 transition-all duration-300 ${
              formData.platformTermsAccepted
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800'
            }`}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-center gap-2">
              {formData.platformTermsAccepted ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                  <span className="font-medium">Platform Terms Accepted</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 rounded" />
                  <span className="font-medium">I Accept TripAvail Platform Terms</span>
                </>
              )}
            </div>
          </motion.button>
        </div>

        {/* Operator Policies Section */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-orange-600 rounded-full" />
            </div>
            Your Tour Operation Policies
          </h4>
          
          <div className="grid grid-cols-1 gap-4">
            {operatorPolicyTemplates.map((policy) => {
              const IconComponent = policy.icon;
              const hasContent = operatorPolicies[policy.id]?.trim() !== '';
              
              return (
                <motion.div
                  key={policy.id}
                  className={`border-2 rounded-xl transition-all duration-300 ${
                    hasContent ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IconComponent 
                          className="w-6 h-6" 
                          isActive={hasContent}
                        />
                      </motion.div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{policy.title}</h5>
                        <p className="text-sm text-gray-600">{policy.description}</p>
                      </div>
                      <Button
                        onClick={() => useTemplate(policy.id, policy.template)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Use Template
                      </Button>
                    </div>
                    
                    <textarea
                      rows={4}
                      value={operatorPolicies[policy.id] || ''}
                      onChange={(e) => handlePolicyChange(policy.id, e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5FAD43] focus:border-[#5FAD43] transition-all duration-200 resize-none text-sm"
                      placeholder={policy.placeholder}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Completion Summary */}
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-800">Policies Complete</h4>
            </div>
            <div className="text-sm text-green-700">
              <p className="mb-1">✅ Platform terms accepted</p>
              <p>✅ All tour operation policies configured</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function VerificationStep({ 
  onNext, 
  onPrevious, 
  onUpdate 
}: { 
  onNext: () => void; 
  onPrevious: () => void; 
  onUpdate: (data: any) => void; 
}) {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification</h3>
        <p className="text-gray-600">Verify your business to build trust with travelers</p>
      </div>
      
      <div className="space-y-6 mb-8">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Business Registration</h4>
          <p className="text-sm text-gray-600 mb-3">Upload your business registration certificate</p>
          <Button variant="outline" className="w-full">
            Upload Document
          </Button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Tourism License</h4>
          <p className="text-sm text-gray-600 mb-3">Upload your tourism operator license (if applicable)</p>
          <Button variant="outline" className="w-full">
            Upload Document
          </Button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Identity Verification</h4>
          <p className="text-sm text-gray-600 mb-3">Upload a government-issued ID</p>
          <Button variant="outline" className="w-full">
            Upload Document
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800">
          💡 Verification helps build trust with travelers and may improve your tour visibility in search results.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button onClick={onNext} className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white">
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function CompletionStep({ 
  onComplete, 
  isCompleting 
}: { 
  onComplete: () => void; 
  isCompleting: boolean; 
}) {
  return (
    <Card className="p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Setup Complete!</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Congratulations! Your tour operator profile is ready. You can now start creating and managing tours on TripAvail.
        </p>
        
        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-600" />
            <span>Profile setup completed</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-600" />
            <span>Services configured</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-600" />
            <span>Coverage area defined</span>
          </div>
        </div>
        
        <Button
          onClick={onComplete}
          disabled={isCompleting}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white px-8"
        >
          {isCompleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Finalizing...
            </>
          ) : (
            'Go to Dashboard'
          )}
        </Button>
      </motion.div>
    </Card>
  );
}