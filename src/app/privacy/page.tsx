import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                🔒 Razorpay Privacy Policy
              </h2>
              <p className="text-green-800 mb-4">
                Our payment processing partner Razorpay handles your payment data securely. Please review their privacy policy below.
              </p>
              <a
                href="https://merchant.razorpay.com/policy/ON2AG5Chb3TwPN/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                View Full Privacy Policy →
              </a>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Ceesin Privacy Policy
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              1. Information We Collect
            </h3>
            <p className="text-gray-700 mb-6">
              We collect information you provide directly to us, such as when you create an account, make a payment, or contact our support team. This may include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Name, email address, and phone number</li>
              <li>Account credentials and profile information</li>
              <li>Payment and transaction information</li>
              <li>Communication preferences and support history</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              2. How We Use Your Information
            </h3>
            <p className="text-gray-700 mb-6">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Provide and maintain our services</li>
              <li>Process payments and transactions</li>
              <li>Send important updates and notifications</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              3. Information Sharing
            </h3>
            <p className="text-gray-700 mb-6">
              We do not sell, trade, or rent your personal information to third parties. We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li><strong>Razorpay:</strong> For payment processing and compliance</li>
              <li><strong>Service Providers:</strong> Who assist in platform operations</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              4. Data Security
            </h3>
            <p className="text-gray-700 mb-6">
              We implement appropriate security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Encryption of sensitive data</li>
              <li>Secure payment processing through Razorpay</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication measures</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              5. Data Retention
            </h3>
            <p className="text-gray-700 mb-6">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              6. Your Rights
            </h3>
            <p className="text-gray-700 mb-6">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Access and review your personal information</li>
              <li>Update or correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Lodge a complaint with relevant authorities</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              7. Cookies and Tracking
            </h3>
            <p className="text-gray-700 mb-6">
              We use cookies and similar technologies to enhance your experience, analyze platform usage, and provide personalized content. You can control cookie preferences through your browser settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              8. Children&apos;s Privacy
            </h3>
            <p className="text-gray-700 mb-6">
              Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              9. International Transfers
            </h3>
            <p className="text-gray-700 mb-6">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during such transfers.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              10. Changes to This Policy
            </h3>
            <p className="text-gray-700 mb-6">
              We may update this privacy policy from time to time. We will notify you of any material changes and update the &quot;Last updated&quot; date accordingly.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              11. Contact Us
            </h3>
            <p className="text-gray-700 mb-6">
              If you have questions about this privacy policy or our data practices, please contact us through our support channels or refer to the Razorpay contact information provided above.
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
                  href="/terms"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Terms & Conditions
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
