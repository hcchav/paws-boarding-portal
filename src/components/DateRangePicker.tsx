"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  blackoutDates?: Date[]
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select booking dates",
  className,
  blackoutDates = [],
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(value)

  // Booking rules validation
  const isValidBookingRange = (range: DateRange | undefined): boolean => {
    if (!range?.from || !range?.to) return false

    const startDay = range.from.getDay() // 0 = Sunday, 1 = Monday, etc.
    const endDay = range.to.getDay()

    // Check if it's a weeknight booking (Mon-Thu)
    const isWeeknight = startDay >= 1 && startDay <= 4 && endDay >= 1 && endDay <= 4

    // Check if it's a valid weekend package (Fri-Mon)
    const isValidWeekend = startDay === 5 && endDay === 1 // Friday to Monday

    return isWeeknight || isValidWeekend
  }

  // Disabled dates logic
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Disable past dates
    if (date < today) return true

    // Disable blackout dates from Google Calendar
    if (blackoutDates.some(blackoutDate => 
      date.toDateString() === blackoutDate.toDateString()
    )) return true

    // For range selection, we need to allow individual dates
    // but validate the full range when both dates are selected
    return false
  }

  const handleRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range)
    
    // Only call onChange and close when we have a complete valid range
    if (range?.from && range?.to) {
      if (isValidBookingRange(range)) {
        onChange?.(range)
        setOpen(false)
      } else {
        // Show validation error - for now we'll just not close the dialog
        console.log("Invalid booking range - must be weeknights (Mon-Thu) or weekend package (Fri-Mon)")
      }
    }
    // If we only have a start date, keep the dialog open for end date selection
    // Don't call onChange until we have both dates
  }

  const formatDateRange = (range: DateRange | undefined): string => {
    if (!range?.from) return placeholder

    if (!range.to) {
      return format(range.from, "MMM dd, yyyy")
    }

    return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd, yyyy")}`
  }

  const getValidationMessage = (): string => {
    if (!selectedRange?.from || !selectedRange?.to) {
      return "Select start and end dates for your booking"
    }

    if (!isValidBookingRange(selectedRange)) {
      return "⚠️ Invalid dates: Choose weeknights (Mon-Thu) or weekend package (Fri-Mon only)"
    }

    return "✅ Valid booking dates selected"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(value)}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Boarding Dates</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Booking Rules Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Booking Rules</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• <strong>Weeknights:</strong> Monday to Thursday arrivals and departures</li>
              <li>• <strong>Weekend Package:</strong> Friday arrival, Monday departure only</li>
              <li>• <strong>No Saturday or Sunday</strong> arrivals/departures (except weekend packages)</li>
            </ul>
          </div>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="range"
              defaultMonth={selectedRange?.from}
              selected={selectedRange}
              onSelect={handleRangeSelect}
              disabled={isDateDisabled}
              numberOfMonths={2}
              className="rounded-lg border shadow-sm"
              showOutsideDays={false}
            />
          </div>

          {/* Validation Message */}
          <div className={cn(
            "p-3 rounded-md text-sm",
            selectedRange?.from && selectedRange?.to && isValidBookingRange(selectedRange)
              ? "bg-green-50 border border-green-200 text-green-700"
              : selectedRange?.from && selectedRange?.to
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-gray-50 border border-gray-200 text-gray-600"
          )}>
            {getValidationMessage()}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
              Selected dates
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
              Unavailable/Past dates
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              Blackout periods
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
