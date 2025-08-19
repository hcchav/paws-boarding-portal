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

  // Basic date range validation
  const isValidBookingRange = (range: DateRange | undefined): boolean => {
    if (!range?.from || !range?.to) return false
    return true // Allow any date range as long as both dates are selected
  }

  // Disabled dates logic
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Disable past dates
    if (date < today) return true

    // Disable blackout dates from Google Calendar
    const isBlackout = blackoutDates.some(blackoutDate => 
      date.toDateString() === blackoutDate.toDateString()
    );
    
    if (isBlackout) return true;

    // For range selection, we need to allow individual dates
    // but validate the full range when both dates are selected
    return false
  }

  // Custom modifiers for different types of disabled dates
  const modifiers = {
    pastDate: (date: Date) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date < today
    },
    blackoutDate: (date: Date) => {
      return blackoutDates.some(blackoutDate => 
        date.toDateString() === blackoutDate.toDateString()
      )
    }
  }

  const handleRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range)
    
    // Always update the parent component when range changes
    if (range?.from && range?.to && isValidBookingRange(range)) {
      onChange?.(range)
    }
    
    // Never auto-close the dialog - let user close manually
    // This allows users to see their selection and make adjustments if needed
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
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="range"
              defaultMonth={selectedRange?.from}
              selected={selectedRange}
              onSelect={handleRangeSelect}
              disabled={isDateDisabled}
              modifiers={modifiers}
              numberOfMonths={1}
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

          {/* Confirm Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setOpen(false)}
              disabled={!selectedRange?.from || !selectedRange?.to || !isValidBookingRange(selectedRange)}
              className="px-6 py-2"
            >
              Confirm Dates
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
