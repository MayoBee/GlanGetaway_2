import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Privacy Policy
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Please read our privacy policy carefully to understand how we collect, use, and protect your information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h3>
              <p className="text-gray-700 leading-relaxed">
                Glan Getaway ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you visit our website 
                glangetaway.com and use our booking services.
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                By using our services, you consent to the data practices described in this policy.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Information We Collect</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">2.1 Personal Information</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    When you create an account or make a booking, we collect:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    <li>Full name (first and last name)</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Birthdate (for age verification)</li>
                    <li>Home address (optional)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800">2.2 Booking Information</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    When you make a reservation, we collect:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    <li>Travel dates (check-in and check-out)</li>
                    <li>Number of guests (adults and children)</li>
                    <li>Room type preferences</li>
                    <li>Special requests or requirements</li>
                    <li>Payment information for down payments</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">2.3 Technical Information</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    We automatically collect certain technical information:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Pages visited and time spent on our site</li>
                    <li>Referral source</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3. How We Use Your Information</h3>
              <p className="text-gray-700 leading-relaxed">
                We use your collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-gray-700">
                <li><strong>Service Provision:</strong> To process bookings, manage reservations, and communicate with you about your stay</li>
                <li><strong>Account Management:</strong> To create and maintain your account, provide customer support, and authenticate your identity</li>
                <li><strong>Payment Processing:</strong> To process down payments and handle payment-related communications</li>
                <li><strong>Communication:</strong> To send booking confirmations, reminders, and important updates about your reservation</li>
                <li><strong>Personalization:</strong> To improve your experience by remembering your preferences and booking history</li>
                <li><strong>Marketing:</strong> To send promotional offers and newsletters (with your consent)</li>
                <li><strong>Analytics:</strong> To analyze usage patterns and improve our services</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Information Sharing and Disclosure</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">4.1 Resort Partners</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    We share your booking information with our partner resorts to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    <li>Confirm your reservation</li>
                    <li>Arrange accommodation and services</li>
                    <li>Process check-in and check-out</li>
                    <li>Provide guest services during your stay</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800">4.2 Payment Processors</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    We share payment information with secure payment processors to handle down payments and related financial transactions.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">4.3 Legal Requirements</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    We may disclose your information when required by law, court order, or to protect our rights, property, or safety.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Data Security</h3>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-gray-700">
                <li><strong>Encryption:</strong> SSL/TLS encryption for data transmission</li>
                <li><strong>Secure Storage:</strong> Encrypted databases and secure servers</li>
                <li><strong>Access Controls:</strong> Limited access to personal information</li>
                <li><strong>Regular Monitoring:</strong> Security audits and vulnerability assessments</li>
                <li><strong>Payment Security:</strong> PCI DSS compliance for payment processing</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-2">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Cookies and Tracking Technologies</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">6.1 Essential Cookies</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    Required for basic website functionality, including user authentication and booking management.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800">6.2 Analytics Cookies</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    Help us understand how visitors interact with our website to improve user experience.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">6.3 Marketing Cookies</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    Used to deliver personalized advertisements and promotional content (with your consent).
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Your Rights and Choices</h3>
              <p className="text-gray-700 leading-relaxed">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-gray-700">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Cookie Control:</strong> Manage cookie preferences through your browser</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Data Retention</h3>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information only as long as necessary for the purposes outlined in this policy:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-gray-700">
                <li><strong>Account Information:</strong> Retained while your account is active</li>
                <li><strong>Booking Data:</strong> Retained for 7 years to comply with tax and legal requirements</li>
                <li><strong>Payment Records:</strong> Retained for 7 years for financial reporting</li>
                <li><strong>Analytics Data:</strong> Retained in aggregated, anonymized form</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Children's Privacy</h3>
              <p className="text-gray-700 leading-relaxed">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect 
                personal information from children under 18. If we become aware that we have collected such information, 
                we will take steps to delete it immediately.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">10. International Data Transfers</h3>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to This Policy</h3>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes 
                by posting the new policy on our website and updating the "Last Updated" date. Continued use of our 
                services constitutes acceptance of any changes.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">12. Contact Information</h3>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy or want to exercise your rights, please contact us:
              </p>
              <div className="mt-3 space-y-1 text-gray-700">
                <p><strong>Email:</strong> glangetaway00@gmail.com</p>
                <p><strong>Phone:</strong> 09279273719</p>
                <p><strong>Address:</strong> Poblacion, Glan, Sarangani Province, Philippines</p>
              </div>
            </section>

            <section className="pt-4">
              <p className="text-gray-600 text-xs">
                <strong>Last Updated:</strong> March 2026
              </p>
            </section>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            I Understand
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyModal;
