import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Check, X, RotateCcw, Scan, FileText, Eye, Zap, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface DocumentData {
  type: 'id' | 'passport' | 'license' | 'business_license' | 'property_deed';
  extractedText: string;
  confidence: number;
  fields: Record<string, any>;
  isValid: boolean;
  aiAnalysis: {
    authenticity: number;
    tampering: boolean;
    quality: number;
    recommendations: string[];
  };
}

interface DocumentAIScannerProps {
  documentType: 'id' | 'passport' | 'license' | 'business_license' | 'property_deed';
  onComplete: (success: boolean, data?: DocumentData) => void;
  onCancel: () => void;
}

export const DocumentAIScanner = ({ documentType, onComplete, onCancel }: DocumentAIScannerProps) => {
  const [currentStep, setCurrentStep] = useState<'capture' | 'scan' | 'analyze' | 'results'>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const documentConfig = {
    id: {
      title: 'Government ID',
      icon: FileText,
      description: 'Scan your government-issued ID card',
      expectedFields: ['name', 'id_number', 'date_of_birth', 'expiry_date'],
      color: '#3B82F6'
    },
    passport: {
      title: 'Passport',
      icon: FileText,
      description: 'Scan your passport information page',
      expectedFields: ['name', 'passport_number', 'nationality', 'expiry_date'],
      color: '#059669'
    },
    license: {
      title: 'Business License',
      icon: Shield,
      description: 'Scan your business license document',
      expectedFields: ['business_name', 'license_number', 'issue_date', 'expiry_date'],
      color: '#7C3AED'
    },
    business_license: {
      title: 'Business Registration',
      icon: FileText,
      description: 'Scan your business registration certificate',
      expectedFields: ['business_name', 'registration_number', 'incorporation_date'],
      color: '#DC2626'
    },
    property_deed: {
      title: 'Property Deed',
      icon: FileText,
      description: 'Scan your property ownership document',
      expectedFields: ['owner_name', 'property_address', 'deed_number', 'record_date'],
      color: '#EA580C'
    }
  };

  const config = documentConfig[documentType];
  const IconComponent = config.icon;

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
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
  }, []);

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      startScanning();
    }
  };

  // Start scanning process
  const startScanning = () => {
    setCurrentStep('scan');
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          startAnalysis();
          return 100;
        }
        return prev + 1.5;
      });
    }, 30);
  };

  // Start AI analysis
  const startAnalysis = () => {
    setCurrentStep('analyze');
    setAnalysisProgress(0);

    const analysisSteps = [
      'Text extraction...',
      'Field detection...',
      'Security features validation...',
      'Authenticity verification...',
      'Data structuring...'
    ];

    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeAnalysis();
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  // Complete analysis and generate results
  const completeAnalysis = () => {
    const isValid = Math.random() > 0.15; // 85% success rate
    const confidence = isValid ? 0.85 + Math.random() * 0.14 : 0.3 + Math.random() * 0.4;

    const mockData: DocumentData = {
      type: documentType,
      extractedText: generateMockText(),
      confidence,
      fields: generateMockFields(),
      isValid,
      aiAnalysis: {
        authenticity: isValid ? 0.9 + Math.random() * 0.1 : 0.2 + Math.random() * 0.5,
        tampering: !isValid && Math.random() > 0.7,
        quality: 0.7 + Math.random() * 0.3,
        recommendations: generateRecommendations(isValid)
      }
    };

    setDocumentData(mockData);
    setCurrentStep('results');
  };

  const generateMockText = () => {
    const templates = {
      id: "GOVERNMENT OF EXAMPLE STATE\nIDENTIFICATION CARD\nName: JOHN ALEXANDER SMITH\nID Number: 123456789\nDate of Birth: 15/03/1985\nExpiry Date: 15/03/2030",
      passport: "PASSPORT\nName: JANE MARIE JOHNSON\nPassport No: AB1234567\nNationality: USA\nDate of Birth: 22/07/1990\nExpiry Date: 22/07/2032",
      license: "BUSINESS LICENSE\nBusiness Name: SMITH HOTEL SERVICES LLC\nLicense Number: BL-2024-001234\nIssue Date: 01/01/2024\nExpiry Date: 31/12/2024",
      business_license: "CERTIFICATE OF INCORPORATION\nBusiness Name: PREMIUM HOSPITALITY GROUP\nRegistration Number: 987654321\nIncorporation Date: 15/06/2020",
      property_deed: "PROPERTY DEED\nOwner: MICHAEL ROBERT BROWN\nProperty Address: 123 MAIN STREET, CITY\nDeed Number: PD-789456123\nRecord Date: 10/05/2019"
    };
    
    return templates[documentType] || "Document text could not be extracted";
  };

  const generateMockFields = () => {
    const fieldTemplates = {
      id: {
        name: "John Alexander Smith",
        id_number: "123456789",
        date_of_birth: "1985-03-15",
        expiry_date: "2030-03-15"
      },
      passport: {
        name: "Jane Marie Johnson",
        passport_number: "AB1234567",
        nationality: "USA",
        expiry_date: "2032-07-22"
      },
      license: {
        business_name: "Smith Hotel Services LLC",
        license_number: "BL-2024-001234",
        issue_date: "2024-01-01",
        expiry_date: "2024-12-31"
      },
      business_license: {
        business_name: "Premium Hospitality Group",
        registration_number: "987654321",
        incorporation_date: "2020-06-15"
      },
      property_deed: {
        owner_name: "Michael Robert Brown",
        property_address: "123 Main Street, City",
        deed_number: "PD-789456123",
        record_date: "2019-05-10"
      }
    };

    return fieldTemplates[documentType] || {};
  };

  const generateRecommendations = (isValid: boolean) => {
    if (isValid) {
      return [
        "Document appears authentic",
        "All security features validated",
        "Text quality is excellent"
      ];
    } else {
      return [
        "Improve lighting conditions",
        "Ensure document is flat and unfolded",
        "Check for reflection or glare",
        "Verify document is not damaged"
      ];
    }
  };

  const retryCapture = () => {
    setCapturedImage(null);
    setScanProgress(0);
    setAnalysisProgress(0);
    setDocumentData(null);
    setCurrentStep('capture');
  };

  const renderCaptureStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${config.color}20` }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <IconComponent className="w-8 h-8" style={{ color: config.color }} />
          </motion.div>
        </div>
        <h3 className="text-xl font-semibold mb-2">{config.title} Scanner</h3>
        <p className="text-gray-600">{config.description}</p>
      </div>

      <div className="relative rounded-lg overflow-hidden bg-gray-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover"
          onLoadedMetadata={initCamera}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!hasPermission && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Camera access required</p>
              <Button
                variant="outline"
                size="sm"
                onClick={initCamera}
                className="mt-2 text-white border-white/50 hover:bg-white/10"
              >
                Enable Camera
              </Button>
            </div>
          </div>
        )}
        
        {/* Document outline guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-52 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-75" />
              <p className="text-sm opacity-75">Position document here</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Scanning Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Ensure good lighting without shadows</li>
          <li>• Keep the document flat and fully visible</li>
          <li>• Avoid reflections and glare</li>
          <li>• Hold the camera steady</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={capturePhoto} 
          className="flex-1"
          style={{ backgroundColor: config.color }}
          disabled={!hasPermission}
        >
          <Camera className="w-4 h-4 mr-2" />
          Capture Document
        </Button>
      </div>
    </motion.div>
  );

  const renderScanStep = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Scanning Document</h3>
        <p className="text-gray-600">AI is analyzing your document...</p>
      </div>

      {capturedImage && (
        <div className="relative rounded-lg overflow-hidden">
          <img src={capturedImage} alt="Captured document" className="w-full h-64 object-cover" />
          
          {/* Scanning animation overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent">
            <motion.div
              className="w-full h-full"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${config.color}40 50%, transparent 100%)`
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Scanning Progress</span>
          <span className="text-sm text-gray-500">{Math.round(scanProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="h-2 rounded-full"
            style={{ backgroundColor: config.color }}
            animate={{ width: `${scanProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {['OCR text extraction...', 'Field identification...', 'Quality assessment...'].map((step, index) => (
          <motion.div
            key={step}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: scanProgress > index * 33 ? 1 : 0.3 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: config.color }}
              animate={{ scale: scanProgress > index * 33 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 1, repeat: scanProgress > index * 33 ? Infinity : 0 }}
            />
            <span className="text-sm">{step}</span>
            {scanProgress > (index + 1) * 33 && (
              <Check className="w-4 h-4 text-green-500 ml-auto" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderAnalyzeStep = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <motion.div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${config.color}20` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="w-10 h-10" style={{ color: config.color }} />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">AI Analysis in Progress</h3>
        <p className="text-gray-600">Advanced AI is validating your document...</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Analysis Progress</span>
          <span className="text-sm text-gray-500">{Math.round(analysisProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="h-2 rounded-full"
            style={{ backgroundColor: config.color }}
            animate={{ width: `${analysisProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {[
          'Security features validation...',
          'Authenticity verification...',
          'Fraud detection analysis...',
          'Data extraction refinement...',
          'Final validation...'
        ].map((step, index) => (
          <motion.div
            key={step}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: analysisProgress > index * 20 ? 1 : 0.3 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: config.color }}
              animate={{ scale: analysisProgress > index * 20 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 1, repeat: analysisProgress > index * 20 ? Infinity : 0 }}
            />
            <span className="text-sm">{step}</span>
            {analysisProgress > (index + 1) * 20 && (
              <Check className="w-4 h-4 text-green-500 ml-auto" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderResultsStep = () => {
    if (!documentData) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="text-center">
          <motion.div
            className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              documentData.isValid ? 'bg-green-100' : 'bg-red-100'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {documentData.isValid ? (
              <Check className="w-8 h-8 text-green-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            )}
          </motion.div>
          <h3 className={`text-xl font-semibold mb-2 ${
            documentData.isValid ? 'text-green-800' : 'text-red-800'
          }`}>
            {documentData.isValid ? 'Document Verified!' : 'Verification Issues'}
          </h3>
          <p className="text-gray-600">
            {documentData.isValid 
              ? 'Your document has been successfully processed and validated.'
              : 'We encountered some issues with your document. Please review and try again.'
            }
          </p>
        </div>

        {/* Confidence and Quality Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Confidence</span>
              <Badge variant={documentData.confidence > 0.8 ? "default" : "secondary"}>
                {Math.round(documentData.confidence * 100)}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${documentData.confidence * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Authenticity</span>
              <Badge variant={documentData.aiAnalysis.authenticity > 0.8 ? "default" : "secondary"}>
                {Math.round(documentData.aiAnalysis.authenticity * 100)}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${documentData.aiAnalysis.authenticity * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Extracted Fields */}
        {documentData.isValid && Object.keys(documentData.fields).length > 0 && (
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Extracted Information
            </h4>
            <div className="space-y-2">
              {Object.entries(documentData.fields).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* AI Recommendations */}
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Scan className="w-4 h-4" />
            AI Analysis
          </h4>
          <div className="space-y-2">
            {documentData.aiAnalysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className={`w-1.5 h-1.5 rounded-full mt-2 ${
                  documentData.isValid ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-gray-600">{rec}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          {!documentData.isValid && (
            <Button variant="outline" onClick={retryCapture} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button 
            onClick={() => onComplete(documentData.isValid, documentData)} 
            className="flex-1"
            style={{ backgroundColor: documentData.isValid ? '#10B981' : config.color }}
          >
            {documentData.isValid ? 'Accept Results' : 'Continue Anyway'}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          {currentStep === 'capture' && (
            <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderCaptureStep()}
            </motion.div>
          )}
          {currentStep === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderScanStep()}
            </motion.div>
          )}
          {currentStep === 'analyze' && (
            <motion.div key="analyze" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderAnalyzeStep()}
            </motion.div>
          )}
          {currentStep === 'results' && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderResultsStep()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};