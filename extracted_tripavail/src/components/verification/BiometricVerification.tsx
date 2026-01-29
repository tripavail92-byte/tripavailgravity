import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Check, X, RotateCcw, Scan, Fingerprint, Eye, Shield, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface BiometricVerificationProps {
  type: 'face' | 'fingerprint' | 'liveness';
  onComplete: (success: boolean, data?: any) => void;
  onCancel: () => void;
}

export const BiometricVerification = ({ type, onComplete, onCancel }: BiometricVerificationProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<'prepare' | 'scan' | 'process' | 'complete'>('prepare');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const config = {
    face: {
      icon: Eye,
      title: 'Face Verification',
      description: 'Position your face within the frame for verification',
      instructions: ['Look directly at the camera', 'Keep your face centered', 'Ensure good lighting'],
      color: '#3B82F6'
    },
    fingerprint: {
      icon: Fingerprint,
      title: 'Fingerprint Scan',
      description: 'Place your finger on the scanner',
      instructions: ['Place finger firmly', 'Hold steady during scan', 'Keep finger clean and dry'],
      color: '#10B981'
    },
    liveness: {
      icon: Scan,
      title: 'Liveness Check',
      description: 'Follow the on-screen prompts to verify you are real',
      instructions: ['Blink when prompted', 'Turn your head slightly', 'Smile when indicated'],
      color: '#F59E0B'
    }
  };

  const currentConfig = config[type];
  const IconComponent = currentConfig.icon;

  useEffect(() => {
    if (type === 'face' || type === 'liveness') {
      initCamera();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [type]);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasPermission(false);
    }
  };

  const startScan = () => {
    setIsScanning(true);
    setCurrentStep('scan');
    setScanProgress(0);

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          processScan();
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const processScan = () => {
    setCurrentStep('process');
    setIsScanning(false);
    
    // Simulate AI processing
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate
      setScanSuccess(success);
      setScanComplete(true);
      setCurrentStep('complete');
      
      setTimeout(() => {
        onComplete(success, {
          type,
          timestamp: new Date(),
          confidence: success ? 0.95 + Math.random() * 0.05 : 0.3 + Math.random() * 0.4,
          biometricHash: success ? generateMockHash() : null
        });
      }, 2000);
    }, 2000);
  };

  const generateMockHash = () => {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const retryScanning = () => {
    setScanProgress(0);
    setScanComplete(false);
    setScanSuccess(false);
    setCurrentStep('prepare');
  };

  const renderPrepareStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="flex justify-center">
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${currentConfig.color}20` }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <IconComponent className="w-12 h-12" style={{ color: currentConfig.color }} />
        </motion.div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">{currentConfig.title}</h3>
        <p className="text-gray-600 mb-4">{currentConfig.description}</p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          {currentConfig.instructions.map((instruction, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              {instruction}
            </li>
          ))}
        </ul>
      </div>

      {(type === 'face' || type === 'liveness') && (
        <div className="relative rounded-lg overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
          />
          {!hasPermission && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera access required</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 border-2 border-dashed border-white/50 m-4 rounded-lg" />
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={startScan} 
          className="flex-1"
          style={{ backgroundColor: currentConfig.color }}
          disabled={!hasPermission && (type === 'face' || type === 'liveness')}
        >
          Start {currentConfig.title}
        </Button>
      </div>
    </motion.div>
  );

  const renderScanStep = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-6"
    >
      <div className="relative">
        {(type === 'face' || type === 'liveness') ? (
          <div className="relative rounded-lg overflow-hidden bg-gray-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0">
              <motion.div
                className="absolute inset-4 border-2 rounded-lg"
                style={{ borderColor: currentConfig.color }}
                animate={{
                  boxShadow: [
                    `0 0 0 0 ${currentConfig.color}40`,
                    `0 0 0 10px ${currentConfig.color}20`,
                    `0 0 0 0 ${currentConfig.color}40`
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              
              {/* Scanning line */}
              <motion.div
                className="absolute left-4 right-4 h-0.5"
                style={{ backgroundColor: currentConfig.color }}
                animate={{ y: [16, 240, 16] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
        ) : (
          // Fingerprint scanner
          <div className="relative w-48 h-48 mx-auto">
            <motion.div
              className="w-full h-full rounded-full border-4 flex items-center justify-center"
              style={{ borderColor: currentConfig.color }}
              animate={{
                boxShadow: [
                  `0 0 0 0 ${currentConfig.color}40`,
                  `0 0 0 20px ${currentConfig.color}20`,
                  `0 0 0 0 ${currentConfig.color}40`
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Fingerprint className="w-16 h-16" style={{ color: currentConfig.color }} />
            </motion.div>
            
            {/* Scanning animation */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-dashed"
              style={{ borderColor: currentConfig.color }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Scanning in progress...</h3>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <motion.div
            className="h-2 rounded-full"
            style={{ backgroundColor: currentConfig.color, width: `${scanProgress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${scanProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="text-sm text-gray-600">{scanProgress}% complete</p>
      </div>
    </motion.div>
  );

  const renderProcessStep = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-6"
    >
      <div className="flex justify-center">
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${currentConfig.color}20` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="w-12 h-12" style={{ color: currentConfig.color }} />
        </motion.div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Processing with AI</h3>
        <p className="text-gray-600">Analyzing biometric data...</p>
      </div>

      <div className="space-y-2">
        {['Extracting features...', 'Comparing patterns...', 'Verifying authenticity...'].map((step, index) => (
          <motion.div
            key={step}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.5 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentConfig.color }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
            />
            <span className="text-sm">{step}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderCompleteStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div className="flex justify-center">
        <motion.div
          className={`w-24 h-24 rounded-full flex items-center justify-center ${
            scanSuccess ? 'bg-green-100' : 'bg-red-100'
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {scanSuccess ? (
            <Check className="w-12 h-12 text-green-600" />
          ) : (
            <X className="w-12 h-12 text-red-600" />
          )}
        </motion.div>
      </div>

      <div>
        <h3 className={`text-xl font-semibold mb-2 ${scanSuccess ? 'text-green-800' : 'text-red-800'}`}>
          {scanSuccess ? 'Verification Successful!' : 'Verification Failed'}
        </h3>
        <p className="text-gray-600">
          {scanSuccess 
            ? 'Your biometric data has been verified successfully.' 
            : 'Unable to verify biometric data. Please try again.'
          }
        </p>
      </div>

      {scanSuccess && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Verification Details</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <div className="flex justify-between">
              <span>Confidence Level:</span>
              <Badge variant="outline" className="text-green-700 border-green-300">
                {scanSuccess ? '97.3%' : 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Verification Type:</span>
              <span className="font-medium">{currentConfig.title}</span>
            </div>
            <div className="flex justify-between">
              <span>Timestamp:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {!scanSuccess && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={retryScanning} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {currentStep === 'prepare' && (
            <motion.div key="prepare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderPrepareStep()}
            </motion.div>
          )}
          {currentStep === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderScanStep()}
            </motion.div>
          )}
          {currentStep === 'process' && (
            <motion.div key="process" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderProcessStep()}
            </motion.div>
          )}
          {currentStep === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderCompleteStep()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};