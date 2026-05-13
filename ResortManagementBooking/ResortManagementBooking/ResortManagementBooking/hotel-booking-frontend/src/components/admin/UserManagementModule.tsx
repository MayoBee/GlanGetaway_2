import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { SmartImage } from '../SmartImage';
import { LoadingSpinner } from '../LoadingSpinner';
import { fetchPromotionRequests, approvePromotionRequest, declinePromotionRequest, deleteUser, demoteUser } from '../../api-client';
import { useToast } from '../../hooks/useToast';

interface PromotionRequest {
  _id: string;
  userId: { firstName: string; lastName: string; email: string };
  businessPermitImageUrl: string;
  status: string;
  requestedAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

const UserManagementModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('promotion');
  const [promotionRequests, setPromotionRequests] = useState&lt;PromotionRequest[]&gt;([]);
  const [users, setUsers] = useState&lt;User[]&gt;([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchPromotionRequests('pending');
      setPromotionRequests(data);
    } catch (error) {
      showToast('Failed to fetch promotion requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    // Implement user fetching with search
  };

  useEffect(() => {
    if (activeTab === 'promotion') {
      fetchRequests();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const handleApprove = async (requestId: string) => {
    try {
      await approvePromotionRequest(requestId);
      showToast('Promotion request approved', 'success');
      fetchRequests();
    } catch (error) {
      showToast('Failed to approve request', 'error');
    }
  };

  const handleDecline = async (requestId: string, reason: string) => {
    try {
      await declinePromotionRequest(requestId, reason);
      showToast('Promotion request declined', 'success');
      fetchRequests();
    } catch (error) {
      showToast('Failed to decline request', 'error');
    }
  };

  const tabs = [
    { id: 'promotion', label: 'Promotion Requests' },
    { id: 'users', label: 'All Users' },
    { id: 'owners', label: 'Resort Owners' }
  ];

  return (
    &lt;div className="space-y-6"&gt;
      &lt;div className="flex space-x-1"&gt;
        {tabs.map(tab =&gt; (
          &lt;button
            key={tab.id}
            onClick={() =&gt; setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          &gt;
            {tab.label}
          &lt;/button&gt;
        ))}
      &lt;/div&gt;

      {activeTab === 'promotion' &amp;&amp; (
        &lt;div&gt;
          &lt;h3 className="text-lg font-semibold mb-4"&gt;Pending Promotion Requests&lt;/h3&gt;
          {loading ? (
            &lt;LoadingSpinner /&gt;
          ) : (
            &lt;Table&gt;
              &lt;TableHeader&gt;
                &lt;TableRow&gt;
                  &lt;TableHead&gt;User&lt;/TableHead&gt;
                  &lt;TableHead&gt;Business Permit&lt;/TableHead&gt;
                  &lt;TableHead&gt;Requested At&lt;/TableHead&gt;
                  &lt;TableHead&gt;Actions&lt;/TableHead&gt;
                &lt;/TableRow&gt;
              &lt;/TableHeader&gt;
              &lt;TableBody&gt;
                {promotionRequests.map(request =&gt; (
                  &lt;TableRow key={request._id}&gt;
                    &lt;TableCell&gt;
                      {request.userId.firstName} {request.userId.lastName}
                      &lt;br /&gt;
                      &lt;span className="text-sm text-gray-500"&gt;{request.userId.email}&lt;/span&gt;
                    &lt;/TableCell&gt;
                    &lt;TableCell&gt;
                      &lt;Dialog&gt;
                        &lt;DialogTrigger asChild&gt;
                          &lt;Button variant="outline" size="sm"&gt;View Permit&lt;/Button&gt;
                        &lt;/DialogTrigger&gt;
                        &lt;DialogContent&gt;
                          &lt;DialogHeader&gt;
                            &lt;DialogTitle&gt;Business Permit&lt;/DialogTitle&gt;
                          &lt;/DialogHeader&gt;
                          &lt;SmartImage
                            src={request.businessPermitImageUrl}
                            alt="Business Permit"
                            className="w-full h-auto"
                          /&gt;
                        &lt;/DialogContent&gt;
                      &lt;/Dialog&gt;
                    &lt;/TableCell&gt;
                    &lt;TableCell&gt;{new Date(request.requestedAt).toLocaleDateString()}&lt;/TableCell&gt;
                    &lt;TableCell&gt;
                      &lt;div className="flex space-x-2"&gt;
                        &lt;Button
                          onClick={() =&gt; handleApprove(request._id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        &gt;
                          Approve
                        &lt;/Button&gt;
                        &lt;Dialog&gt;
                          &lt;DialogTrigger asChild&gt;
                            &lt;Button variant="destructive" size="sm"&gt;Decline&lt;/Button&gt;
                          &lt;/DialogTrigger&gt;
                          &lt;DialogContent&gt;
                            &lt;DialogHeader&gt;
                              &lt;DialogTitle&gt;Decline Promotion Request&lt;/DialogTitle&gt;
                            &lt;/DialogHeader&gt;
                            &lt;form onSubmit={(e) =&gt; {
                              e.preventDefault();
                              const formData = new FormData(e.target as HTMLFormElement);
                              const reason = formData.get('reason') as string;
                              handleDecline(request._id, reason);
                            }}&gt;
                              &lt;Input name="reason" placeholder="Reason for decline" required /&gt;
                              &lt;div className="flex justify-end mt-4"&gt;
                                &lt;Button type="submit"&gt;Decline&lt;/Button&gt;
                              &lt;/div&gt;
                            &lt;/form&gt;
                          &lt;/DialogContent&gt;
                        &lt;/Dialog&gt;
                      &lt;/div&gt;
                    &lt;/TableCell&gt;
                  &lt;/TableRow&gt;
                ))}
              &lt;/TableBody&gt;
            &lt;/Table&gt;
          )}
        &lt;/div&gt;
      )}

      {activeTab === 'users' &amp;&amp; (
        &lt;div&gt;
          &lt;div className="flex justify-between items-center mb-4"&gt;
            &lt;h3 className="text-lg font-semibold"&gt;All Users&lt;/h3&gt;
            &lt;Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) =&gt; setSearchTerm(e.target.value)}
              className="w-64"
            /&gt;
          &lt;/div&gt;
          {/* All users table implementation */}
        &lt;/div&gt;
      )}

      {activeTab === 'owners' &amp;&amp; (
        &lt;div&gt;
          &lt;h3 className="text-lg font-semibold mb-4"&gt;Resort Owners&lt;/h3&gt;
          {/* Resort owners table implementation */}
        &lt;/div&gt;
      )}
    &lt;/div&gt;
  );
};

export default UserManagementModule;