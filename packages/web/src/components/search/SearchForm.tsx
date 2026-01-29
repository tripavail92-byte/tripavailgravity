import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { Calendar as CalendarIcon, MapPin, Users, Search } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const POPULAR_LOCATIONS = [
    "Maldives",
    "Bali, Indonesia",
    "Santorini, Greece",
    "Kyoto, Japan",
    "Paris, France",
    "New York, USA"
]

export function SearchForm({ className }: { className?: string }) {
    const navigate = useNavigate()

    // State
    const [location, setLocation] = useState("")
    const [date, setDate] = useState<DateRange | undefined>()
    const [guests, setGuests] = useState(1)
    const [openLocation, setOpenLocation] = useState(false)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()

        const params = new URLSearchParams()
        if (location) params.set("q", location)
        if (date?.from) params.set("from", date.from.toISOString())
        if (date?.to) params.set("to", date.to.toISOString())
        params.set("guests", guests.toString())

        navigate(`/search?${params.toString()}`)
    }

    return (
        <div className={cn("p-4 bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-gray-100", className)}>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">

                {/* Location Input */}
                <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1 ml-1 block">Where</Label>
                    <Popover open={openLocation} onOpenChange={setOpenLocation}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openLocation}
                                className="w-full justify-between h-12 text-left font-normal border-gray-200 hover:border-primary hover:bg-red-50/10"
                            >
                                {location || "Search destinations"}
                                <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50 text-primary" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search locations..." />
                                <CommandList>
                                    <CommandEmpty>No location found.</CommandEmpty>
                                    <CommandGroup heading="Popular Destinations">
                                        {POPULAR_LOCATIONS.map((loc) => (
                                            <CommandItem
                                                key={loc}
                                                value={loc}
                                                onSelect={(currentValue) => {
                                                    setLocation(currentValue)
                                                    setOpenLocation(false)
                                                }}
                                            >
                                                <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                                                {loc}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Date Picker */}
                <div className="flex-1 min-w-[240px]">
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1 ml-1 block">When</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal h-12 border-gray-200 hover:border-primary hover:bg-red-50/10",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLO dd")} - {format(date.to, "LLO dd")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Add dates</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Guests Input */}
                <div className="w-full md:w-[140px]">
                    <Label className="text-xs font-bold uppercase text-gray-500 mb-1 ml-1 block">Who</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            min={1}
                            max={16}
                            value={guests}
                            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                            className="h-12 border-gray-200 hover:border-primary focus:border-primary"
                        />
                        <Users className="absolute right-3 top-3.5 h-4 w-4 text-primary opacity-50" />
                    </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-[#FF385C] to-[#FF6B9D] hover:opacity-90 transition-opacity rounded-lg"
                    >
                        <Search className="mr-2 h-4 w-4" />
                        Search
                    </Button>
                </div>
            </form>
        </div>
    )
}
