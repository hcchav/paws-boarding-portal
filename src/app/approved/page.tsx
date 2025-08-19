import Link from 'next/link';

export default function ApprovedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎉 Booking Approved!
            </h1>
            <p className="text-lg text-gray-600">
              Great news! Your boarding request has been automatically approved.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">What's Next?</h2>
            <ul className="text-green-700 space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                You&apos;ll receive a confirmation email shortly with all the details
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                We&apos;ll send you a reminder 24 hours before your booking
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                Feel free to contact us if you have any questions
              </li>
            </ul>
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
