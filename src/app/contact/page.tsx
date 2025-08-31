import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-gray-600">
              Get in touch with our team for support and inquiries
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Ceesin Contact */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                📞 Ceesin Support
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-blue-800">General Inquiries</h3>
                  <p className="text-blue-700">support@ceesin.com</p>
                </div>
                <div>
                  <h3 className="font-medium text-blue-800">VIP Membership</h3>
                  <p className="text-blue-700">vip@ceesin.com</p>
                </div>
                <div>
                  <h3 className="font-medium text-blue-800">Photo Services</h3>
                  <p className="text-blue-700">services@ceesin.com</p>
                </div>
                <div>
                  <h3 className="font-medium text-blue-800">Business Development</h3>
                  <p className="text-blue-700">business@ceesin.com</p>
                </div>
              </div>
            </div>

            {/* Razorpay Contact */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                💳 Razorpay Support
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-green-800">Payment Issues</h3>
                  <p className="text-green-700">Available 24/7</p>
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Refund Requests</h3>
                  <p className="text-green-700">Processed through Razorpay</p>
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Technical Support</h3>
                  <p className="text-green-700">Expert assistance available</p>
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Policy Questions</h3>
                  <p className="text-green-700">Comprehensive policy support</p>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              How to Get Help
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              1. Platform Support
            </h3>
            <p className="text-gray-700 mb-6">
              For general platform questions, account issues, or feature requests:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Check our FAQ section in your dashboard</li>
              <li>Submit a support ticket through the platform</li>
              <li>Email our support team at support@ceesin.com</li>
              <li>Use the live chat feature (available for VIP members)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              2. Payment & Billing Support
            </h3>
            <p className="text-gray-700 mb-6">
              For payment-related issues, refunds, or billing questions:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Contact Razorpay directly for payment processing issues</li>
              <li>Use the Razorpay contact form for immediate assistance</li>
              <li>Check your transaction history in the Razorpay dashboard</li>
              <li>Contact Ceesin support for service-related billing questions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              3. VIP Membership Support
            </h3>
            <p className="text-gray-700 mb-6">
              For VIP membership questions and benefits:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Email our VIP team at vip@ceesin.com</li>
              <li>Access VIP support through your membership dashboard</li>
              <li>Schedule a consultation call with our VIP specialists</li>
              <li>Join our VIP community forums for peer support</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              4. Photo Services Support
            </h3>
            <p className="text-gray-700 mb-6">
              For photo editing, portfolio building, and creative services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Contact our services team at services@ceesin.com</li>
              <li>Submit project requirements through the platform</li>
              <li>Request revisions and feedback through the dashboard</li>
              <li>Schedule consultation calls with our creative team</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              5. Response Times
            </h3>
            <p className="text-gray-700 mb-6">
              We strive to respond to all inquiries promptly:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li><strong>General Support:</strong> Within 4-8 hours during business days</li>
              <li><strong>VIP Support:</strong> Within 2-4 hours (priority handling)</li>
              <li><strong>Urgent Issues:</strong> Within 1-2 hours for critical problems</li>
              <li><strong>Weekend Support:</strong> Limited support available</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              6. Business Inquiries
            </h3>
            <p className="text-gray-700 mb-6">
              For partnerships, collaborations, or business opportunities:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Email our business team at business@ceesin.com</li>
              <li>Schedule a business development call</li>
              <li>Submit partnership proposals through our website</li>
              <li>Attend our business networking events</li>
            </ul>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              {/* Razorpay Contact Button */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  🚀 Razorpay Support
                </h3>
                <p className="text-green-800 mb-4">
                  Get immediate help with payment processing, refunds, and technical issues.
                </p>
                <a
                  href="https://merchant.razorpay.com/policy/ON2AG5Chb3TwPN/contact_us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Contact Razorpay →
                </a>
              </div>

              {/* Ceesin Support Button */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  💎 Ceesin Support
                </h3>
                <p className="text-blue-800 mb-4">
                  Get help with platform features, VIP benefits, and service-related questions.
                </p>
                <a
                  href="mailto:support@ceesin.com"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Email Support →
                </a>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                ⚡ Quick Support Tips
              </h3>
              <ul className="list-disc pl-6 text-yellow-800 space-y-2">
                <li>Include your account ID or order number for faster assistance</li>
                <li>Describe your issue clearly with relevant details</li>
                <li>Attach screenshots or error messages if applicable</li>
                <li>Check our FAQ section before submitting a ticket</li>
                <li>For urgent issues, use the appropriate priority channels</li>
              </ul>
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
