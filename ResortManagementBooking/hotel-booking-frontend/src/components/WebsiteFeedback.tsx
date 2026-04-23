import React, { useState } from "react";
import { MessageSquare, Send, X, Bug, Lightbulb, AlertTriangle, ThumbsUp } from "lucide-react";
import { axiosInstance } from '@glan-getaway/shared-auth';

interface WebsiteFeedbackProps {
  className?: string;
}

const WebsiteFeedback: React.FC<WebsiteFeedbackProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const feedbackTypes = [
    {
      value: "bug",
      label: "Bug Report",
      icon: Bug,
      description: "Something isn't working correctly",
      color: "text-red-600"
    },
    {
      value: "feature",
      label: "Feature Request",
      icon: Lightbulb,
      description: "I have an idea for improvement",
      color: "text-yellow-600"
    },
    {
      value: "issue",
      label: "General Issue",
      icon: AlertTriangle,
      description: "I'm having trouble with something",
      color: "text-orange-600"
    },
    {
      value: "feedback",
      label: "General Feedback",
      icon: MessageSquare,
      description: "Share your thoughts about the website",
      color: "text-blue-600"
    },
    {
      value: "compliment",
      label: "Compliment",
      icon: ThumbsUp,
      description: "Tell us what you like!",
      color: "text-green-600"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const response = await axiosInstance.post("/api/website-feedback", {
        type: feedbackType,
        message,
        email: email || undefined,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });

      if (response.data.success) {
        setSuccessMessage("Thank you for your feedback! We'll review it soon.");
        setFeedbackType("");
        setMessage("");
        setEmail("");
        
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMessage("");
        }, 3000);
      }
    } catch (error: any) {
      setSuccessMessage(
        error.response?.data?.message || "Failed to submit feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFeedbackType = feedbackTypes.find(type => type.value === feedbackType);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 z-40 ${className}`}
        title="Send feedback about the website"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Website Feedback</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Feedback Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of feedback is this?
            </label>
            <div className="space-y-2">
              {feedbackTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      feedbackType === type.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="feedbackType"
                      value={type.value}
                      checked={feedbackType === type.value}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="text-blue-600"
                    />
                    <IconComponent className={`w-5 h-5 ${type.color}`} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={
                selectedFeedbackType
                  ? `Tell us more about your ${selectedFeedbackType.label.toLowerCase()}...`
                  : "Please share your feedback..."
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/2000 characters
            </p>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only if you'd like us to follow up with you
            </p>
          </div>

          {/* Success/Error Message */}
          {successMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                successMessage.includes("Thank you")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {successMessage}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !feedbackType || !message}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WebsiteFeedback;
