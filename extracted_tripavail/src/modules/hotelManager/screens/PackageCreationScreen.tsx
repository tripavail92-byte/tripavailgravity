import { PackageListingFlow, type PackageData } from '../components/PackageListingFlow';

interface PackageCreationScreenProps {
  onNavigate: (screen: string) => void;
}

export default function PackageCreationScreen({ onNavigate }: PackageCreationScreenProps) {
  const handlePackageComplete = (packageData: PackageData) => {
    // In a real app, this would save the package to the backend
    console.log('Package created:', packageData);
    
    // Navigate back to packages list
    onNavigate('list-packages');
  };

  const handleBack = () => {
    onNavigate('list-packages');
  };

  return (
    <PackageListingFlow
      onComplete={handlePackageComplete}
      onBack={handleBack}
    />
  );
}