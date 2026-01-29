import { motion } from 'motion/react';
import { ShieldCheck, Upload, CheckCircle, Clock, AlertCircle, FileText, CreditCard, Building } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export function VerificationFeature() {
  const verificationSteps = [
    {
      id: 1,
      title: 'Business Registration',
      description: 'Upload your business registration certificate',
      status: 'completed',
      icon: Building,
      documents: ['Business License - verified.pdf']
    },
    {
      id: 2,
      title: 'Identity Verification',
      description: 'Verify your identity with government-issued ID',
      status: 'completed',
      icon: FileText,
      documents: ['ID Document - verified.pdf']
    },
    {
      id: 3,
      title: 'Tax Information',
      description: 'Provide tax registration and VAT details',
      status: 'pending',
      icon: CreditCard,
      documents: []
    },
    {
      id: 4,
      title: 'Property Documentation',
      description: 'Upload property ownership or lease agreements',
      status: 'pending',
      icon: Building,
      documents: []
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      not_started: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.not_started}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / verificationSteps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-gray-900">Verification Center</h1>
            <p className="text-gray-600">Complete your business verification to start receiving bookings</p>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#5FAD43]" />
            <span className="text-sm font-medium text-gray-700">Verification Progress</span>
          </div>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
              <p className="text-sm text-gray-600">{completedSteps} of {verificationSteps.length} steps completed</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#5FAD43]">{Math.round(progressPercentage)}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-[#5FAD43] h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {progressPercentage === 100 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Verification Complete!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your account is fully verified. You can now receive bookings and payments.
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Verification Steps */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-900">Verification Requirements</h2>
        
        {verificationSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card className={`p-6 ${step.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    step.status === 'completed' ? 'bg-green-100' :
                    step.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <step.icon className={`w-6 h-6 ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      {getStatusIcon(step.status)}
                      {getStatusBadge(step.status)}
                    </div>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    
                    {step.documents.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Uploaded Documents:</p>
                        {step.documents.map((doc, docIndex) => (
                          <div key={docIndex} className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>{doc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {step.status === 'completed' ? (
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  ) : (
                    <Button className="bg-[#5FAD43] hover:bg-green-600" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Need Help with Verification?</h3>
              <p className="text-gray-600 mb-3">
                Our verification process helps ensure trust and safety for all users. If you have questions about the required documents or need assistance, our support team is here to help.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
                <Button variant="outline" size="sm">
                  View Requirements Guide
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}