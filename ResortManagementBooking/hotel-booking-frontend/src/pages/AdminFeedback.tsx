import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { axiosInstance } from '@glan-getaway/shared-auth';
import { Badge } from "../components/ui/badge";
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  AlertTriangle, 
  ThumbsUp,
  Search,
  User,
  Globe,
  Download,
  Trash2
} from "lucide-react";

interface WebsiteFeedback {
  id: number;
  type: string;
  message: string;
  email?: string;
  pageUrl: string;
  userAgent: string;
  timestamp: string;
  ipAddress?: string;
}

const AdminFeedback: React.FC = () => {
  console.log("AdminFeedback component rendering");
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: feedbackData, isLoading } = useQuery(
    ["website-feedback"],
    () => axiosInstance.get("/api/website-feedback"),
    {
      select: (response) => response.data,
    }
  );

  const { data: statsData } = useQuery(
    ["feedback-stats"],
    () => axiosInstance.get("/api/website-feedback/stats"),
    {
      select: (response) => response.data,
    }
  );

  const deleteFeedbackMutation = useMutation(
    (feedbackId: number) => axiosInstance.delete(`/api/website-feedback/${feedbackId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("website-feedback");
      },
    }
  );

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case "bug":
        return Bug;
      case "feature":
        return Lightbulb;
      case "issue":
        return AlertTriangle;
      case "feedback":
        return MessageSquare;
      case "compliment":
        return ThumbsUp;
      default:
        return MessageSquare;
    }
  };

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case "bug":
        return "text-red-600 bg-red-50";
      case "feature":
        return "text-yellow-600 bg-yellow-50";
      case "issue":
        return "text-orange-600 bg-orange-50";
      case "feedback":
        return "text-blue-600 bg-blue-50";
      case "compliment":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const filteredFeedback = feedbackData?.data?.filter((feedback: WebsiteFeedback) => {
    const matchesFilter = filter === "all" || feedback.type === filter;
    const matchesSearch = searchTerm === "" || 
      feedback.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (feedback.email && feedback.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  }) || [];

  const exportFeedback = () => {
    const dataStr = JSON.stringify(filteredFeedback, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `website-feedback-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Website Feedback</h1>
        <p className="text-gray-600">View and manage user feedback about the website</p>
      </div>

      {/* Statistics Cards */}
      {statsData?.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.data.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          {Object.entries(statsData.data.byType).map(([type, count]) => {
            const IconComponent = getFeedbackIcon(type);
            return (
              <div key={type} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">{type}s</p>
                    <p className="text-2xl font-bold text-gray-900">{Number(count)}</p>
                  </div>
                  <IconComponent className={`w-8 h-8 ${getFeedbackColor(type).split(' ')[0]}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters and Search */}
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
              <option value="all">All Types</option>
              <option value="bug">Bug Reports</option>
              <option value="feature">Feature Requests</option>
              <option value="issue">Issues</option>
              <option value="feedback">General Feedback</option>
              <option value="compliment">Compliments</option>
            </select>
            <button
              onClick={exportFeedback}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
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
              {searchTerm ? "Try adjusting your search terms" : "No feedback matches the current filter"}
            </p>
          </div>
        ) : (
          filteredFeedback.map((feedback: WebsiteFeedback) => {
            const IconComponent = getFeedbackIcon(feedback.type);
            const colorClass = getFeedbackColor(feedback.type);
            
            return (
              <div
                key={feedback.id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass.split(' ')[1]}`}>
                      <IconComponent className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />
                    </div>
                    <div>
                      <Badge className={`${colorClass} capitalize`}>
                        {feedback.type}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(feedback.timestamp).toLocaleDateString()} at {new Date(feedback.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteFeedbackMutation.mutate(feedback.id)}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete feedback"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback.message}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {feedback.email && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {feedback.email}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <a 
                      href={feedback.pageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-xs"
                    >
                      {feedback.pageUrl}
                    </a>
                  </div>
                  {feedback.ipAddress && (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{String(feedback.ipAddress)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
