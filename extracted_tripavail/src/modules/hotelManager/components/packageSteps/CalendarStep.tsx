import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Ban, Check, AlertCircle } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';
import { Input } from '../../../../components/ui/input';

interface CalendarStepProps {
  onComplete: (data: { 
    availability: {
      type: 'date-ranges' | 'year-round';
      dateRanges?: Array<{ start: Date; end: Date }>;
      blackoutDates?: Date[];
      minStay?: number;
      maxStay?: number;
    }
  }) => void;
  onUpdate: (data: { 
    availability: {
      type: 'date-ranges' | 'year-round';
      dateRanges?: Array<{ start: Date; end: Date }>;
      blackoutDates?: Date[];
      minStay?: number;
      maxStay?: number;
    }
  }) => void;
  existingData?: { 
    availability?: {
      type: 'date-ranges' | 'year-round';
      dateRanges?: Array<{ start: Date; end: Date }>;
      blackoutDates?: Date[];
      minStay?: number;
      maxStay?: number;
    }
  };
}

export function CalendarStep({ onComplete, onUpdate, existingData }: CalendarStepProps) {
  const [availabilityType, setAvailabilityType] = useState<'date-ranges' | 'year-round'>(
    existingData?.availability?.type || 'year-round'
  );
  const [dateRanges, setDateRanges] = useState<Array<{ start: Date; end: Date }>>(
    existingData?.availability?.dateRanges || []
  );
  const [blackoutDates, setBlackoutDates] = useState<Date[]>(
    existingData?.availability?.blackoutDates || []
  );
  const [minStay, setMinStay] = useState(existingData?.availability?.minStay || 1);
  const [maxStay, setMaxStay] = useState(existingData?.availability?.maxStay || 30);

  // Current date for calendar reference
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Generate calendar days for current and next month
  const generateCalendarDays = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const currentMonthDays = generateCalendarDays(currentMonth, currentYear);
  const nextMonthDays = generateCalendarDays(currentMonth + 1, currentYear);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isDateBlackedOut = (date: Date) => {
    return blackoutDates.some(blackoutDate => 
      blackoutDate.toDateString() === date.toDateString()
    );
  };

  const toggleBlackoutDate = (date: Date) => {
    const isBlackedOut = isDateBlackedOut(date);
    let updatedBlackoutDates;
    
    if (isBlackedOut) {
      updatedBlackoutDates = blackoutDates.filter(blackoutDate => 
        blackoutDate.toDateString() !== date.toDateString()
      );
    } else {
      updatedBlackoutDates = [...blackoutDates, date];
    }
    
    setBlackoutDates(updatedBlackoutDates);
    updateAvailability({ blackoutDates: updatedBlackoutDates });
  };

  const updateAvailability = (updates: any) => {
    const availability = {
      type: availabilityType,
      dateRanges,
      blackoutDates,
      minStay,
      maxStay,
      ...updates
    };
    
    onUpdate({ availability });
  };

  const handleTypeChange = (type: 'date-ranges' | 'year-round') => {
    setAvailabilityType(type);
    updateAvailability({ type });
  };

  const handleMinStayChange = (value: number) => {
    setMinStay(value);
    updateAvailability({ minStay: value });
  };

  const handleMaxStayChange = (value: number) => {
    setMaxStay(value);
    updateAvailability({ maxStay: value });
  };

  const handleContinue = () => {
    const availability = {
      type: availabilityType,
      dateRanges: availabilityType === 'date-ranges' ? dateRanges : undefined,
      blackoutDates,
      minStay,
      maxStay
    };
    
    onComplete({ availability });
  };

  const renderCalendar = (days: (Date | null)[], monthOffset: number = 0) => {
    const monthDate = new Date(currentYear, currentMonth + monthOffset, 1);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 text-center">{monthName}</h4>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 text-center p-2">
              {day}
            </div>
          ))}
          {days.map((date, index) => (
            <div key={index} className="aspect-square">
              {date && (
                <motion.button
                  onClick={() => toggleBlackoutDate(date)}
                  className={`w-full h-full text-xs rounded-lg transition-all ${
                    isDateBlackedOut(date)
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : date < today
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  }`}
                  disabled={date < today}
                  whileHover={{ scale: date >= today ? 1.1 : 1 }}
                  whileTap={{ scale: date >= today ? 0.9 : 1 }}
                >
                  {date.getDate()}
                  {isDateBlackedOut(date) && (
                    <Ban className="w-3 h-3 mx-auto mt-0.5" />
                  )}
                </motion.button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Availability</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Set when your package is available and manage booking restrictions.
        </p>
      </motion.div>

      {/* Availability Type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5FAD43]" />
              <label className="text-sm font-medium text-gray-700">
                Availability Type
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  availabilityType === 'year-round'
                    ? 'border-[#5FAD43] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTypeChange('year-round')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Year-Round</h3>
                  {availabilityType === 'year-round' && (
                    <Check className="w-5 h-5 text-[#5FAD43]" />
                  )}
                </div>
                <p className="text-sm text-gray-600">Available throughout the year with blackout dates</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  availabilityType === 'date-ranges'
                    ? 'border-[#5FAD43] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTypeChange('date-ranges')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Specific Dates</h3>
                  {availabilityType === 'date-ranges' && (
                    <Check className="w-5 h-5 text-[#5FAD43]" />
                  )}
                </div>
                <p className="text-sm text-gray-600">Available only during specific date ranges</p>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stay Duration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#5FAD43]" />
              <label className="text-sm font-medium text-gray-700">
                Stay Duration Requirements
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-2 block">Minimum Stay (nights)</label>
                <Input
                  type="number"
                  value={minStay}
                  onChange={(e) => handleMinStayChange(parseInt(e.target.value) || 1)}
                  min={1}
                  max={30}
                  className="text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-2 block">Maximum Stay (nights)</label>
                <Input
                  type="number"
                  value={maxStay}
                  onChange={(e) => handleMaxStayChange(parseInt(e.target.value) || 30)}
                  min={minStay}
                  max={365}
                  className="text-center"
                />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Blackout Dates Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                <label className="text-sm font-medium text-gray-700">
                  Blackout Dates
                </label>
              </div>
              <span className="text-xs text-gray-500">
                {blackoutDates.length} dates blocked
              </span>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Click dates to block/unblock availability</p>
                <p>Red dates are blocked • Green dates are available • Gray dates are past</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderCalendar(currentMonthDays, 0)}
              {renderCalendar(nextMonthDays, 1)}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Availability Summary</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Package Type: <span className="font-medium capitalize">{availabilityType.replace('-', ' ')}</span></p>
            <p>• Stay Duration: {minStay}-{maxStay} nights</p>
            <p>• Blocked Dates: {blackoutDates.length === 0 ? 'None' : `${blackoutDates.length} dates`}</p>
          </div>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-100"
      >
        <Button
          onClick={handleContinue}
          className="w-full gradient-hotel-manager text-white py-3 rounded-xl"
        >
          Continue to Exclusions
        </Button>
      </motion.div>
    </div>
  );
}