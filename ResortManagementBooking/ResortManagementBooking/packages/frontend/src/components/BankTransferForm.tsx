import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Building2, CreditCard, CheckCircle } from 'lucide-react';

interface BankTransferFormProps {
  amount: number;
  bookingDetails: any;
  onComplete: () => void;
}

export const BankTransferForm: React.FC<BankTransferFormProps> = ({
  amount,
  bookingDetails,
  onComplete
}) => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock bank details - in a real app, these would come from the backend
  const bankDetails = {
    bankName: 'BDO Unibank',
    accountName: 'Resort Management Corp',
    accountNumber: '1234-5678-9012-3456',
    branch: 'Makati City'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically submit the bank transfer details
      // For now, we'll simulate completion
      const transferData = {
        referenceNumber,
        transferDate,
        senderName,
        senderAccount,
        amount,
        paymentMethod: 'bank_transfer',
        status: 'pending'
      };

      console.log('Bank transfer submitted:', transferData);
      onComplete();
    } catch (error) {
      console.error('Bank transfer submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-purple-600" />
          Bank Transfer Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Bank Details */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3">Transfer Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">Bank:</span>
                <span className="font-medium">{bankDetails.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Account Name:</span>
                <span className="font-medium">{bankDetails.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Account Number:</span>
                <span className="font-medium font-mono">{bankDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Branch:</span>
                <span className="font-medium">{bankDetails.branch}</span>
              </div>
            </div>
          </div>

          {/* Amount to Pay */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-center">
              <p className="text-sm text-blue-800 mb-2">Amount to Transfer</p>
              <p className="text-2xl font-bold text-blue-900">₱{amount.toFixed(2)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="senderName">Sender Full Name</Label>
              <Input
                id="senderName"
                type="text"
                placeholder="Enter your full name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="senderAccount">Sender Account Number</Label>
              <Input
                id="senderAccount"
                type="text"
                placeholder="Enter your account number"
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                type="text"
                placeholder="Enter bank reference number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="transferDate">Transfer Date</Label>
              <Input
                id="transferDate"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit Transfer Details'}
            </Button>
          </form>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Transfer the exact amount to avoid processing delays</p>
            <p>• Keep the bank reference number safe</p>
            <p>• Payment will be verified within 1-2 business days</p>
            <p>• You will receive a confirmation once payment is approved</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};