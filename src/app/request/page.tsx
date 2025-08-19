'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { DateRangePicker } from '@/components/DateRangePicker';

interface BookingFormData {
  parentName: string;
  dogName: string;
  email: string;
  phone: string;
  dogBreed: string;
  dogAge: string;
  startDate: string;
  endDate: string;
  notes: string;
}

export default function RequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<BookingFormData>({
    parentName: '',
    dogName: '',
    email: '',
    phone: '',
    dogBreed: '',
    dogAge: '',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [blackoutDates, setBlackoutDates] = useState<Date[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch blackout dates from Google Calendar
  useEffect(() => {
    const fetchBlackoutDates = async () => {
      try {
        const response = await fetch('/api/blackout-dates?months=3');
        const data = await response.json();
        
        if (data.success && data.blackoutDates) {
          const dates = data.blackoutDates.map((dateStr: string) => new Date(dateStr));
          setBlackoutDates(dates);
          console.log(`📅 Loaded ${dates.length} blackout dates from calendar`);
        }
      } catch (error) {
        console.error('Failed to fetch blackout dates:', error);
        // Continue without blackout dates if API fails
      }
    };

    fetchBlackoutDates();
  }, []);

  // Handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    
    if (range?.from && range?.to) {
      const startDate = format(range.from, 'yyyy-MM-dd');
      const endDate = format(range.to, 'yyyy-MM-dd');
      
      setFormData(prev => ({
        ...prev,
        startDate,
        endDate
      }));
      
      // Clear date-related errors
      if (errors.startDate || errors.endDate || errors.dateRange) {
        setErrors(prev => ({
          ...prev,
          startDate: '',
          endDate: '',
          dateRange: ''
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateBookingRules = (startDate: string, endDate: string): string | null => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startDay = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const endDay = end.getDay();
    
    // Check if it's a weeknight booking (Mon-Thu)
    const isWeeknight = startDay >= 1 && startDay <= 4 && endDay >= 1 && endDay <= 4;
    
    // Check if it's a valid weekend package (Fri-Mon)
    const isValidWeekend = startDay === 5 && endDay === 1; // Friday to Monday
    
    if (!isWeeknight && !isValidWeekend) {
      return 'Bookings are only allowed for weeknights (Mon-Thu) or weekend packages (Fri-Mon). No Saturday or Sunday arrivals/departures except for weekend packages.';
    }
    
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.parentName.trim()) newErrors.parentName = 'Parent name is required';
    if (!formData.dogName.trim()) newErrors.dogName = 'Dog name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }

      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }

      // Booking rules validation
      const ruleError = validateBookingRules(formData.startDate, formData.endDate);
      if (ruleError) {
        newErrors.dateRange = ruleError;
      }
    }

    // Age validation
    if (formData.dogAge && (isNaN(Number(formData.dogAge)) || Number(formData.dogAge) < 0)) {
      newErrors.dogAge = 'Please enter a valid age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect based on the booking status
        switch (result.status) {
          case 'AUTO_APPROVED':
            router.push('/approved');
            break;
          case 'PENDING':
            router.push('/pending');
            break;
          case 'DENIED':
            router.push('/denied');
            break;
          default:
            router.push('/pending');
        }
      } else {
        setErrors({ submit: result.error || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🐾 Paws Boarding Request
            </h1>
            <p className="text-gray-600">
              Submit your boarding request and we'll get back to you soon!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Parent Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Parent Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Name *
                  </label>
                  <input
                    type="text"
                    id="parentName"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.parentName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Your full name"
                  />
                  {errors.parentName && <p className="text-red-500 text-sm mt-1">{errors.parentName}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Dog Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dog Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dogName" className="block text-sm font-medium text-gray-700 mb-1">
                    Dog Name *
                  </label>
                  <input
                    type="text"
                    id="dogName"
                    name="dogName"
                    value={formData.dogName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.dogName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Your dog's name"
                  />
                  {errors.dogName && <p className="text-red-500 text-sm mt-1">{errors.dogName}</p>}
                </div>

                <div>
                  <label htmlFor="dogBreed" className="block text-sm font-medium text-gray-700 mb-1">
                    Breed
                  </label>
                  <input
                    type="text"
                    id="dogBreed"
                    name="dogBreed"
                    value={formData.dogBreed}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Golden Retriever"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="dogAge" className="block text-sm font-medium text-gray-700 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  id="dogAge"
                  name="dogAge"
                  value={formData.dogAge}
                  onChange={handleInputChange}
                  min="0"
                  max="30"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dogAge ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Age in years"
                />
                {errors.dogAge && <p className="text-red-500 text-sm mt-1">{errors.dogAge}</p>}
              </div>
            </div>

            {/* Booking Dates */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Dates</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Boarding Dates *
                  </label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    blackoutDates={blackoutDates}
                    placeholder="Click to select your boarding dates"
                    className={errors.startDate || errors.endDate || errors.dateRange ? 'border-red-500' : ''}
                  />
                  {(errors.startDate || errors.endDate) && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.startDate || errors.endDate}
                    </p>
                  )}
                </div>

                {errors.dateRange && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{errors.dateRange}</p>
                  </div>
                )}

                {dateRange?.from && dateRange?.to && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700 text-sm">
                      ✅ <strong>Selected:</strong> {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                      {' '}({Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} nights)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requests or information about your dog..."
              />
            </div>

            {/* Submit Button */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              } text-white`}
            >
              {isSubmitting ? 'Submitting Request...' : 'Submit Booking Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
