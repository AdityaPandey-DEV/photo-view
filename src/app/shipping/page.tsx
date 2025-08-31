import Link from 'next/link';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Shipping Policy
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">
                📦 Razorpay Shipping Policy
              </h2>
              <p className="text-purple-800 mb-4">
                Our payment processing partner Razorpay handles all shipping-related policies. Please review their shipping policy below.
              </p>
              <a
                href="https://merchant.razorpay.com/policy/ON2AG5Chb3TwPN/shipping"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Full Shipping Policy →
              </a>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Ceesin Digital Service Delivery Policy
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                🚀 Digital Services - No Physical Shipping Required
              </h3>
              <p className="text-blue-800">
                Ceesin provides digital photography services and VIP memberships. All services are delivered electronically through our platform.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              1. Service Delivery Methods
            </h3>
            <p className="text-gray-700 mb-6">
              Our services are delivered through the following digital channels:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li><strong>VIP Membership Access:</strong> Instant activation upon payment confirmation</li>
              <li><strong>Photo Editing Services:</strong> Digital delivery through secure download links</li>
              <li><strong>Portfolio Building:</strong> Online portfolio access and management tools</li>
              <li><strong>Investment Reports:</strong> Real-time dashboard updates and notifications</li>
              <li><strong>Training Materials:</strong> Access to online courses and resources</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              2. Delivery Timeline
            </h3>
            <p className="text-gray-700 mb-6">
              Service delivery times vary by service type:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li><strong>VIP Membership:</strong> Immediate activation (within 5 minutes)</li>
              <li><strong>Photo Editing:</strong> 24-48 hours for standard edits, 3-5 days for premium work</li>
              <li><strong>Portfolio Setup:</strong> 24 hours for basic setup, 3-5 days for custom designs</li>
              <li><strong>Investment Processing:</strong> Real-time updates with 24-hour settlement</li>
              <li><strong>Support Requests:</strong> Response within 4-8 hours during business days</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              3. Digital Access
            </h3>
            <p className="text-gray-700 mb-6">
              Upon successful payment, you&apos;ll receive:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-6">
              <li>Welcome email with login credentials</li>
              <li>Access to your personalized dashboard</li>
              <li>VIP membership benefits activation</li>
              <li>Download links for purchased services</li>
              <li>Mobile app access (if applicable)</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              4. Quality Assurance
            </h3>
            <p className="text-gray-700 mb-6">
              We ensure high-quality digital delivery through:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Secure file hosting with encryption</li>
              <li>Multiple download attempts allowed</li>
              <li>Quality checks before delivery</li>
              <li>Revision requests for unsatisfactory work</li>
              <li>24/7 platform availability</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              5. Technical Requirements
            </h3>
            <p className="text-gray-700 mb-6">
              To access our digital services, you need:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Internet connection (minimum 1 Mbps recommended)</li>
              <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
              <li>Email access for notifications and updates</li>
              <li>Mobile device or computer for platform access</li>
              <li>Sufficient storage for downloaded files</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              6. Delivery Confirmation
            </h3>
            <p className="text-gray-700 mb-6">
              We provide multiple confirmation methods:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Email confirmation upon service completion</li>
              <li>Dashboard notifications for real-time updates</li>
              <li>SMS alerts for important milestones</li>
              <li>Download history in your account</li>
              <li>Service completion certificates (for applicable services)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              7. International Access
            </h3>
            <p className="text-gray-700 mb-6">
              Our digital services are available worldwide:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>No geographical restrictions on service delivery</li>
              <li>Multi-language support for global users</li>
              <li>24/7 availability across all time zones</li>
              <li>Localized payment methods through Razorpay</li>
              <li>Compliance with international data protection laws</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              8. Support and Troubleshooting
            </h3>
            <p className="text-gray-700 mb-6">
              If you experience delivery issues:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-6">
              <li>Check your email spam folder for delivery emails</li>
              <li>Verify your login credentials in the dashboard</li>
              <li>Contact our support team for assistance</li>
              <li>Check your internet connection and browser compatibility</li>
              <li>Request a new download link if needed</li>
            </ol>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                🌍 Global Digital Delivery
              </h3>
              <p className="text-green-800 mb-4">
                Experience instant access to premium photography services from anywhere in the world. No shipping delays, no customs issues - just immediate digital access to your VIP benefits.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Home
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/terms"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/refund"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
