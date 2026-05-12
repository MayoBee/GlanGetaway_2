import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cancelAllRequests, isRequestCanceled } from "../../lib/auth-api-client";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  fetchPendingResorts,
  fetchAllResortsForApproval,
  fetchApprovalStats,
  approveResort,
  rejectResort,
} from "../../api-client";
import { useAdminBypass } from "../../hooks/useAdminBypass";
import { useToast } from "../../hooks/use-toast";
import { HotelType } from "@shared/types";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import SmartImage from "../../components/SmartImage";
import { Loader2, Eye, CheckCircle, XCircle, Calendar, User, MapPin, Star, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const ResortApproval: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminBypass();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "approved">("pending");
  const [currentPage, setCurrentPage] = useState(1);

  // Cancel pending queries when component unmounts
  useEffect(() => {
    return () => {
      queryClient.cancelQueries(["pendingResorts"]);
      queryClient.cancelQueries(["allResorts"]);
      queryClient.cancelQueries("approvalStats");
      cancelAllRequests();
    };
  }, [queryClient]);
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; resortId: string; resortName: string }>({
    open: false,
    resortId: "",
    resortName: "",
  });
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingData, isLoading: pendingLoading } = useQuery(
    ["pendingResorts", currentPage],
    ({ signal }) => fetchPendingResorts(currentPage, 10, signal),
    {
      enabled: activeTab === "pending",
    }
  );

  const { data: allData, isLoading: allLoading } = useQuery(
    ["allResorts", currentPage, activeTab === "approved" ? "approved" : activeTab === "pending" ? "pending" : undefined],
    ({ signal }) => fetchAllResortsForApproval(
      currentPage, 
      10, 
      activeTab === "approved" ? "approved" : activeTab === "pending" ? "pending" : undefined,
      signal
    ),
    {
      enabled: activeTab !== "pending",
    }
  );

  const { data: stats } = useQuery("approvalStats", ({ signal }) => fetchApprovalStats(signal));

  const approveMutation = useMutation(approveResort, {
    onSuccess: (data) => {
      toast({
        title: "Resort Approved",
        description: `${data.resort.name} has been approved and is now visible to users.`,
      });
      queryClient.invalidateQueries(["pendingResorts"]);
      queryClient.invalidateQueries(["allResorts"]);
      queryClient.invalidateQueries("approvalStats");
    },
    onError: (error: any) => {
      if (!error.isCanceled) {
        toast({
          title: "Approval Failed",
          description: error.message || "Failed to approve resort. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const rejectMutation = useMutation(
    ({ resortId, reason }: { resortId: string; reason: string }) =>
      rejectResort(resortId, reason),
    {
      onSuccess: (data) => {
        toast({
          title: "Resort Rejected",
          description: `${data.resort.name} has been rejected. The admin will be notified.`,
        });
        setRejectionDialog({ open: false, resortId: "", resortName: "" });
        setRejectionReason("");
        queryClient.invalidateQueries(["pendingResorts"]);
        queryClient.invalidateQueries(["allResorts"]);
        queryClient.invalidateQueries("approvalStats");
      },
      onError: (error: any) => {
        if (!error.isCanceled) {
          toast({
            title: "Rejection Failed",
            description: error.message || "Failed to reject resort. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  );

  const handleApprove = (resortId: string) => {
    approveMutation.mutate(resortId);
  };

  const handleReject = (resortId: string, resortName: string) => {
    setRejectionDialog({ open: true, resortId, resortName });
  };

  const confirmRejection = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this resort.",
        variant: "destructive",
      });
      return;
    }

    rejectMutation.mutate({
      resortId: rejectionDialog.resortId,
      reason: rejectionReason,
    });
  };

  const currentData = activeTab === "pending" ? pendingData : allData;
  const isLoading = activeTab === "pending" ? pendingLoading : allLoading;
  const resorts = currentData?.data || [];

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access resort approval.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Resort Approval Management</h1>
            <p className="text-gray-600">Review and approve resort submissions from administrators</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Resorts</div>
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
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending Approval</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.approvalRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Approval Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pending"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending ({stats?.pending || 0})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "all"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Resorts
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "approved"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Approved ({stats?.approved || 0})
          </button>
        </nav>
      </div>

      {/* Resorts List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : resorts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No resorts found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {resorts.map((resort: HotelType & { userId?: { firstName: string; lastName: string; email: string } }) => (
            <Card key={resort._id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{resort.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {resort.city}, {resort.country}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm">{resort.starRating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={resort.isApproved ? "default" : "secondary"}>
                      {resort.isApproved ? "Approved" : "Pending"}
                    </Badge>
                    {!resort.isApproved && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(resort._id)}
                          disabled={approveMutation.isLoading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(resort._id, resort.name)}
                          disabled={rejectMutation.isLoading}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Resort Details</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{resort.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Owner: {resort.userId?.firstName} {resort.userId?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Submitted: {resort.createdAt ? format(new Date(resort.createdAt), "MMM dd, yyyy") : "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Price:</span>
                        <span className="text-sm">₱{resort.nightRate}/night</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Facilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {resort.facilities.slice(0, 6).map((facility, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {facility}
                        </Badge>
                      ))}
                      {resort.facilities.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{resort.facilities.length - 6} more
                        </Badge>
                      )}
                    </div>
                    {resort.imageUrls && resort.imageUrls.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Images</h4>
                        <div className="flex gap-2">
                          {resort.imageUrls.slice(0, 3).map((image, index) => (
                            <SmartImage
                              key={index}
                              src={image}
                              alt={`${resort.name} ${index + 1}`}
                              className="w-20 h-20 object-cover rounded"
                              fallbackText="Image"
                            />
                          ))}
                          {resort.imageUrls.length > 3 && (
                            <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
                              +{resort.imageUrls.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {resort.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                    <p className="text-sm text-red-600">{resort.rejectionReason}</p>
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
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
            onClick={() => setCurrentPage(prev => Math.min(currentData.pagination.pages, prev + 1))}
            disabled={currentPage === currentData.pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Rejection Dialog */}
      {rejectionDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Resort</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to reject "<strong>{rejectionDialog.resortName}</strong>"?
              </p>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={4}
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectionDialog({ open: false, resortId: "", resortName: "" });
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmRejection}
                  disabled={rejectMutation.isLoading}
                >
                  {rejectMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Reject Resort
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResortApproval;

