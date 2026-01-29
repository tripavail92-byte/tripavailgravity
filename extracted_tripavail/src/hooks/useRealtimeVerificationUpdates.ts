import { useState, useEffect, useCallback } from 'react';

export interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
  estimatedTime: string;
  lastUpdated?: Date;
  reviewNotes?: string;
}

interface VerificationUpdate {
  stepId: string;
  newStatus: VerificationStep['status'];
  message?: string;
  timestamp: Date;
}

export const useRealtimeVerificationUpdates = (initialSteps: VerificationStep[]) => {
  const [steps, setSteps] = useState<VerificationStep[]>(initialSteps);
  const [pendingUpdates, setPendingUpdates] = useState<VerificationUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  // Simulate real-time connection
  useEffect(() => {
    // Simulate connection status changes
    const connectionInterval = setInterval(() => {
      setIsConnected(prev => Math.random() > 0.1 ? true : prev);
    }, 30000);

    return () => clearInterval(connectionInterval);
  }, []);

  // Simulate receiving real-time updates
  useEffect(() => {
    const updateInterval = setInterval(() => {
      // Simulate random verification updates
      const inProgressSteps = steps.filter(step => step.status === 'in_progress');
      const pendingSteps = steps.filter(step => step.status === 'pending');
      
      if (inProgressSteps.length > 0 && Math.random() > 0.7) {
        const randomStep = inProgressSteps[Math.floor(Math.random() * inProgressSteps.length)];
        const newStatus = Math.random() > 0.8 ? 'failed' : 'completed';
        
        const update: VerificationUpdate = {
          stepId: randomStep.id,
          newStatus,
          message: getStatusMessage(randomStep.title, newStatus),
          timestamp: new Date()
        };

        setPendingUpdates(prev => [...prev, update]);
      }

      // Sometimes mark pending steps as in_progress
      if (pendingSteps.length > 0 && Math.random() > 0.8) {
        const randomStep = pendingSteps[Math.floor(Math.random() * pendingSteps.length)];
        
        const update: VerificationUpdate = {
          stepId: randomStep.id,
          newStatus: 'in_progress',
          message: `Started reviewing ${randomStep.title.toLowerCase()}`,
          timestamp: new Date()
        };

        setPendingUpdates(prev => [...prev, update]);
      }
    }, 15000); // Check for updates every 15 seconds

    return () => clearInterval(updateInterval);
  }, [steps]);

  // Process pending updates
  useEffect(() => {
    if (pendingUpdates.length > 0) {
      const update = pendingUpdates[0];
      
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === update.stepId 
            ? { 
                ...step, 
                status: update.newStatus,
                lastUpdated: update.timestamp,
                reviewNotes: update.message
              }
            : step
        )
      );

      setPendingUpdates(prev => prev.slice(1));
    }
  }, [pendingUpdates]);

  // Manual update function
  const updateStepStatus = useCallback((stepId: string, newStatus: VerificationStep['status'], notes?: string) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              status: newStatus,
              lastUpdated: new Date(),
              reviewNotes: notes
            }
          : step
      )
    );
  }, []);

  // Retry failed verification
  const retryVerification = useCallback((stepId: string) => {
    updateStepStatus(stepId, 'in_progress', 'Retrying verification...');
  }, [updateStepStatus]);

  // Get recent updates
  const getRecentUpdates = useCallback(() => {
    return steps
      .filter(step => step.lastUpdated && step.lastUpdated > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .sort((a, b) => (b.lastUpdated?.getTime() || 0) - (a.lastUpdated?.getTime() || 0));
  }, [steps]);

  return {
    steps,
    isConnected,
    updateStepStatus,
    retryVerification,
    getRecentUpdates,
    hasUpdates: pendingUpdates.length > 0
  };
};

const getStatusMessage = (stepTitle: string, status: VerificationStep['status']): string => {
  switch (status) {
    case 'completed':
      return `${stepTitle} has been successfully verified`;
    case 'failed':
      return `${stepTitle} verification failed. Please review and resubmit`;
    case 'in_progress':
      return `${stepTitle} is currently being reviewed`;
    default:
      return `${stepTitle} status updated`;
  }
};