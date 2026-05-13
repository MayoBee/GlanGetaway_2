import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";
import { Users, Building, BarChart3, MessageSquare, Flag, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import * as apiClient from "../api-client";
import axiosInstance from "@shared/auth/api-client";

const AdminDashboard = () => {
  const { isAdmin, permissions } = useRoleBasedAccess();
  const [stats, setStats] = useState([
    {
      title: "Total Users",
      value: "0",
      icon: Users,
      color: "bg-blue-500",
      show: isAdmin,
    },
    {
      title: "Total Resorts",
      value: "0",
      icon: Building,
      color: "bg-green-500",
      show: isAdmin || permissions.canManageOwnResorts,
    },
    {
      title: "Total Bookings",
      value: "0",
      icon: BarChart3,
      color: "bg-purple-500",
      show: isAdmin || permissions.canManageOwnResorts,
    },
    {
      title: "Pending Feedback",
      value: "0",
      icon: MessageSquare,
      color: "bg-yellow-500",
      show: isAdmin,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if user is authenticated and has admin permissions
    if (!isAdmin && !permissions.canManageOwnResorts) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard overview using api-client (more accessible endpoint)
        const dashboardResponse = await axiosInstance.get('/api/dashboard/overview');
        const dashboardData = dashboardResponse.data.data;

        // Fetch feedback stats using api-client
        let pendingFeedback = 0;
        try {
          const feedbackData = await apiClient.fetchWebsiteFeedbackStats();
          pendingFeedback = feedbackData.data.byStatus?.new || 0;
        } catch (feedbackErr) {
          console.warn('Failed to fetch feedback stats:', feedbackErr);
          // Continue without feedback data
        }

        // Get total users and resorts from separate calls
        let totalUsers = 0;
        let totalResorts = 0;
        try {
          const users = await apiClient.fetchAllUsers();
          totalUsers = users.length;
        } catch (err) {
          console.warn('Failed to fetch users:', err);
        }

        try {
          const hotels = await apiClient.fetchHotels();
          totalResorts = hotels.length;
        } catch (err) {
          console.warn('Failed to fetch hotels:', err);
        }

        // Update stats with real data
        setStats([
          {
            title: "Total Users",
            value: totalUsers.toLocaleString(),
            icon: Users,
            color: "bg-blue-500",
            show: isAdmin,
          },
          {
            title: "Total Resorts",
            value: totalResorts.toLocaleString(),
            icon: Building,
            color: "bg-green-500",
            show: isAdmin || permissions.canManageOwnResorts,
          },
          {
            title: "Total Bookings",
            value: dashboardData?.stats?.totalBookings?.toLocaleString() || "0",
            icon: BarChart3,
            color: "bg-purple-500",
            show: isAdmin || permissions.canManageOwnResorts,
          },
          {
            title: "Pending Feedback",
            value: pendingFeedback.toLocaleString(),
            icon: MessageSquare,
            color: "bg-yellow-500",
            show: isAdmin,
          },
        ]);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin, permissions.canManageOwnResorts]);

  const quickActions = [
    {
      title: "User Management",
      description: "Manage user accounts and permissions",
      icon: Users,
      link: "/admin-dashboard/management",
      show: isAdmin,
    },
    {
      title: "Business Insights",
      description: "View analytics and business metrics",
      icon: BarChart3,
      link: "/admin-dashboard/business-insights",
      show: isAdmin,
    },
    {
      title: "Website Feedback",
      description: "Review and manage user feedback",
      icon: MessageSquare,
      link: "/admin-dashboard/feedback",
      show: isAdmin,
    },
    {
      title: "User Reports",
      description: "Handle user reports and issues",
      icon: Flag,
      link: "/admin-dashboard/reports",
      show: isAdmin,
    },
    {
      title: "Resort Approval",
      description: "Approve pending resort registrations",
      icon: Settings,
      link: "/admin-dashboard/resort-approval",
      show: permissions.canApproveResorts,
    },
    {
      title: "Resort Reports",
      description: "View resort performance reports",
      icon: BarChart3,
      link: "/admin-dashboard/resort-reports",
      show: isAdmin || permissions.canManageOwnResorts,
    },
  ];

  const visibleStats = stats.filter(item => item.show);
  const visibleActions = quickActions.filter(item => item.show);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to the administrative control panel</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to the administrative control panel</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the administrative control panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
