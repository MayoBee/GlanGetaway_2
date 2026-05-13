import { useQuery } from "react-query";
import { axiosInstance } from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useAdminBypass } from "../hooks/useAdminBypass";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "../api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Building2,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  LayoutDashboard,
  Users as UsersIcon,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

interface DashboardOverview {
  success: boolean;
  data: {
    stats: {
      monthlyBookings: number;
      monthlyRevenue: number;
      yearlyRevenue: number;
      totalBookings: number;
      occupancyRate: number;
      totalRooms: number;
      occupiedRooms: number;
      availableRooms: number;
      pendingMaintenance: number;
      totalResorts: number;
    };
    upcomingArrivals: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      checkIn: string;
      roomNumber: string;
    }>;
    recentNotifications: Array<{
      _id: string;
      type: string;
      title: string;
      message: string;
      priority: string;
      isRead: boolean;
      createdAt: string;
    }>;
  };
}

interface ApprovalStats {
  success: boolean;
  data: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}

interface RevenueData {
  success: boolean;
  data: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const { showToast } = useAppContext();
  const { isAdmin } = useAdminBypass();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
        type: "SUCCESS",
      });
      window.location.href = "/admin-login";
    } catch (error) {
      showToast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        type: "ERROR",
      });
    }
  };

  const navigationItems = [
    {
      name: "Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/admin/dashboard",
    },
    {
      name: "User Management",
      href: "/admin/admin-management",
      icon: UsersIcon,
      current: location.pathname === "/admin/admin-management",
    },
    {
      name: "Resort Approval",
      href: "/admin/resort-approval",
      icon: Building2,
      current: location.pathname === "/admin/resort-approval",
    },
    {
      name: "Reports",
      href: "/admin/admin-reports",
      icon: TrendingUp,
      current: location.pathname === "/admin/admin-reports",
    },
    {
      name: "Analytics",
      href: "/admin/admin-analytics",
      icon: Calendar,
      current: location.pathname === "/admin/admin-analytics",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: location.pathname === "/admin/settings",
    },
  ];

  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
  } = useQuery<DashboardOverview>(
    ["admin-dashboard-overview"],
    async () => {
      const response = await axiosInstance.get("/api/dashboard/overview");
      return response.data;
    },
    {
      retry: 2,
      refetchInterval: 30000,
      onError: (error) => {
        console.error("Dashboard overview fetch error:", error);
      },
    }
  );

  const {
    data: approvalStatsData,
    isLoading: approvalLoading,
    error: approvalError,
  } = useQuery<ApprovalStats>(
    ["admin-approval-stats"],
    async () => {
      const response = await axiosInstance.get("/api/resort-approval/stats");
      return response.data;
    },
    {
      retry: 1,
    }
  );

  const {
    data: revenueData,
    isLoading: revenueLoading,
    error: revenueError,
  } = useQuery<RevenueData>(
    ["admin-revenue-trend"],
    async () => {
      const response = await axiosInstance.get("/api/dashboard/revenue");
      return response.data;
    },
    {
      retry: 1,
    }
  );


  const isLoading = overviewLoading || approvalLoading || revenueLoading;
  const hasError = overviewError || approvalError || revenueError;

  const stats = overviewData?.data?.stats;
  const pendingApprovals = approvalStatsData?.data?.pending ?? 0;
  const notifications = overviewData?.data?.recentNotifications ?? [];
  const upcomingArrivals = overviewData?.data?.upcomingArrivals ?? [];
  const revenueChartData = revenueData?.data ?? [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600">
            Failed to load dashboard data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Admin Portal</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    item.current
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                Admin Dashboard
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {isAdmin && <span>Super Admin</span>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="mb-8">
              <p className="text-gray-600">
                Overview of resort management system statistics
              </p>
            </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Total Resorts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalResorts ?? 0}</div>
            <p className="text-xs text-gray-500">Registered resorts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-gray-500">Resorts awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings ?? 0}</div>
            <p className="text-xs text-gray-500">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.monthlyRevenue ?? 0)}
            </div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.occupancyRate ?? 0}%
            </div>
            <p className="text-xs text-gray-500">
              {stats?.occupiedRooms ?? 0} of {stats?.totalRooms ?? 0} rooms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Recent Arrivals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingArrivals.length}</div>
            <p className="text-xs text-gray-500">Check-ins in next 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : revenueChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No revenue data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      tickFormatter={(value) => `₱${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "Revenue",
                      ]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No recent notifications
                </p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-3 rounded-lg border ${
                        notification.isRead
                          ? "bg-gray-50"
                          : "bg-white border-l-4 border-l-blue-500"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${getPriorityColor(
                              notification.priority
                            )}`}
                          ></span>
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Arrivals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Arrivals</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingArrivals.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No recent arrivals
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Guest Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Room Number
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Check-in Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingArrivals.map((arrival) => (
                    <tr key={arrival._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{arrival.firstName} {arrival.lastName}</td>
                      <td className="py-3 px-4">{arrival.roomNumber || "N/A"}</td>
                      <td className="py-3 px-4">
                        {formatDate(arrival.checkIn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

