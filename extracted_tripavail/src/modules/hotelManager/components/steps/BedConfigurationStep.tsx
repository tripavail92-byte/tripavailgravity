import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { 
  SingleBedIcon,
  DoubleBedIcon,
  TwinBedsIcon,
  QueenBedIcon,
  KingBedIcon,
  SofaBedIcon,
  BunkBedIcon
} from '../../../../components/icons/rooms/BedTypeIcons';

interface BedConfigurationStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

export function BedConfigurationStep({ onComplete, existingData, onUpdate }: BedConfigurationStepProps) {
  const [selectedBeds, setSelectedBeds] = useState<string[]>(
    existingData?.currentRoom?.bedConfig || []
  );
  const [hoveredBed, setHoveredBed] = useState<string | null>(null);

  const bedConfigurations = [
    { id: 'single-bed', name: 'Single Bed', maxGuests: 1, icon: SingleBedIcon },
    { id: 'double-bed', name: 'Double Bed', maxGuests: 2, icon: DoubleBedIcon },
    { id: 'twin-beds', name: 'Twin Beds', maxGuests: 2, icon: TwinBedsIcon },
    { id: 'queen-bed', name: 'Queen Bed', maxGuests: 2, icon: QueenBedIcon },
    { id: 'king-bed', name: 'King Bed', maxGuests: 2, icon: KingBedIcon },
    { id: 'sofa-bed', name: 'Sofa Bed', maxGuests: 2, icon: SofaBedIcon },
    { id: 'bunk-bed', name: 'Bunk Bed', maxGuests: 2, icon: BunkBedIcon }
  ];

  useEffect(() => {
    if (onUpdate) {
      onUpdate({ 
        currentRoom: { 
          ...existingData?.currentRoom, 
          bedConfig: selectedBeds 
        } 
      });
    }
  }, [selectedBeds]);

  const toggleBed = (bedId: string) => {
    setSelectedBeds(prev =>
      prev.includes(bedId)
        ? prev.filter(id => id !== bedId)
        : [...prev, bedId]
    );
  };

  const handleContinue = () => {
    if (selectedBeds.length > 0) {
      onComplete({ 
        currentRoom: { 
          ...existingData?.currentRoom, 
          bedConfig: selectedBeds 
        } 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Select all bed types available in this room (you can select multiple)
          </p>
        </div>

        {/* Bed Configuration Grid - 4x2 Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '18px 12px' }}>
          {bedConfigurations.map((bed) => {
            const isSelected = selectedBeds.includes(bed.id);
            const isHovered = hoveredBed === bed.id;
            const IconComponent = bed.icon;

            return (
              <motion.button
                key={bed.id}
                onClick={() => toggleBed(bed.id)}
                onMouseEnter={() => setHoveredBed(bed.id)}
                onMouseLeave={() => setHoveredBed(null)}
                className={`relative ${
                  isSelected ? 'border-[2px]' : 'border'
                }`}
                style={{
                  width: '100%',
                  maxWidth: '160px',
                  height: '130px',
                  padding: '20px 12px',
                  borderRadius: '8px',
                  borderColor: isSelected ? '#9D4EDD' : '#E0E0E0',
                  background: '#FFFFFF',
                  transition: 'border-color 0.2s ease, border-width 0.2s ease'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Vertically Stacked: Icon Above Text, Both Centered */}
                <div className="flex flex-col items-center justify-center h-full" style={{ gap: '12px' }}>
                  {/* Icon - 60x60px with scale animation on selection */}
                  <motion.div
                    className="flex-shrink-0"
                    animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <IconComponent
                      isSelected={isSelected}
                      isHovered={isHovered}
                      size={60}
                    />
                  </motion.div>

                  {/* Bed Name - Centered */}
                  <div className="text-center">
                    <h4
                      style={{
                        fontSize: '15px',
                        lineHeight: '20px',
                        fontWeight: isSelected ? 500 : 400,
                        color: isSelected ? '#9D4EDD' : '#1A1A1A'
                      }}
                    >
                      {bed.name}
                    </h4>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selection Feedback */}
        {selectedBeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-6 border-2" style={{ 
              background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.08) 0%, rgba(0, 212, 255, 0.08) 100%)',
              borderColor: '#9D4EDD'
            }}>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%)'
                  }}>
                    <Check size={20} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1" style={{ 
                    fontWeight: 600,
                    color: '#9D4EDD'
                  }}>
                    {selectedBeds.length} bed type{selectedBeds.length > 1 ? 's' : ''} selected
                  </h3>
                  <p className="text-sm" style={{ color: '#6B21A8' }}>
                    {selectedBeds.map(bedId => {
                      const bed = bedConfigurations.find(b => b.id === bedId);
                      return bed?.name;
                    }).join(', ')}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Helper Text */}
        {selectedBeds.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border rounded-lg p-4"
            style={{
              background: 'rgba(157, 78, 221, 0.05)',
              borderColor: 'rgba(157, 78, 221, 0.2)'
            }}
          >
            <p className="text-sm" style={{ color: '#7C3AED' }}>
              💡 <strong>Tip:</strong> You can select multiple bed types if your room has different bed configurations available.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
