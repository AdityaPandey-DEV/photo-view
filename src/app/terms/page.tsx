import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Terms and Conditions
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                📋 Razorpay Terms and Conditions
              </h2>
              <p className="text-blue-800 mb-4">
                Our payment processing is handled securely by Razorpay. Please review their terms and conditions below.
              </p>
              <a
                href="https://merchant.razorpay.com/policy/ON2AG5Chb3TwPN/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Full Terms & Conditions →
              </a>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Ceesin Platform Terms
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              1. Acceptance of Terms
            </h3>
            <p className="text-gray-700 mb-6">
              By accessing and using the Ceesin VIP Photography Investment Platform, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              2. Platform Services
            </h3>
            <p className="text-gray-700 mb-6">
              Ceesin provides a platform for photography investment opportunities, VIP memberships, and professional photography services. All transactions are processed securely through Razorpay.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              3. User Responsibilities
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Provide accurate and truthful information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Use the platform for lawful purposes only</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              4. Payment Terms
            </h3>
            <p className="text-gray-700 mb-6">
              All payments are processed securely through Razorpay. By making a payment, you agree to Razorpay&apos;s terms and conditions. Ceesin is not responsible for any payment processing issues.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              5. Investment Risks
            </h3>
            <p className="text-gray-700 mb-6">
              Photography investments carry inherent risks. Past performance does not guarantee future results. Users should carefully consider their investment decisions and consult with financial advisors if needed.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              6. Privacy and Data
            </h3>
            <p className="text-gray-700 mb-6">
              Your privacy is important to us. Please review our Privacy Policy for information on how we collect, use, and protect your personal information.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              7. Modifications
            </h3>
            <p className="text-gray-700 mb-6">
              Ceesin reserves the right to modify these terms at any time. Users will be notified of significant changes, and continued use of the platform constitutes acceptance of modified terms.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              8. Contact Information
            </h3>
            <p className="text-gray-700 mb-6">
              For questions about these terms, please contact us through our support channels or refer to the Razorpay contact information provided above.
            </p>
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
