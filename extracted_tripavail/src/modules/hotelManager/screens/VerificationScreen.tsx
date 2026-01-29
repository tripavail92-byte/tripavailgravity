import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Clock, AlertCircle, Upload, Camera, FileText, Shield, Wifi, WifiOff, RotateCcw, Scan, Eye } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import {
  IdentityVerificationIcon,
  BusinessLicenseIcon,
  PhoneVerificationIcon,
  PropertyVerificationIcon,
  EmailVerificationIcon,
  BankVerificationIcon
} from '../../../components/icons/verification/VerificationIcons';
import { PhotoUploadPreview } from '../../../components/verification/PhotoUploadPreview';
import { MilestoneAnimation } from '../../../components/verification/MilestoneAnimation';
import { NotificationToast } from '../../../components/verification/NotificationToast';
import { BiometricVerification } from '../../../components/verification/BiometricVerification';
import { DocumentAIScanner } from '../../../components/verification/DocumentAIScanner';
import { useRealtimeVerificationUpdates } from '../../../hooks/useRealtimeVerificationUpdates';
import { useVerificationNotifications } from '../../../hooks/useVerificationNotifications';
import type { VerificationNotification } from '../../../hooks/useVerificationNotifications';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
  estimatedTime: string;
  lastUpdated?: Date;
  reviewNotes?: string;
  icon: React.ComponentType<{ className?: string; isActive?: boolean; isCompleted?: boolean }>;
}

interface VerificationScreenProps {
  onNavigate: (screen: string) => void;
}

