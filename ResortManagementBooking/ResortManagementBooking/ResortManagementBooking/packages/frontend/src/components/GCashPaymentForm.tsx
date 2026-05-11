import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Upload, Smartphone, CheckCircle } from 'lucide-react';

export interface GCashPaymentData {
  gcashNumber: string;
  referenceNumber: string;
  amountPaid: number;
  screenshot: File | null;
  paymentMethod: string;
  status: string;
}

interface GCashPaymentFormProps {
  amount: number;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
}

export const GCashPaymentForm: React.FC<GCashPaymentFormProps> = ({
  amount,
  onSuccess,
  onError
}) => {
  const [gcashNumber, setGcashNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState(amount.toString());
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically upload the screenshot and submit payment details
      // For now, we'll simulate a successful payment
      const paymentData = {
        gcashNumber,
        referenceNumber,
        amountPaid: parseFloat(amountPaid),
        screenshot,
        paymentMethod: 'gcash',
        status: 'pending'
      };

      onSuccess(paymentData);
    } catch (error) {
      onError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-green-600" />
          GCash Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-center">
              <p className="text-sm text-green-800 mb-2">Amount to Pay</p>
              <p className="text-2xl font-bold text-green-900">₱{amount.toFixed(2)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="gcashNumber">GCash Number</Label>
              <Input
                id="gcashNumber"
                type="tel"
                placeholder="09XX XXX XXXX"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                type="text"
                placeholder="Enter reference number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="screenshot">Payment Screenshot</Label>
              <div className="mt-1">
                <input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <label
                  htmlFor="screenshot"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {screenshot ? (
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Screenshot uploaded</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload payment screenshot</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit Payment'}
            </Button>
          </form>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Make sure the screenshot clearly shows the payment details</p>
            <p>• Payment will be verified within 24 hours</p>
            <p>• You will receive a confirmation once payment is approved</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};