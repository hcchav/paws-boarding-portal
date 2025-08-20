"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import "@/styles/datepicker.css"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"

interface DateRangePickerNewProps {
  value?: { from: Date | undefined; to: Date | undefined }
  onChange?: (range: { from: Date | undefined; to: Date | undefined }) => void
  placeholder?: string
  className?: string
  blackoutDates?: Date[]
}

export function DateRangePickerNew({
  value,
  onChange,
  placeholder = "Select booking dates",
  blackoutDates = [],
}: DateRangePickerNewProps) {
  const [startDate, setStartDate] = useState<Date | null>(value?.from || null)
  const [endDate, setEndDate] = useState<Date | null>(value?.to || null)
  const [fetchedBlackoutDates, setFetchedBlackoutDates] = useState<Date[]>([])

  // Fetch blackout dates from API
  useEffect(() => {
    const fetchBlackoutDates = async () => {
      try {
        const response = await fetch('/api/blackout-dates?months=3')
        const data = await response.json()
        
        if (data.success && data.blackoutDates) {
          const dates = data.blackoutDates.map((dateStr: string) => new Date(dateStr))
          setFetchedBlackoutDates(dates)
        }
      } catch (error) {
        console.error('Failed to fetch blackout dates:', error)
      }
    }

    fetchBlackoutDates()
  }, [])

  // Combine prop blackout dates with fetched ones
  const allBlackoutDates = [...blackoutDates, ...fetchedBlackoutDates]

  const formatDateRange = (): string => {
    if (!startDate) return placeholder

    if (!endDate) {
      return format(startDate, "MMM dd, yyyy")
    }

    return `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")}`
  }

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Disable past dates
    if (date < today) return true

    // Disable blackout dates
    return allBlackoutDates.some(blackoutDate => 
      date.toDateString() === blackoutDate.toDateString()
    )
  }

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    
    // Update parent component
    onChange?.({
      from: start || undefined,
      to: end || undefined
    })
  }

  const getValidationMessage = (): string => {
    if (!startDate || !endDate) {
      return "Select start and end dates for your booking"
    }

    return "✅ Valid booking dates selected"
  }

  const isValidRange = startDate && endDate

  return (
    <div className="space-y-4">
      {/* Date Display Button */}
      <div className={cn(
        "w-full p-3 sm:p-4 border-2 rounded-xl transition-all duration-300 shadow-sm",
        !startDate && "border-gray-300 bg-gray-50",
        startDate && "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md"
      )}>
        <div className="flex items-center w-full">
          <div className={cn(
            "rounded-full flex items-center justify-center transition-all duration-200",
            "w-8 h-8 mr-3 sm:w-10 sm:h-10 sm:mr-4",
            startDate ? "bg-blue-500 shadow-lg" : "bg-gray-200"
          )}>
            <CalendarIcon className={cn(
              "h-4 w-4 sm:h-5 sm:w-5",
              startDate ? "text-white" : "text-gray-500"
            )} />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-sm sm:text-base font-semibold truncate w-full">
              {startDate ? formatDateRange() : "Select your boarding dates"}
            </span>
            {startDate && endDate ? (
              <span className="text-xs sm:text-sm text-blue-600 mt-0.5 sm:mt-1 font-medium truncate w-full">
                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} nights • Ready to book
              </span>
            ) : (
              <span className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
                Choose your dates below
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inline Calendar */}
      <div className="flex justify-center">
        <DatePicker
          selected={startDate}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          inline
          monthsShown={1}
          excludeDates={allBlackoutDates}
          filterDate={(date) => !isDateDisabled(date)}
          calendarClassName="custom-datepicker"
          dayClassName={(date) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (date < today) {
              return "past-date"
            }
            
            if (allBlackoutDates.some(blackoutDate => 
              date.toDateString() === blackoutDate.toDateString()
            )) {
              return "blackout-date"
            }
            
            return "available-date"
          }}
        />
      </div>
    </div>
  )
}
