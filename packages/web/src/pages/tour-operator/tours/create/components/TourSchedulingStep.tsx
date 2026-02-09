import { useState } from 'react';
import { Tour } from '@/features/tour-operator/services/tourService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format, addHours } from 'date-fns';

interface TourSchedulingStepProps {
    data: Partial<Tour>;
    onUpdate: (data: Partial<Tour>) => void;
    onNext: () => void;
    onBack: () => void;
}

// Temporary interface for schedules within this component.
// Ideally, we should define Schedule interface in tourService.ts and export it.
// For now, I'll assume we pass it as a separate field 'schedules' in data (which needs to be added to Tour type/DTO).
interface ScheduleItem {
    id: string;
    start_time: string; // ISO string
    end_time: string;   // ISO string
    capacity: number;
}

export function TourSchedulingStep({ data, onUpdate, onNext, onBack }: TourSchedulingStepProps) {
    // We need to cast data to any because 'schedules' is not yet on Tour interface
    const [schedules, setSchedules] = useState<ScheduleItem[]>((data as any).schedules || []);

    const addSchedule = () => {
        // Default to tomorrow at 9 AM
        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(9, 0, 0, 0);

        // Default duration 3 hours based on tour duration? 
        // For now hardcode 3 hours or use data.duration parsers ideally.
        const end = addHours(start, 3);

        const newItem: ScheduleItem = {
            id: Math.random().toString(36).substr(2, 9),
            start_time: start.toISOString().slice(0, 16), // datetime-local format
            end_time: end.toISOString().slice(0, 16),
            capacity: data.max_participants || 20,
        };
        const newSchedules = [...schedules, newItem];
        setSchedules(newSchedules);
        onUpdate({ schedules: newSchedules } as any);
    };

    const updateSchedule = (id: string, field: keyof ScheduleItem, value: any) => {
        const newSchedules = schedules.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setSchedules(newSchedules);
        onUpdate({ schedules: newSchedules } as any);
    };

    const removeSchedule = (id: string) => {
        const newSchedules = schedules.filter(item => item.id !== id);
        setSchedules(newSchedules);
        onUpdate({ schedules: newSchedules } as any);
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dates & Availability</h2>
                <p className="text-gray-500">Manage when this tour runs and how many people can join.</p>
            </div>

            <div className="space-y-4">
                {schedules.map((schedule, index) => (
                    <Card key={schedule.id} className="p-6 border-gray-200">
                        <div className="flex justify-between items-start gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={schedule.start_time}
                                        onChange={(e) => updateSchedule(schedule.id, 'start_time', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={schedule.end_time}
                                        onChange={(e) => updateSchedule(schedule.id, 'end_time', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Capacity</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={schedule.capacity}
                                        onChange={(e) => updateSchedule(schedule.id, 'capacity', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="pt-8">
                                <Button variant="ghost" size="icon" onClick={() => removeSchedule(schedule.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                <Button onClick={addSchedule} variant="outline" className="w-full border-dashed border-2 py-8 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5">
                    <Plus className="mr-2" /> Add Departure Date
                </Button>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={schedules.length === 0}>Next Step</Button>
            </div>
        </div>
    );
}
