import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import { Badge } from '../../../../components/ui/badge';
import { Calendar } from '../../../../components/ui/calendar';

interface TourCalendarStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCompleting: boolean;
}

interface TourSchedule {
  id: string;
  date: Date;
  time: string;
  duration: string;
  maxParticipants: number;
  currentBookings: number;
  price: number;
  isAvailable: boolean;
  notes: string;
}

interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek: number[];
  endDate: Date | null;
  maxOccurrences: number | null;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' }
];

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export function TourCalendarStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isCompleting
}: TourCalendarStepProps) {
  const [calendarData, setCalendarData] = useState({
    schedules: data.schedules || [],
    useRecurring: data.useRecurring || false,
    recurringPattern: data.recurringPattern || {
      type: 'weekly',
      interval: 1,
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      endDate: null,
      maxOccurrences: 10
    },
    seasonalPricing: data.seasonalPricing || false,
    advanceBookingDays: data.advanceBookingDays || 30,
    minimumNotice: data.minimumNotice || 24
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    time: '09:00',
    duration: '4 hours',
    maxParticipants: 10,
    price: 0,
    notes: ''
  });

  useEffect(() => {
    onUpdate(calendarData);
  }, [calendarData]);

  const handleInputChange = (field: string, value: any) => {
    setCalendarData(prev => ({ ...prev, [field]: value }));
  };

  const updateRecurringPattern = (field: string, value: any) => {
    setCalendarData(prev => ({
      ...prev,
      recurringPattern: { ...prev.recurringPattern, [field]: value }
    }));
  };

  const addSchedule = () => {
    if (!selectedDate) return;

    const schedule: TourSchedule = {
      id: Date.now().toString(),
      date: selectedDate,
      time: newSchedule.time,
      duration: newSchedule.duration,
      maxParticipants: newSchedule.maxParticipants,
      currentBookings: 0,
      price: newSchedule.price || 0,
      isAvailable: true,
      notes: newSchedule.notes
    };

    setCalendarData(prev => ({
      ...prev,
      schedules: [...prev.schedules, schedule]
    }));

    setNewSchedule({
      time: '09:00',
      duration: '4 hours',
      maxParticipants: 10,
      price: 0,
      notes: ''
    });
    setShowAddSchedule(false);
  };

  const removeSchedule = (scheduleId: string) => {
    setCalendarData(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== scheduleId)
    }));
  };

  const toggleScheduleAvailability = (scheduleId: string) => {
    setCalendarData(prev => ({
      ...prev,
      schedules: prev.schedules.map(s =>
        s.id === scheduleId ? { ...s, isAvailable: !s.isAvailable } : s
      )
    }));
  };

  const generateRecurringSchedules = () => {
    const { recurringPattern } = calendarData;
    const schedules: TourSchedule[] = [];
    const startDate = selectedDate || new Date();
    
    let currentDate = new Date(startDate);
    let count = 0;
    const maxCount = recurringPattern.maxOccurrences || 50;
    const endDate = recurringPattern.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default

    while (count < maxCount && currentDate <= endDate) {
      if (recurringPattern.type === 'weekly' && recurringPattern.daysOfWeek.includes(currentDate.getDay())) {
        const schedule: TourSchedule = {
          id: `recurring-${currentDate.getTime()}-${count}`,
          date: new Date(currentDate),
          time: newSchedule.time,
          duration: newSchedule.duration,
          maxParticipants: newSchedule.maxParticipants,
          currentBookings: 0,
          price: newSchedule.price || 0,
          isAvailable: true,
          notes: 'Generated from recurring pattern'
        };
        schedules.push(schedule);
        count++;
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setCalendarData(prev => ({
      ...prev,
      schedules: [...prev.schedules, ...schedules]
    }));
  };

  const getSchedulesForDate = useCallback((date: Date) => {
    return calendarData.schedules.filter(schedule => 
      schedule.date.toDateString() === date.toDateString()
    );
  }, [calendarData.schedules]);

  const getSchedulesForMonth = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    return calendarData.schedules.filter(schedule => {
      const scheduleMonth = schedule.date.getMonth();
      const scheduleYear = schedule.date.getFullYear();
      return scheduleMonth === monthIndex && scheduleYear === year;
    });
  };

  const hasScheduleOnDate = useCallback((date: Date) => {
    return calendarData.schedules.some(schedule => 
      schedule.date.toDateString() === date.toDateString()
    );
  }, [calendarData.schedules]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedDateSchedules = useMemo(() => 
    selectedDate ? getSchedulesForDate(selectedDate) : [], 
    [selectedDate, getSchedulesForDate]
  );

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-[#5FAD43] to-[#4a9637] text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Tour Schedule</h2>
            <p className="text-green-100">Set your availability and manage bookings</p>
          </div>
        </div>
      </Card>

      {/* Quick Setup Options */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Setup</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advance Booking Period
            </label>
            <Select 
              value={calendarData.advanceBookingDays.toString()} 
              onValueChange={(value) => handleInputChange('advanceBookingDays', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="14">2 weeks</SelectItem>
                <SelectItem value="30">1 month</SelectItem>
                <SelectItem value="60">2 months</SelectItem>
                <SelectItem value="90">3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Notice (hours)
            </label>
            <Select 
              value={calendarData.minimumNotice.toString()} 
              onValueChange={(value) => handleInputChange('minimumNotice', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Calendar and Schedule Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Schedule Calendar</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={{
              hasSchedule: (date) => hasScheduleOnDate(date)
            }}
            modifiersStyles={{
              hasSchedule: {
                backgroundColor: '#5FAD43',
                color: 'white',
                fontWeight: 'bold'
              }
            }}
            className="rounded-md border"
          />

          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#5FAD43] rounded"></div>
              <span>Has schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>Available</span>
            </div>
          </div>
        </Card>

        {/* Schedule Details */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {selectedDate ? formatDate(selectedDate) : 'Select a date'}
            </h3>
            <Button
              size="sm"
              onClick={() => setShowAddSchedule(true)}
              disabled={!selectedDate}
              className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Schedule
            </Button>
          </div>

          {selectedDate && (
            <div className="space-y-3">
              {selectedDateSchedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No schedules for this date</p>
                  <p className="text-sm">Click "Add Schedule" to create one</p>
                </div>
              ) : (
                selectedDateSchedules.map((schedule) => (
                  <motion.div
                    key={schedule.id}
                    className={`p-3 border rounded-lg ${
                      schedule.isAvailable ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{schedule.time}</span>
                          <Badge variant={schedule.isAvailable ? "default" : "secondary"}>
                            {schedule.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{schedule.duration}</p>
                        <p className="text-sm text-gray-600">
                          {schedule.currentBookings}/{schedule.maxParticipants} participants
                        </p>
                        {schedule.notes && (
                          <p className="text-xs text-gray-500 mt-1">{schedule.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleScheduleAvailability(schedule.id)}
                        >
                          {schedule.isAvailable ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeSchedule(schedule.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Recurring Schedule Setup */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Recurring Schedule</h3>
            <p className="text-sm text-gray-600">Automatically create recurring tour schedules</p>
          </div>
          <Switch
            checked={calendarData.useRecurring}
            onCheckedChange={(checked) => handleInputChange('useRecurring', checked)}
          />
        </div>

        <AnimatePresence>
          {calendarData.useRecurring && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repeat Pattern
                  </label>
                  <Select 
                    value={calendarData.recurringPattern.type} 
                    onValueChange={(value) => updateRecurringPattern('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Occurrences
                  </label>
                  <Input
                    type="number"
                    value={calendarData.recurringPattern.maxOccurrences || ''}
                    onChange={(e) => updateRecurringPattern('maxOccurrences', parseInt(e.target.value) || null)}
                    placeholder="10"
                  />
                </div>
              </div>

              {calendarData.recurringPattern.type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week
                  </label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.id}
                        onClick={() => {
                          const current = calendarData.recurringPattern.daysOfWeek;
                          const updated = current.includes(day.id)
                            ? current.filter(d => d !== day.id)
                            : [...current, day.id];
                          updateRecurringPattern('daysOfWeek', updated);
                        }}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          calendarData.recurringPattern.daysOfWeek.includes(day.id)
                            ? 'bg-[#5FAD43] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={generateRecurringSchedules}
                className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
              >
                Generate Recurring Schedules
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Schedule Summary */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-3">📅 Schedule Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Schedules</p>
            <p className="font-semibold text-gray-900">{calendarData.schedules.length}</p>
          </div>
          <div>
            <p className="text-gray-600">This Month</p>
            <p className="font-semibold text-gray-900">{getSchedulesForMonth(currentMonth).length}</p>
          </div>
          <div>
            <p className="text-gray-600">Available</p>
            <p className="font-semibold text-green-600">
              {calendarData.schedules.filter(s => s.isAvailable).length}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Advance Booking</p>
            <p className="font-semibold text-gray-900">{calendarData.advanceBookingDays} days</p>
          </div>
        </div>
      </Card>

      {/* Add Schedule Modal */}
      <AnimatePresence>
        {showAddSchedule && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="font-semibold text-gray-900 mb-4">
                Add Schedule for {selectedDate && formatDate(selectedDate)}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <Select 
                      value={newSchedule.time} 
                      onValueChange={(value) => setNewSchedule(prev => ({ ...prev, time: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <Select 
                      value={newSchedule.duration} 
                      onValueChange={(value) => setNewSchedule(prev => ({ ...prev, duration: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2 hours">2 hours</SelectItem>
                        <SelectItem value="3 hours">3 hours</SelectItem>
                        <SelectItem value="4 hours">4 hours</SelectItem>
                        <SelectItem value="6 hours">6 hours</SelectItem>
                        <SelectItem value="8 hours">8 hours</SelectItem>
                        <SelectItem value="Full day">Full day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Participants
                    </label>
                    <Input
                      type="number"
                      value={newSchedule.maxParticipants}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Override
                    </label>
                    <Input
                      type="number"
                      value={newSchedule.price}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="Use base price"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <Input
                    value={newSchedule.notes}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special instructions..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddSchedule(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addSchedule}
                  className="flex-1 bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
                >
                  Add Schedule
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst}
          className="px-6"
        >
          Previous
        </Button>
        
        <Button
          onClick={onNext}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white px-6"
        >
          Next: Review
        </Button>
      </div>
    </motion.div>
  );
}