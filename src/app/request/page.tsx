'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { DateRangePicker } from '@/components/DateRangePicker';

interface BookingFormData {
  parentName: string;
  email: string;
}

export default function RequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<BookingFormData>({
    parentName: '',
    email: ''
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [blackoutDates, setBlackoutDates] = useState<Date[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const totalSteps = 3; // Your Info, Booking Dates, Review

  // Fetch blackout dates from Google Calendar
  useEffect(() => {
    const fetchBlackoutDates = async () => {
      try {
        const response = await fetch('/api/blackout-dates');
        if (response.ok) {
          const data = await response.json();
          const dates = data.blackoutDates.map((dateStr: string) => {
            // Parse date string and ensure it's in local timezone
            const date = new Date(dateStr + 'T00:00:00');
            console.log(`Parsing blackout date: ${dateStr} -> ${date.toDateString()}`);
            return date;
          });
          console.log('Blackout dates set:', dates.map((d: Date) => d.toDateString()));
          setBlackoutDates(dates);
        }
      } catch (error) {
        console.error('Failed to fetch blackout dates:', error);
      }
    };

    fetchBlackoutDates();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Clear date-related errors when dates change
    if (errors.startDate || errors.endDate || errors.dateRange) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.startDate;
        delete newErrors.endDate;
        delete newErrors.dateRange;
        return newErrors;
      });
    }
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      // Step 1: Your Information
      if (!formData.parentName.trim()) {
        newErrors.parentName = 'Full name is required';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else if (currentStep === 2) {
      // Step 2: Booking Dates
      if (!dateRange?.from) {
        newErrors.startDate = 'Start date is required';
      }

      if (!dateRange?.to) {
        newErrors.endDate = 'End date is required';
      }

      // Date range validation
      if (dateRange?.from && dateRange?.to) {
        const startDate = dateRange.from;
        const endDate = dateRange.to;
        
        // Check if dates are in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (startDate < today) {
          newErrors.startDate = 'Start date cannot be in the past';
        }
        
        if (endDate < today) {
          newErrors.endDate = 'End date cannot be in the past';
        }
        
        // Check if end date is before start date
        if (endDate <= startDate) {
          newErrors.dateRange = 'End date must be after start date';
        } else {
          // Check minimum stay
          const diffTime = endDate.getTime() - startDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 1) {
            newErrors.dateRange = 'Booking must be at least 1 night';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate all fields for final submission
    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!dateRange?.from) {
      newErrors.startDate = 'Start date is required';
    }

    if (!dateRange?.to) {
      newErrors.endDate = 'End date is required';
    }

    if (dateRange?.from && dateRange?.to) {
      const startDate = dateRange.from;
      const endDate = dateRange.to;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
      
      if (endDate < today) {
        newErrors.endDate = 'End date cannot be in the past';
      }
      
      // Check if end date is before start date
      if (endDate <= startDate) {
        newErrors.dateRange = 'End date must be after start date';
      } else {
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 1) {
          newErrors.dateRange = 'Booking must be at least 1 night';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({}); // Clear errors when going back
    }
  };

  const handleReviewSubmit = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Prepare the data in the format expected by the API
      const submissionData = {
        parentName: formData.parentName,
        email: formData.email,
        dogName: 'Pet', // Default value since we removed pet details
        startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
        endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
        phone: '', // Default empty since we removed phone field
        dogBreed: '', // Default empty since we removed pet details
        dogAge: '', // Default empty since we removed pet details
        notes: '' // Default empty since we removed notes field
      };

      const response = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Paws Boarding Request
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell us about your furry friend and when you'd like them to stay with us. 
            We'll review your request and get back to you within 24 hours.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'
              }`}>1</div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'
              }`}>Your Info</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
              }`}>2</div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'
              }`}>Booking Dates</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'
              }`}>3</div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'
              }`}>Review</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 lg:p-12">

          <form onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()} className="space-y-10">
            {/* Step 1: Your Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">👤 Your Information</h2>
                  <p className="text-gray-600">Let us know who you are and how to reach you.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="parentName" className="block text-sm font-semibold text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="parentName"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-400 ${
                        errors.parentName ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.parentName && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <span>⚠️</span>
                        <span>{errors.parentName}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-400 ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <span>⚠️</span>
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Booking Dates */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-l-4 border-purple-500 pl-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">📅 Booking Dates</h2>
                      <p className="text-gray-600">Choose your boarding dates using our calendar.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Boarding Dates <span className="text-red-500">*</span>
                    </label>
                    <DateRangePicker
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      blackoutDates={blackoutDates}
                      placeholder="Click to select your boarding dates"
                      className={`transition-all duration-200 ${errors.startDate || errors.endDate || errors.dateRange ? 'ring-2 ring-red-500' : ''}`}
                    />
                    {(errors.startDate || errors.endDate) && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <span>⚠️</span>
                        <span>{errors.startDate || errors.endDate}</span>
                      </div>
                    )}
                  </div>

                  {errors.dateRange && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500">⚠️</span>
                        <p className="text-red-700 text-sm font-medium">{errors.dateRange}</p>
                      </div>
                    </div>
                  )}

                  {dateRange?.from && dateRange?.to && (
                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✅</span>
                        <p className="text-green-700 text-sm">
                          <strong>Selected:</strong> {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                          <span className="ml-2 text-green-600">
                            ({Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} nights)
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">✅ Review Your Booking</h2>
                  <p className="text-gray-600">Please review your information before submitting.</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">👤 Your Information</h3>
                      <p className="text-gray-700"><strong>Name:</strong> {formData.parentName}</p>
                      <p className="text-gray-700"><strong>Email:</strong> {formData.email}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">📅 Booking Details</h3>
                      {dateRange?.from && dateRange?.to ? (
                        <>
                          <p className="text-gray-700">
                            <strong>Dates:</strong> {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                          </p>
                          <p className="text-gray-700">
                            <strong>Duration:</strong> {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} nights
                          </p>
                        </>
                      ) : (
                        <p className="text-red-600">No dates selected</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-6 border-t border-gray-200">
              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">❌</span>
                    <p className="text-red-700 text-sm font-medium">{errors.submit}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                {/* Back Button */}
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-100"
                  >
                    ← Back
                  </button>
                )}

                {/* Next/Submit Button */}
                <div className={currentStep === 1 ? 'ml-auto' : ''}>
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-lg hover:shadow-xl"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReviewSubmit}
                      disabled={isSubmitting}
                      className={`px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-200 transform ${
                        isSubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-200 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>🐾</span>
                          <span>Submit Booking Request</span>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                {currentStep < 3 
                  ? `Step ${currentStep} of ${totalSteps}`
                  : "We'll review your request and get back to you within 24 hours"
                }
              </p>
            </div>
          </form>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Your Booking Request</h3>
                <p className="text-gray-600 mb-6">
                  Are you ready to submit your booking request? We'll review it and get back to you within 24 hours.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Summary:</h4>
                  <p className="text-sm text-gray-700"><strong>Name:</strong> {formData.parentName}</p>
                  <p className="text-sm text-gray-700"><strong>Email:</strong> {formData.email}</p>
                  {dateRange?.from && dateRange?.to && (
                    <>
                      <p className="text-sm text-gray-700">
                        <strong>Dates:</strong> {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Duration:</strong> {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} nights
                      </p>
                    </>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmModal(false);
                      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    disabled={isSubmitting}
                    className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
