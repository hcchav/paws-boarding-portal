export default function DeniedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              😔 Booking Not Available
            </h1>
            <p className="text-lg text-gray-600">
              Unfortunately, we're unable to accommodate your booking request for the selected dates.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Common Reasons</h2>
            <ul className="text-red-700 space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">📅</span>
                No availability during your requested dates
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">🏠</span>
                We've reached capacity for that time period
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">📋</span>
                Special requirements that we cannot meet
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">🗓️</span>
                Dates don't align with our booking policies
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Alternative Options</h3>
            <ul className="text-blue-700 text-sm space-y-1 text-left">
              <li>• Try different dates (we often have availability on weeknights)</li>
              <li>• Consider our weekend packages (Friday to Monday)</li>
              <li>• Contact us directly to discuss flexible arrangements</li>
              <li>• Join our VIP program for priority booking access</li>
            </ul>
          </div>

          <div className="space-y-4">
            <a
              href="/request"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Try Different Dates
            </a>
            <div className="space-x-4">
              <a
                href="tel:+1234567890"
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                📞 Call Us
              </a>
              <a
                href="mailto:info@pawsboarding.com"
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                ✉️ Email Us
              </a>
            </div>
            <div>
              <a
                href="/"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
