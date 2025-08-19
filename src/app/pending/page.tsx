import React from 'react';
import Link from 'next/link';

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ⏳ Request Pending
            </h1>
            <p className="text-lg text-gray-600">
              Your booking request has been submitted and is awaiting approval.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">What Happens Next?</h2>
            <ul className="text-yellow-700 space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">📋</span>
                Our team has been notified via Slack and will review your request
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">⚡</span>
                We&apos;ll review your request and get back to you within 2-4 hours during business hours
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">📧</span>
                You&apos;ll receive an email notification once we approve or need more info
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">📱</span>
                Feel free to call us if you have urgent questions
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700 text-sm">
              <strong>Pro Tip:</strong> VIP customers get automatic approval when calendar availability allows. 
              Ask us about our VIP program for faster bookings!
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="/request"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Make Another Booking
            </a>
            <div>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