export default function VerificationScreen({ onNavigate }: VerificationScreenProps) {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
  const [activeNotification, setActiveNotification] = useState<VerificationNotification | null>(null);
  const [showBiometric, setShowBiometric] = useState<'face' | 'fingerprint' | 'liveness' | null>(null);
  const [showDocumentScanner, setShowDocumentScanner] = useState<'id' | 'passport' | 'license' | 'business_license' | 'property_deed' | null>(null);
  
  const initialSteps: VerificationStep[] = [
    {
      id: 'email',
      title: 'Email verification',
      description: 'Confirm your email address to secure your account',
      status: 'completed',
      required: true,
      estimatedTime: '2 min',
      icon: EmailVerificationIcon
    },
    {
      id: 'phone',
      title: 'Phone number',
      description: 'Add and verify your phone number',
      status: 'completed',
      required: true,
      estimatedTime: '3 min',
      icon: PhoneVerificationIcon
    },
    {
      id: 'identity',
      title: 'Identity document',
      description: 'Upload a government-issued ID',
      status: 'in_progress',
      required: true,
      estimatedTime: '5 min',
      icon: IdentityVerificationIcon
    },
    {
      id: 'business',
      title: 'Business license',
      description: 'Provide your hotel business registration',
      status: 'pending',
      required: true,
      estimatedTime: '10 min',
      icon: BusinessLicenseIcon
    },
    {
      id: 'property',
      title: 'Property ownership',
      description: 'Verify you own or manage the property',
      status: 'pending',
      required: true,
      estimatedTime: '15 min',
      icon: PropertyVerificationIcon
    },
    {
      id: 'bank',
      title: 'Payment information',
      description: 'Add bank details for receiving payments',
      status: 'pending',
      required: false,
      estimatedTime: '7 min',
      icon: BankVerificationIcon
    }
  ];

  // Use real-time updates hook
  const { 
    steps: verificationSteps, 
    isConnected, 
    updateStepStatus,
    retryVerification,
    getRecentUpdates
  } = useRealtimeVerificationUpdates(initialSteps);

  const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = verificationSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Handle notification display
  const handleShowNotification = useCallback((notification: VerificationNotification) => {
    setActiveNotification(notification);
  }, []);

  // Use verification notifications hook
  useVerificationNotifications({
    completedSteps,
    totalSteps,
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Simulate 2 days ago
    onShowNotification: handleShowNotification
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-white" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Verified';
      case 'in_progress':
        return 'In progress';
      case 'failed':
        return 'Failed';
      default:
        return 'Not started';
    }
  };

  const handleStepClick = (stepId: string) => {
    const step = verificationSteps.find(s => s.id === stepId);
    if (step && (step.status === 'pending' || step.status === 'in_progress' || step.status === 'failed')) {
      setActiveStep(stepId);
    }
  };

  const renderStepDetail = () => {
    const step = verificationSteps.find(s => s.id === activeStep);
    if (!step) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -300 }}
        transition={{ duration: 0.3, type: "spring", damping: 25 }}
        className="fixed inset-0 bg-white z-50 overflow-y-auto"
      >
        <div className="min-h-screen p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => setActiveStep(null)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <div className="w-9" /> {/* Spacer */}
          </div>

          {/* Step Icon */}
          <div className="flex justify-center mb-8">
            <step.icon 
              className="w-24 h-24" 
              isActive={true} 
              isCompleted={step.status === 'completed'} 
            />
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>

            {step.id === 'identity' && <IdentityVerificationForm />}
            {step.id === 'business' && <BusinessLicenseForm />}
            {step.id === 'property' && <PropertyOwnershipForm />}
            {step.id === 'bank' && <BankDetailsForm />}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Verification</h2>
            <div className="flex items-center gap-2">
              <p className="text-gray-600">Build trust with guests by verifying your identity and property</p>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-[#5FAD43]" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Live updates' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <Shield className="w-8 h-8 text-[#5FAD43]" />
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Verification progress</h3>
              <p className="text-sm text-gray-600">{completedSteps} of {totalSteps} completed</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#5FAD43]">{Math.round(progressPercentage)}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <motion.div
              className="bg-[#5FAD43] h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>

          {progressPercentage === 100 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5FAD43] rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">Verification complete!</h4>
                  <p className="text-sm text-green-600">You're all set to start hosting guests</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800">Almost there!</h4>
                  <p className="text-sm text-blue-600">Complete your verification to unlock all features</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Verification Steps */}
      <div className="space-y-4">
        {verificationSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
          >
            <Card 
              className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                step.status === 'completed' ? 'bg-green-50 border-green-200' : 
                step.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                step.status === 'failed' ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <step.icon 
                    className="w-12 h-12" 
                    isActive={step.status === 'in_progress'} 
                    isCompleted={step.status === 'completed'} 
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <div className="flex items-center gap-2">
                      {step.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      <Badge variant={getStatusBadgeVariant(step.status)} className="text-xs">
                        {getStatusText(step.status)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">~{step.estimatedTime}</span>
                      {step.lastUpdated && (
                        <span className="text-xs text-blue-600">
                          Updated {new Date(step.lastUpdated).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {step.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            retryVerification(step.id);
                          }}
                          className="p-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                      {(step.status === 'pending' || step.status === 'in_progress' || step.status === 'failed') && (
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'completed' ? 'bg-[#5FAD43]' : 
                    step.status === 'in_progress' ? 'bg-blue-100' :
                    step.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {getStatusIcon(step.status)}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Step Detail Modal */}
      <AnimatePresence>
        {activeStep && renderStepDetail()}
      </AnimatePresence>

      {/* Milestone Animation */}
      <MilestoneAnimation
        milestone={activeMilestone || 0}
        isVisible={activeMilestone !== null}
        onComplete={() => setActiveMilestone(null)}
      />

      {/* Notification Toast */}
      <NotificationToast
        notification={activeNotification!}
        isVisible={activeNotification !== null}
        onDismiss={() => setActiveNotification(null)}
        onActionClick={() => {
          if (activeNotification?.action?.label === 'Continue') {
            // Navigate to next incomplete step
            const nextStep = verificationSteps.find(step => 
              step.status === 'pending' || step.status === 'in_progress' || step.status === 'failed'
            );
            if (nextStep) {
              setActiveStep(nextStep.id);
            }
          } else if (activeNotification?.action?.label === 'View Dashboard') {
            onNavigate('dashboard');
          }
        }}
      />
    </div>
  );
}

// Form Components
const IdentityVerificationForm = () => {
  const [showBiometric, setShowBiometric] = useState<'face' | 'fingerprint' | 'liveness' | null>(null);
  const [showDocumentScanner, setShowDocumentScanner] = useState<'id' | 'passport' | null>(null);
  
  const handleUpload = (files: File[]) => {
    console.log('Uploaded files:', files);
  };

  const handleBiometricComplete = (success: boolean, data?: any) => {
    setShowBiometric(null);
    if (success) {
      console.log('Biometric verification successful:', data);
    }
  };

  const handleDocumentScanComplete = (success: boolean, data?: any) => {
    setShowDocumentScanner(null);
    if (success) {
      console.log('Document scan successful:', data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Verification Options */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Choose Verification Method</h4>
        
        {/* AI-Powered Options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <motion.div
            className="p-4 border-2 border-dashed border-[#5FAD43] rounded-lg bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => setShowDocumentScanner('id')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-tour="ai-scanner-button"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#5FAD43] rounded-full flex items-center justify-center">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-green-800">🤖 AI Document Scanner</h5>
                <p className="text-sm text-green-600">Instant verification with advanced AI</p>
              </div>
              <Badge className="bg-[#5FAD43]">Recommended</Badge>
            </div>
          </motion.div>

          <motion.div
            className="p-4 border-2 border-dashed border-blue-500 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => setShowBiometric('face')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-tour="biometric-scan-button"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-blue-800">👤 Biometric Verification</h5>
                <p className="text-sm text-blue-600">Face or fingerprint scanning</p>
              </div>
              <Badge variant="outline" className="border-blue-300 text-blue-700">Secure</Badge>
            </div>
          </motion.div>
        </div>

        {/* Traditional Upload */}
        <div className="border-t pt-4">
          <h5 className="font-medium mb-3 text-gray-700">Or upload manually:</h5>
          <PhotoUploadPreview
            onUpload={handleUpload}
            maxFiles={3}
            acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
            title="Upload your government-issued ID"
            description="Front and back of your ID, passport, or driver's license"
          />
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> AI scanning provides instant results and higher accuracy than manual upload.
          </p>
        </div>
      </Card>
      
      <div className="flex gap-3">
        <Button className="flex-1 bg-[#5FAD43] hover:bg-[#4A9538]">
          Continue
        </Button>
      </div>

      {/* Biometric Verification Modal */}
      {showBiometric && (
        <BiometricVerification
          type={showBiometric}
          onComplete={handleBiometricComplete}
          onCancel={() => setShowBiometric(null)}
        />
      )}

      {/* Document Scanner Modal */}
      {showDocumentScanner && (
        <DocumentAIScanner
          documentType={showDocumentScanner}
          onComplete={handleDocumentScanComplete}
          onCancel={() => setShowDocumentScanner(null)}
        />
      )}
    </div>
  );
};

const BusinessLicenseForm = () => {
  const [showDocumentScanner, setShowDocumentScanner] = useState<'business_license' | null>(null);
  
  const handleUpload = (files: File[]) => {
    console.log('Uploaded business documents:', files);
  };

  const handleDocumentScanComplete = (success: boolean, data?: any) => {
    setShowDocumentScanner(null);
    if (success) {
      console.log('Business document scan successful:', data);
      // Auto-fill form fields with extracted data
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Business registration</h4>
        <div className="space-y-4">
          {/* AI Scanner Option */}
          <motion.div
            className="p-4 border-2 border-dashed border-[#5FAD43] rounded-lg bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => setShowDocumentScanner('business_license')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5FAD43] rounded-full flex items-center justify-center">
                <Scan className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-green-800">🤖 Scan Business License</h5>
                <p className="text-sm text-green-600">AI will extract all information automatically</p>
              </div>
            </div>
          </motion.div>

          <div className="border-t pt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business name</label>
              <Input placeholder="Enter your registered business name" />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Registration number</label>
              <Input placeholder="Enter your business registration number" />
            </div>
            
            <div className="mt-4">
              <PhotoUploadPreview
                onUpload={handleUpload}
                maxFiles={2}
                acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
                title="Upload business license"
                description="Business registration certificate or license document"
              />
            </div>
          </div>
        </div>
      </Card>
      
      <div className="flex gap-3">
        <Button className="flex-1 bg-[#5FAD43] hover:bg-[#4A9538]">
          Submit for review
        </Button>
      </div>

      {/* Document Scanner Modal */}
      {showDocumentScanner && (
        <DocumentAIScanner
          documentType={showDocumentScanner}
          onComplete={handleDocumentScanComplete}
          onCancel={() => setShowDocumentScanner(null)}
        />
      )}
    </div>
  );
};

const PropertyOwnershipForm = () => {
  const [showDocumentScanner, setShowDocumentScanner] = useState<'property_deed' | null>(null);
  
  const handleUpload = (files: File[]) => {
    console.log('Uploaded property documents:', files);
  };

  const handleDocumentScanComplete = (success: boolean, data?: any) => {
    setShowDocumentScanner(null);
    if (success) {
      console.log('Property document scan successful:', data);
      // Auto-fill form fields with extracted data
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Property verification</h4>
        <div className="space-y-4">
          {/* AI Scanner Option */}
          <motion.div
            className="p-4 border-2 border-dashed border-[#5FAD43] rounded-lg bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => setShowDocumentScanner('property_deed')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5FAD43] rounded-full flex items-center justify-center">
                <Scan className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-green-800">🏠 Scan Property Documents</h5>
                <p className="text-sm text-green-600">AI will extract ownership details automatically</p>
              </div>
            </div>
          </motion.div>

          <div className="border-t pt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Property address</label>
              <Textarea placeholder="Enter the complete address of your property" />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Ownership type</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg">
                <option>I own this property</option>
                <option>I manage this property</option>
                <option>I lease this property</option>
              </select>
            </div>
            
            <div className="mt-4">
              <PhotoUploadPreview
                onUpload={handleUpload}
                maxFiles={5}
                acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
                title="Upload ownership documents"
                description="Property deed, lease agreement, or management contract"
              />
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-700">
                📋 <strong>Required documents:</strong> Property deed/title, utility bills, or lease agreement showing your right to operate a hotel business.
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="flex gap-3">
        <Button className="flex-1 bg-[#5FAD43] hover:bg-[#4A9538]">
          Submit for review
        </Button>
      </div>

      {/* Document Scanner Modal */}
      {showDocumentScanner && (
        <DocumentAIScanner
          documentType={showDocumentScanner}
          onComplete={handleDocumentScanComplete}
          onCancel={() => setShowDocumentScanner(null)}
        />
      )}
    </div>
  );
};

const BankDetailsForm = () => (
  <div className="space-y-6">
    <Card className="p-6">
      <h4 className="font-semibold mb-4">Payment information</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bank name</label>
          <Input placeholder="Enter your bank name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Account holder name</label>
          <Input placeholder="Enter account holder name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Account number</label>
          <Input placeholder="Enter your account number" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Routing number</label>
          <Input placeholder="Enter routing number" />
        </div>
      </div>
    </Card>
    
    <div className="flex gap-3">
      <Button className="flex-1 bg-[#5FAD43] hover:bg-[#4A9538]">
        Save payment info
      </Button>
    </div>
  </div>
);