import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { axiosInstance } from "../../api-client";
import { useRoleBasedAccess } from "../../hooks/useRoleBasedAccess";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import SmartImage from "../../components/SmartImage";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  User,
  FileText,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";

interface UserInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

interface RolePromotionRequest {
  _id: string;
  userId: UserInfo;
  requestedRole: "partner" | "admin";
  businessPermitImage?: string;
  status: "pending" | "approved" | "declined";
  requestDate: string;
  processedBy?: string;
  processedDate?: string;
  declineReason?: string;
}

interface RolePromotionStats {
  total: number;
  pending: number;
  approved: number;
  declined: number;
}

const RolePromotionRequests: React.FC = () => {
  const { requireAdmin } = useRoleBasedAccess();
  const hasAdminAccess = requireAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "approved" | "declined">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewImageModal, setViewImageModal] = useState<{ open: boolean; imageUrl: string; userName: string }>({
    open: false,
    imageUrl: "",
    userName: "",
  });
  const [declineDialog, setDeclineDialog] = useState<{
    open: boolean;
    requestId: string;
    userName: string;
  }>({
    open: false,
    requestId: "",
    userName: "",
  });
  const [declineReason, setDeclineReason] = useState("");

  const { data: pendingData, isLoading: pendingLoading } = useQuery(
    ["pendingPromotionRequests", currentPage],
    () => apiClient.fetchPendingPromotionRequests(currentPage, 10),
    {
      enabled: activeTab === "pending",
    }
  );

  const { data: allData, isLoading: allLoading } = useQuery(
    ["allPromotionRequests", currentPage, activeTab],
    () => {
      const status = activeTab === "approved" ? "approved" : activeTab === "declined" ? "declined" : activeTab === "pending" ? "pending" : undefined;
      return apiClient.fetchAllPromotionRequests(currentPage, 10, status);
    },
    {
      enabled: activeTab !== "pending",
    }
  );

  const { data: stats, isLoading: statsLoading } = useQuery<RolePromotionStats>(
    "promotionRequestStats",
    apiClient.fetchPromotionRequestStats
  );

  const approveMutation = useMutation(apiClient.approvePromotionRequest, {
    onSuccess: (data) => {
      toast({
        title: "Request Approved",
        description: `Role promotion request for ${data.userId.firstName} ${data.userId.lastName} has been approved.`,
      });
      queryClient.invalidateQueries("pendingPromotionRequests");
      queryClient.invalidateQueries("allPromotionRequests");
      queryClient.invalidateQueries("promotionRequestStats");
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation(
    ({ requestId, reason }: { requestId: string; reason: string }) =>
      apiClient.declinePromotionRequest(requestId, reason),
    {
      onSuccess: (data) => {
        toast({
          title: "Request Declined",
          description: `Role promotion request for ${data.userId.firstName} ${data.userId.lastName} has been declined.`,
        });
        setDeclineDialog({ open: false, requestId: "", userName: "" });
        setDeclineReason("");
        queryClient.invalidateQueries("pendingPromotionRequests");
        queryClient.invalidateQueries("allPromotionRequests");
        queryClient.invalidateQueries("promotionRequestStats");
      },
      onError: (error: any) => {
        toast({
          title: "Decline Failed",
          description: error.message || "Failed to decline request. Please try again.",
          variant: "destructive",
        });
      },
    }
  );

  const handleApprove = (requestId: string) => {
    approveMutation.mutate(requestId);
  };

  const handleDeclineClick = (requestId: string, userName: string) => {
    setDeclineDialog({ open: true, requestId, userName });
  };

  const confirmDecline = () => {
    if (!declineReason.trim()) {
      toast({
        title: "Decline Reason Required",
        description: "Please provide a reason for declining this request.",
        variant: "destructive",
      });
      return;
    }

    declineMutation.mutate({
      requestId: declineDialog.requestId,
      reason: declineReason,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "partner":
        return <Badge variant="outline">Partner</Badge>;
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const currentData = activeTab === "pending" ? pendingData : allData;
  const isLoading = activeTab === "pending" ? pendingLoading : allLoading;
  const requests: RolePromotionRequest[] = currentData?.data || [];

  if (!hasAdminAccess) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access role promotion requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Role Promotion Requests</h1>
        <p className="text-gray-600">Review and manage user role promotion requests</p>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
              <div className="text-sm text-gray-600">Declined</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("pending");
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pending"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending ({stats?.pending || 0})
          </button>
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "all"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Requests
          </button>
          <button
            onClick={() => {
              setActiveTab("approved");
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "approved"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Approved ({stats?.approved || 0})
          </button>
          <button
            onClick={() => {
              setActiveTab("declined");
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "declined"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Declined ({stats?.declined || 0})
          </button>
        </nav>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No requests found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request._id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {request.userId.profileImage ? (
                      <SmartImage
                        src={request.userId.profileImage}
                        alt={`${request.userId.firstName} ${request.userId.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                        fallbackText={`${request.userId.firstName[0]}${request.userId.lastName[0]}`}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {request.userId.firstName} {request.userId.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="h-4 w-4" />
                        {request.userId.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(request.requestedRole)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <span className="font-medium">Requested:</span>{" "}
                        {request.requestDate
                          ? format(new Date(request.requestDate), "MMM dd, yyyy 'at' h:mm a")
                          : "Unknown"}
                      </span>
                    </div>
                    {request.processedDate && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <span className="font-medium">Processed:</span>{" "}
                          {format(new Date(request.processedDate), "MMM dd, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    {request.businessPermitImage ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Business Permit:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setViewImageModal({
                              open: true,
                              imageUrl: request.businessPermitImage!,
                              userName: `${request.userId.firstName} ${request.userId.lastName}`,
                            })
                          }
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          View Image
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No business permit provided</div>
                    )}
                  </div>
                </div>
                {request.declineReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-medium text-red-800">Decline Reason:</p>
                    <p className="text-sm text-red-600">{request.declineReason}</p>
                  </div>
                )}
                {request.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleApprove(request._id)}
                      disabled={approveMutation.isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleDeclineClick(
                          request._id,
                          `${request.userId.firstName} ${request.userId.lastName}`
                        )
                      }
                      disabled={declineMutation.isLoading}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {currentData?.pagination && currentData.pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {currentData.pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(currentData.pagination.pages, prev + 1))
            }
            disabled={currentPage === currentData.pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Decline Dialog */}
      {declineDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Decline Request</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to decline the role promotion request for{" "}
                <strong>{declineDialog.userName}</strong>?
              </p>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={4}
                placeholder="Please provide a reason for declining..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeclineDialog({ open: false, requestId: "", userName: "" });
                    setDeclineReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDecline}
                  disabled={declineMutation.isLoading}
                >
                  {declineMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Decline Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image View Modal */}
      {viewImageModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Business Permit - {viewImageModal.userName}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setViewImageModal({ open: false, imageUrl: "", userName: "" })}>
                Close
              </Button>
            </div>
            <img
              src={viewImageModal.imageUrl}
              alt="Business Permit"
              className="max-w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePromotionRequests;

