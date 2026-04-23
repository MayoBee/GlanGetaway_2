import React, { useState, useEffect } from 'react';
import ImageUpload from '../components/ImageUpload';
import { axiosInstance } from '@glan-getaway/shared-auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Clock, FileCheck, Building2 } from 'lucide-react';

const ApplyForResortOwner: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPendingRequest = async () => {
      try {
        const response = await axiosInstance.get('/api/role-promotion-requests');
        // Response format: { data: [...], pagination: {...} }
        const requests = response.data?.data || response.data || [];
        const pending = requests.find((req: any) => req.status === 'pending');
        setPendingRequest(pending);
      } catch (err) {
        console.error('Error fetching requests:', err);
        // Don't show error to user - just means they have no requests yet
      }
    };
    fetchPendingRequest();
  }, []);

  const handleSubmit = async () => {
    if (!imageFile || !description.trim()) {
      setError('Please provide both business permit and description.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const formData = new FormData();
    formData.append('businessPermit', imageFile);
    formData.append('description', description);
    try {
      await axiosInstance.post('/api/role-promotion-requests', formData);
      alert('Request submitted successfully!');
      setImageFile(null);
      setDescription('');
      // Refresh pending
      const response = await axiosInstance.get('/api/role-promotion-requests');
      const requests = response.data?.data || response.data || [];
      const pending = requests.find((req: any) => req.status === 'pending');
      setPendingRequest(pending);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingRequest) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Apply for Resort Owner
            </CardTitle>
            <CardDescription>Your application status</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-amber-50 border-amber-200">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="ml-2 text-amber-800">
                Your request is currently pending approval. Our team will review your application shortly.
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Submitted:</span> {new Date(pendingRequest.createdAt).toLocaleDateString()}
              </div>
              {pendingRequest.description && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Application note:</span> {pendingRequest.description}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            Apply for Resort Owner
          </CardTitle>
          <CardDescription>Submit your business details to become a verified resort owner</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <ImageUpload
              label="Business Permit"
              onChange={() => {}}
              onFileChange={(file) => setImageFile(file)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Tell us about your resort business, experience, and why you'd like to join our platform..."
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
            >
              <FileCheck className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyForResortOwner;
