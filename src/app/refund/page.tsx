import Link from 'next/link';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Cancellations and Refunds
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-orange-900 mb-4">
                💰 Razorpay Refund Policy
              </h2>
              <p className="text-orange-800 mb-4">
                Our payment processing partner Razorpay handles all refunds securely. Please review their refund policy below.
              </p>
              <a
                href="https://merchant.razorpay.com/policy/ON2AG5Chb3TwPN/refund"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                View Full Refund Policy →
              </a>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Ceesin Refund Policy
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              1. Refund Eligibility
            </h3>
            <p className="text-gray-700 mb-6">
              Refunds are available for the following scenarios:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li><strong>VIP Membership:</strong> Within 7 days of purchase if no benefits have been used</li>
              <li><strong>Photo Services:</strong> Before work begins on your project</li>
              <li><strong>Technical Issues:</strong> If our platform is unavailable for extended periods</li>
              <li><strong>Duplicate Payments:</strong> Accidental double charges will be refunded immediately</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              2. Refund Process
            </h3>
            <p className="text-gray-700 mb-6">
              To request a refund:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-6">
              <li>Contact our support team within the eligible timeframe</li>
              <li>Provide your order details and reason for refund</li>
              <li>Our team will review your request within 24-48 hours</li>
              <li>If approved, refund will be processed through Razorpay</li>
                              <li>You&apos;ll receive confirmation email with refund details</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              3. Refund Timeline
            </h3>
            <p className="text-gray-700 mb-6">
              Refund processing times vary by payment method:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
              <li><strong>UPI:</strong> 2-3 business days</li>
              <li><strong>Net Banking:</strong> 3-5 business days</li>
              <li><strong>Digital Wallets:</strong> 1-2 business days</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              4. Non-Refundable Items
            </h3>
            <p className="text-gray-700 mb-6">
              The following are generally non-refundable:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>VIP memberships after benefits have been utilized</li>
              <li>Completed photo editing work</li>
              <li>Consultation fees for completed sessions</li>
              <li>Platform usage fees for active periods</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              5. Partial Refunds
            </h3>
            <p className="text-gray-700 mb-6">
              In some cases, partial refunds may be available:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>If only partial services were delivered</li>
              <li>For unused portions of VIP memberships</li>
              <li>When technical issues affect partial functionality</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              6. Cancellation Policy
            </h3>
            <p className="text-gray-700 mb-6">
              You may cancel your VIP membership or services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li><strong>Before Activation:</strong> Full refund available</li>
              <li><strong>After Activation:</strong> Pro-rated refund based on usage</li>
              <li><strong>Photo Projects:</strong> Cancellation possible before work begins</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              7. Dispute Resolution
            </h3>
            <p className="text-gray-700 mb-6">
              If you disagree with a refund decision:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-6">
              <li>Contact our support team for review</li>
              <li>Provide additional documentation if needed</li>
              <li>Escalate to management if necessary</li>
              <li>Consider mediation for unresolved disputes</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              8. Contact Information
            </h3>
            <p className="text-gray-700 mb-6">
              For refund requests or questions about this policy:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Email: support@ceesin.com</li>
              <li>Support Portal: Available in your dashboard</li>
              <li>Phone: Available for VIP members</li>
              <li>Razorpay Support: For payment-specific issues</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                📞 Need Help?
              </h3>
              <p className="text-blue-800 mb-4">
                Our support team is here to help with any refund or cancellation questions. Contact us for personalized assistance.
              </p>
              <a
                href="https://merchant.razorpay.com/policy/ON2AG5Chb3TwPN/contact_us"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Razorpay Support →
              </a>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
