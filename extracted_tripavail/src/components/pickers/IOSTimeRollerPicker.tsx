import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';

interface IOSTimeRollerPickerProps {
  value: string; // "14:00" format
  onChange: (time: string) => void;
  label: string;
  isCheckIn?: boolean;
}

export function IOSTimeRollerPicker({ value, onChange, label, isCheckIn = true }: IOSTimeRollerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(14);
  const [selectedMinute, setSelectedMinute] = useState(0);

  // Parse existing value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setSelectedHour(h);
      setSelectedMinute(m);
    }
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const handleConfirm = () => {
    const timeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const displayValue = value 
    ? `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
    : 'Select time';

  const hasValue = !!value;

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="w-full h-12 px-4 rounded-lg border-2 flex items-center justify-between transition-all duration-200"
        style={{
          borderColor: hasValue ? '#1A1A1A' : '#E5E7EB',
          background: '#FFFFFF'
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span style={{
          color: hasValue ? '#1A1A1A' : '#6B7280',
          fontWeight: hasValue ? '600' : '500'
        }}>
          {displayValue}
        </span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="#1A1A1A" strokeWidth="2" fill="none" />
          <line x1="10" y1="10" x2="10" y2="6" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="10" x2="13" y2="10" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={handleCancel}
            />
            
            {/* Picker Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl shadow-2xl"
              style={{ width: '90%', maxWidth: '400px' }}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b" style={{ borderColor: '#F3F4F6' }}>
                <h3 className="text-center" style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1A1A1A'
                }}>
                  {label}
                </h3>
              </div>

              {/* Roller Picker Container */}
              <div className="px-6 py-8">
                <div className="flex items-center justify-center gap-4">
                  {/* Hours Roller */}
                  <div className="relative flex-1">
                    <div className="relative h-48 overflow-hidden">
                      {/* Selection highlight */}
                      <div 
                        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-10 rounded-lg border-2"
                        style={{
                          height: '52px',
                          background: 'rgba(26, 26, 26, 0.05)',
                          borderColor: '#1A1A1A'
                        }}
                      />
                      
                      {/* Scrollable hours */}
                      <div className="absolute inset-0 overflow-y-scroll hide-scrollbar">
                        <div className="py-20">
                          {hours.map((hour) => {
                            const isSelected = hour === selectedHour;
                            const distance = Math.abs(hour - selectedHour);
                            const opacity = Math.max(0.3, 1 - (distance * 0.2));
                            const scale = isSelected ? 1.1 : Math.max(0.8, 1 - (distance * 0.1));
                            
                            return (
                              <motion.button
                                key={hour}
                                onClick={() => setSelectedHour(hour)}
                                className="w-full h-12 flex items-center justify-center transition-all duration-200"
                                style={{
                                  fontSize: isSelected ? '32px' : '24px',
                                  fontWeight: isSelected ? '600' : '400',
                                  color: isSelected ? '#1A1A1A' : '#6B7280',
                                  opacity,
                                  transform: `scale(${scale})`
                                }}
                                animate={{ scale }}
                              >
                                {String(hour).padStart(2, '0')}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-2" style={{
                      fontSize: '14px',
                      color: '#6B7280'
                    }}>
                      Hours
                    </div>
                  </div>

                  {/* Colon separator */}
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '600',
                    color: '#1A1A1A',
                    paddingBottom: '28px'
                  }}>
                    :
                  </div>

                  {/* Minutes Roller */}
                  <div className="relative flex-1">
                    <div className="relative h-48 overflow-hidden">
                      {/* Selection highlight */}
                      <div 
                        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-10 rounded-lg border-2"
                        style={{
                          height: '52px',
                          background: 'rgba(26, 26, 26, 0.05)',
                          borderColor: '#1A1A1A'
                        }}
                      />
                      
                      {/* Scrollable minutes */}
                      <div className="absolute inset-0 overflow-y-scroll hide-scrollbar">
                        <div className="py-20">
                          {minutes.map((minute) => {
                            const isSelected = minute === selectedMinute;
                            const distance = Math.abs(minutes.indexOf(minute) - minutes.indexOf(selectedMinute));
                            const opacity = Math.max(0.3, 1 - (distance * 0.25));
                            const scale = isSelected ? 1.1 : Math.max(0.8, 1 - (distance * 0.15));
                            
                            return (
                              <motion.button
                                key={minute}
                                onClick={() => setSelectedMinute(minute)}
                                className="w-full h-12 flex items-center justify-center transition-all duration-200"
                                style={{
                                  fontSize: isSelected ? '32px' : '24px',
                                  fontWeight: isSelected ? '600' : '400',
                                  color: isSelected ? '#1A1A1A' : '#6B7280',
                                  opacity,
                                  transform: `scale(${scale})`
                                }}
                                animate={{ scale }}
                              >
                                {String(minute).padStart(2, '0')}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-2" style={{
                      fontSize: '14px',
                      color: '#6B7280'
                    }}>
                      Minutes
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 flex gap-3">
                <Button
                  onClick={handleCancel}
                  className="flex-1 h-12 rounded-xl border-2"
                  variant="outline"
                  style={{
                    borderColor: '#E5E7EB',
                    color: '#6B7280',
                    background: '#FFFFFF'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 h-12 rounded-xl text-white"
                  style={{
                    background: '#1A1A1A',
                    border: 'none'
                  }}
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `
      }} />
    </>
  );
}
