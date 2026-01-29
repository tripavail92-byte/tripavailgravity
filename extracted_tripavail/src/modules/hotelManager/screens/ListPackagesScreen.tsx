import { PackageListingFlow, type PackageData } from '../components/PackageListingFlow';

interface ListPackagesScreenProps {
  onNavigate: (screen: string) => void;
}

export default function ListPackagesScreen({ onNavigate }: ListPackagesScreenProps) {
  const handlePackageComplete = (packageData: PackageData) => {
    // In a real app, this would save the package to the backend
    console.log('Package created:', packageData);
    
    // Navigate back to dashboard
    onNavigate('dashboard');
  };

  const handleBack = () => {
    onNavigate('dashboard');
  };

  return (
    <PackageListingFlow
      onComplete={handlePackageComplete}
      onBack={handleBack}
    />
  );
}