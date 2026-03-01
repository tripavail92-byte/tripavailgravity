import { Calendar, Clock, Info } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { StepData } from '../../types'

interface AvailabilityStepProps {
  onComplete: (data: StepData) => void
  onUpdate: (data: StepData) => void
  existingData?: StepData
  onBack: () => void
}

type AvailabilityType = 'year-round' | 'specific-dates'

export function AvailabilityStep({
  onComplete,
  onUpdate,
  existingData,
  onBack,
}: AvailabilityStepProps) {
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>(
    (existingData?.availabilityType as AvailabilityType) || 'year-round',
  )
  const [minStay, setMinStay] = useState(existingData?.minStay || 1)
  const [maxStay, setMaxStay] = useState(existingData?.maxStay || 30)
  const [blackoutDates, setBlackoutDates] = useState<string[]>(existingData?.blackoutDates || [])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Generate calendar dates for a month
  const generateCalendarDates = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const dates: (Date | null)[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push(null)
    }

    // Add actual dates
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day))
    }

    return dates
  }

  const toggleBlackoutDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    setBlackoutDates((prev) => {
      if (prev.includes(dateString)) {
        return prev.filter((d) => d !== dateString)
      } else {
        return [...prev, dateString]
      }
    })
  }

  const isDateBlocked = (date: Date | null): boolean => {
    if (!date) return false
    const dateString = date.toISOString().split('T')[0]
    return blackoutDates.includes(dateString)
  }

  const isDatePast = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleContinue = () => {
    const data = {
      availabilityType,
      minStay,
      maxStay,
      blackoutDates,
    }
    onComplete(data)
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const thisMonthDates = generateCalendarDates(currentMonth)
  const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
  const nextMonthDates = generateCalendarDates(nextMonthDate)

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Package Availability</h2>
        <p className="text-gray-600 text-lg">
          Set when your package is available and manage booking restrictions.
        </p>
      </motion.div>

      {/* Availability Type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <Label className="text-lg font-semibold">Availability Type</Label>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setAvailabilityType('year-round')}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all',
                availabilityType === 'year-round'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
              )}
            >
              <div className="font-semibold text-gray-900 mb-1">Year-Round</div>
              <div className="text-sm text-gray-600">
                Available throughout the year with blackout dates
              </div>
            </button>
            <button
              onClick={() => setAvailabilityType('specific-dates')}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all',
                availabilityType === 'specific-dates'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
              )}
            >
              <div className="font-semibold text-gray-900 mb-1">Specific Dates</div>
              <div className="text-sm text-gray-600">
                Available only during specific date ranges
              </div>
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Stay Duration Requirements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <Label className="text-lg font-semibold">Stay Duration Requirements</Label>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="minStay">Minimum Stay (nights)</Label>
              <Input
                id="minStay"
                type="number"
                min="1"
                value={minStay}
                onChange={(e) => setMinStay(parseInt(e.target.value) || 1)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="maxStay">Maximum Stay (nights)</Label>
              <Input
                id="maxStay"
                type="number"
                min="1"
                value={maxStay}
                onChange={(e) => setMaxStay(parseInt(e.target.value) || 30)}
                className="mt-2"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Blackout Dates Calendar */}
      {availabilityType === 'year-round' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4">
              <Label className="text-lg font-semibold">Blackout Dates</Label>
              <p className="text-sm text-gray-600 mt-1">{blackoutDates.length} dates blocked</p>
            </div>

            {/* Info banner */}
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4 flex items-start gap-2">
              <Info size={18} className="text-warning mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Click dates to block/unblock availability
                <br />
                <span className="text-error font-medium">Red dates are blocked</span> •
                <span className="text-success font-medium"> Green dates are available</span> •
                <span className="text-gray-500 font-medium"> Gray dates are past</span>
              </p>
            </div>

            {/* Calendar Grid - 2 months */}
            <div className="grid md:grid-cols-2 gap-6">
              {[currentMonth, nextMonthDate].map((monthDate, monthIndex) => {
                const dates = monthIndex === 0 ? thisMonthDates : nextMonthDates
                return (
                  <div key={monthIndex}>
                    <div className="font-semibold text-gray-900 mb-3 text-center">
                      {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-medium text-gray-500 py-1"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Dates grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {dates.map((date, index) => {
                        if (!date) {
                          return <div key={`empty-${index}`} className="aspect-square" />
                        }

                        const isPast = isDatePast(date)
                        const isBlocked = isDateBlocked(date)

                        return (
                          <button
                            key={index}
                            onClick={() => !isPast && toggleBlackoutDate(date)}
                            disabled={isPast}
                            className={cn(
                              'aspect-square rounded-lg text-sm font-medium transition-all',
                              isPast && 'bg-gray-100 text-gray-400 cursor-not-allowed',
                              !isPast &&
                                isBlocked &&
                                'bg-error/10 text-error border border-error/20 hover:bg-error/20',
                              !isPast &&
                                !isBlocked &&
                                'bg-success/10 text-success border border-success/20 hover:bg-success/20',
                            )}
                          >
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Month navigation */}
            <div className="flex justify-center gap-4 mt-6">
              <Button variant="outline" onClick={prevMonth}>
                Previous
              </Button>
              <Button variant="outline" onClick={nextMonth} className="hover:bg-gray-50">
                Next
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <motion.div
        className="flex justify-between pt-8 border-t border-gray-100 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Continue
        </button>
      </motion.div>
    </div>
  )
}
