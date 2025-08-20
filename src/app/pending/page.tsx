import React from 'react';
import Link from 'next/link';

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <span className="text-2xl">🐾</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Status Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl mb-4 shadow-lg">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Request Pending
              </h1>
              <p className="text-gray-600 text-base sm:text-lg max-w-md mx-auto">
                Your booking request has been submitted and is awaiting approval.
              </p>
            </div>

            {/* What Happens Next */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-amber-800 mb-4 text-center">What Happens Next?</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-amber-700 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-amber-800 font-medium">Team Notification</p>
                    <p className="text-amber-700 text-sm">Our team has been notified via Slack and will review your request</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-amber-700 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-amber-800 font-medium">Quick Review</p>
                    <p className="text-amber-700 text-sm">We&apos;ll review your request and get back to you within 2-4 hours during business hours</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-amber-700 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-amber-800 font-medium">Email Confirmation</p>
                    <p className="text-amber-700 text-sm">You&apos;ll receive an email notification once we approve or need more info</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-amber-700 text-sm font-bold">📱</span>
                  </div>
                  <div>
                    <p className="text-amber-800 font-medium">Need Help?</p>
                    <p className="text-amber-700 text-sm">Feel free to call us if you have urgent questions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Tip */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💡</span>
                  </div>
                </div>
                <div>
                  <p className="text-blue-800 font-medium text-sm mb-1">Pro Tip</p>
                  <p className="text-blue-700 text-sm">
                    VIP customers get automatic approval when calendar availability allows. Ask us about our VIP program for faster bookings!
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <a
                href="/request"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                <span className="mr-2">🐾</span>
                Make Another Booking
              </a>
              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors font-medium"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
