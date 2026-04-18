import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface TermsOfServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Terms of Service
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Please read these terms and conditions carefully before using Glan Getaway's booking services.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h3>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Glan Getaway's booking platform, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Booking and Reservation Services</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">2.1 Down Payment System</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    Glan Getaway operates exclusively on a down payment basis. We do not process full payments through our online platform. 
                    The down payment secures your reservation, with the remaining balance to be paid upon arrival at the resort.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800">2.2 Additional Services and Add-ons</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    Any additional services including but not limited to extra guests, room amenities, facility usage, or special requests 
                    that are not included in the original booking must be arranged and paid for directly at the resort front desk. 
                    These services cannot be added or paid for through our online platform.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">2.3 Special Discounts</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    Special discounts for government employees, club members, corporate partners, or acquaintances of the resort owner 
                    are exclusively handled at the resort front desk. These discounts cannot be applied through online bookings and must 
                    be presented with valid identification upon arrival.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">2.4 Ecological Fee</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    An ecological fee is required for all bookings and must be paid directly at the resort front desk upon arrival. 
                    Guests are required to present an Official Receipt (OR) for the ecological fee payment at check-in. This fee is 
                    separate from the down payment and remaining balance and cannot be paid through our online platform.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Booking Confirmation and Changes</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">3.1 8-Hour Modification Window</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    After making a booking, you have an 8-hour window to make changes or modifications to your reservation. 
                    This includes changes to dates, room types, or number of guests (subject to availability).
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800">3.2 Automatic Confirmation</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    If no changes are made within the 8-hour window, your booking will be automatically confirmed. 
                    Once confirmed, changes may only be made by contacting the resort directly, and modification fees may apply.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4. User Responsibilities</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">4.1 Accurate Information</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    You agree to provide accurate, current, and complete information during the registration and booking process. 
                    You are responsible for maintaining the confidentiality of your account credentials.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800">4.2 Payment Responsibility</h4>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    You are responsible for ensuring that payment methods used for down payments are valid and authorized. 
                    Glan Getaway is not responsible for any fees charged by your financial institution.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Cancellation and Refunds</h3>
              <p className="text-gray-700 leading-relaxed">
                Cancellation policies vary by resort and booking type. Down payments may be non-refundable or subject to 
                cancellation fees. Please review the specific cancellation policy for your booking before confirming. 
                Cancellations must be made through the platform or by contacting the resort directly.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed">
                Glan Getaway acts as a booking platform and is not responsible for the quality of services provided by the resorts. 
                Our liability is limited to the processing of down payments and reservation confirmations. 
                We are not liable for any loss, damage, or injury occurring at the resort properties.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Privacy and Data Protection</h3>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, 
                and protect your personal information. By using our services, you consent to the collection and use 
                of your data as described in our Privacy Policy.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Modifications to Terms</h3>
              <p className="text-gray-700 leading-relaxed">
                Glan Getaway reserves the right to modify these terms at any time. Changes will be effective immediately 
                upon posting. Your continued use of our services constitutes acceptance of any modified terms.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-4"></div>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Contact Information</h3>
              <p className="text-gray-700 leading-relaxed">
                For questions about these Terms of Service or to contact us regarding booking issues, please reach out to:
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

export default TermsOfServiceModal;
