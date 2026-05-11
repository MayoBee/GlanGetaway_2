import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { useQueryWithLoading } from "../../hooks/useLoadingHooks";
import { fetchWebsiteFeedback, fetchWebsiteFeedbackStats, updateWebsiteFeedback, deleteWebsiteFeedback } from "../../api-client";
import useAppContext from "../../hooks/useAppContext";
import { useRoleBasedAccess } from "../../hooks/useRoleBasedAccess";
import { Badge } from "../../components/ui/badge";
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  AlertTriangle, 
  ThumbsUp,
  CheckCircle, 
  Clock, 
  XCircle, 
  Search,
  User,
  Calendar,
  ShieldOff,
  Trash2
} from "lucide-react";

interface WebsiteFeedbackItem {
  _id: string;
  type: "bug" | "feature" | "issue" | "feedback" | "compliment";
  message: string;
  email?: string;
  pageUrl: string;
  userAgent: string;
  ipAddress?: string;
  status: "new" | "reviewed" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "urgent";
  adminNotes?: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  resolvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

const WebsiteFeedbackManagement: React.FC = () => {
  const { showToast } = useAppContext();
  const { isAdmin, isSuperAdmin } = useRoleBasedAccess();
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFeedback, setSelectedFeedback] = useState<WebsiteFeedbackItem | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: feedbackData, isLoading, error } = useQueryWithLoading(
    ["website-feedback", filter, typeFilter],
    () => fetchWebsiteFeedback(1, 50, filter !== "all" ? filter : undefined, typeFilter !== "all" ? typeFilter : undefined),
    {
      enabled: isAdmin || isSuperAdmin,
      loadingMessage: "Loading feedback...",
    }
  );

  const { data: statsData } = useQueryWithLoading(
    ["website-feedback-stats"],
    fetchWebsiteFeedbackStats,
    {
      enabled: isAdmin || isSuperAdmin,
      loadingMessage: "",
    }
  );

  const filteredFeedback = React.useMemo(() => {
    if (!feedbackData?.data) return [];
    
    const feedback = Array.isArray(feedbackData.data) ? feedbackData.data : [];
    
    if (!searchTerm) return feedback;
    
    return feedback.filter((item: WebsiteFeedbackItem) => {
      const message = item.message?.toLowerCase() || "";
      const email = item.email?.toLowerCase() || "";
      const pageUrl = item.pageUrl?.toLowerCase() || "";
      const searchLower = searchTerm.toLowerCase();
      
      return message.includes(searchLower) || email.includes(searchLower) || pageUrl.includes(searchLower);
    });
  }, [feedbackData, searchTerm]);

  const updateFeedbackMutation = useMutation(
    ({ feedbackId, status, adminNotes, priority }: { feedbackId: string; status: string; adminNotes?: string; priority?: string }) =>
      updateWebsiteFeedback(feedbackId, { status, adminNotes, priority }),
    {
      onSuccess: () => {
        showToast({
          title: "Feedback Updated",
          description: "The feedback has been successfully updated.",
          type: "SUCCESS",
        });
        queryClient.invalidateQueries("website-feedback");
        setSelectedFeedback(null);
        setAdminNotes("");
      },
      onError: (error: any) => {
        showToast({
          title: "Update Failed",
          description: error.response?.data?.message || "Failed to update feedback.",
          type: "ERROR",
        });
      }
    }
  );

  const deleteFeedbackMutation = useMutation(
    (feedbackId: string) => deleteWebsiteFeedback(feedbackId),
    {
      onSuccess: () => {
        showToast({
          title: "Feedback Deleted",
          description: "The feedback has been successfully deleted.",
          type: "SUCCESS",
        });
        queryClient.invalidateQueries("website-feedback");
        setSelectedFeedback(null);
      },
      onError: (error: any) => {
        showToast({
          title: "Delete Failed",
          description: error.response?.data?.message || "Failed to delete feedback.",
          type: "ERROR",
        });
      }
    }
  );

  // Check if user has access
  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShieldOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access the feedback management module.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "reviewed":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="w-4 h-4" />;
      case "feature":
        return <Lightbulb className="w-4 h-4" />;
      case "issue":
        return <AlertTriangle className="w-4 h-4" />;
      case "feedback":
        return <MessageSquare className="w-4 h-4" />;
      case "compliment":
        return <ThumbsUp className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bug":
        return "text-red-600";
      case "feature":
        return "text-yellow-600";
      case "issue":
        return "text-orange-600";
      case "feedback":
        return "text-blue-600";
      case "compliment":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="w-4 h-4" />;
      case "reviewed":
        return <AlertTriangle className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "dismissed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Feedback</h2>
          <p className="text-gray-600">{error.message || "Failed to load feedback. Please try again later."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Website Feedback Management</h1>
        <p className="text-gray-600">Review and manage user-submitted website feedback</p>
      </div>

      {/* Stats Cards */}
      {statsData?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-blue-600">{statsData.data.total}</div>
            <div className="text-sm text-gray-600">Total Feedback</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-blue-600">{statsData.data.byStatus?.new || 0}</div>
            <div className="text-sm text-gray-600">New</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-yellow-600">{statsData.data.byStatus?.reviewed || 0}</div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-green-600">{statsData.data.byStatus?.resolved || 0}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="issue">General Issue</option>
              <option value="feedback">General Feedback</option>
              <option value="compliment">Compliment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="grid gap-4">
        {filteredFeedback.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search terms" : "No feedback match the current filters"}
            </p>
          </div>
        ) : (
          filteredFeedback.map((feedback: WebsiteFeedbackItem) => (
            <div
              key={feedback._id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedFeedback(feedback)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={getStatusColor(feedback.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(feedback.status)}
                        {feedback.status}
                      </span>
                    </Badge>
                    <Badge className={getPriorityColor(feedback.priority)}>
                      {feedback.priority}
                    </Badge>
                    <div className={`flex items-center gap-1 ${getTypeColor(feedback.type)}`}>
                      {getTypeIcon(feedback.type)}
                      <span className="text-sm font-medium capitalize">{feedback.type}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {feedback.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {feedback.email && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {feedback.email}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFeedback(feedback);
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Feedback Details</h2>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Feedback Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Feedback Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {getTypeIcon(selectedFeedback.type)}
                      <span className="font-medium capitalize">{selectedFeedback.type}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedFeedback.status)}>
                        {selectedFeedback.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Priority:</span>
                    <div className="mt-1">
                      <Badge className={getPriorityColor(selectedFeedback.priority)}>
                        {selectedFeedback.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">
                      {new Date(selectedFeedback.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedFeedback.email && (
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{selectedFeedback.email}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Page URL:</span>
                    <p className="font-medium text-xs truncate">{selectedFeedback.pageUrl}</p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Message</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedFeedback.message}</p>
              </div>

              {/* Admin Actions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Admin Actions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      placeholder="Add notes about this feedback..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-3 flex-wrap">
                    {selectedFeedback.status !== "resolved" && (
                      <button
                        onClick={() => updateFeedbackMutation.mutate({
                          feedbackId: selectedFeedback._id,
                          status: "resolved",
                          adminNotes
                        })}
                        disabled={updateFeedbackMutation.isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                      >
                        Mark as Resolved
                      </button>
                    )}
                    
                    {selectedFeedback.status !== "dismissed" && (
                      <button
                        onClick={() => updateFeedbackMutation.mutate({
                          feedbackId: selectedFeedback._id,
                          status: "dismissed",
                          adminNotes
                        })}
                        disabled={updateFeedbackMutation.isLoading}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300"
                      >
                        Dismiss Feedback
                      </button>
                    )}
                    
                    {selectedFeedback.status === "new" && (
                      <button
                        onClick={() => updateFeedbackMutation.mutate({
                          feedbackId: selectedFeedback._id,
                          status: "reviewed",
                          adminNotes
                        })}
                        disabled={updateFeedbackMutation.isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                      >
                        Mark as Reviewed
                      </button>
                    )}

                    <button
                      onClick={() => deleteFeedbackMutation.mutate(selectedFeedback._id)}
                      disabled={deleteFeedbackMutation.isLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Resolution Info */}
              {(selectedFeedback.status === "resolved" || selectedFeedback.status === "dismissed") && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Resolution Information</h3>
                  <div className="text-sm text-gray-600">
                    {selectedFeedback.resolvedAt && (
                      <p>Resolved on: {new Date(selectedFeedback.resolvedAt).toLocaleDateString()}</p>
                    )}
                    {selectedFeedback.resolvedBy && (
                      <p>Resolved by: {selectedFeedback.resolvedBy?.firstName || 'Unknown'} {selectedFeedback.resolvedBy?.lastName || ''}</p>
                    )}
                    {selectedFeedback.adminNotes && (
                      <div className="mt-2">
                        <span className="font-medium">Admin Notes:</span>
                        <p className="text-gray-700">{selectedFeedback.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteFeedbackManagement;

