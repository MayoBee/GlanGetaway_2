import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./layouts/Layout";
import AuthLayout from "./layouts/AuthLayout";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "./components/ui/toaster";
import { BookingSelectionProvider } from "./contexts/BookingSelectionContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import AdminLogin from "./pages/AdminLogin";
import AdminRouteGuard from "./components/AdminRouteGuard";
import AddHotel from "./pages/AddHotel";
import MyHotels from "./pages/MyHotels";
import EditHotel from "./pages/EditHotel";
import Search from "./pages/Search";
import Detail from "./pages/Detail";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Home from "./pages/Home";
import ApiDocs from "./pages/ApiDocs";
import ApiStatus from "./pages/ApiStatus";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import AuthCallback from "./pages/AuthCallback";
import AutoLogin from "./pages/AutoLogin";
import ApplyForResortOwner from "./pages/ApplyForResortOwner";
import { ProtectedRoute } from "@glan-getaway/shared-auth";
import WebsiteFeedback from "./components/WebsiteFeedback";
import ErrorBoundary from "./components/ErrorBoundary";
import ResortDashboard from "./pages/ResortDashboard";
import ResortReports from "./pages/ResortReports";
import AdminDashboard from './pages/AdminDashboard';
import AdminManagement from './pages/AdminManagement';
import ResortApproval from './pages/Admin/ResortApproval';
import AdminReports from './pages/AdminReports';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from "./pages/AdminSettings";

const App = () => {
  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <BookingSelectionProvider>
          <Router>
          <ScrollToTop />
          <Routes>
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
            <Route
              path="/search"
              element={
                <Layout>
                  <Search />
                </Layout>
              }
            />
            <Route
              path="/detail/:id"
              element={
                <Layout>
                  <Detail />
                </Layout>
              }
            />
            <Route
              path="/api-docs"
              element={
                <Layout>
                  <ApiDocs />
                </Layout>
              }
            />
            <Route
              path="/api-status"
              element={
                <Layout>
                  <ApiStatus />
                </Layout>
              }
            />
            <Route
              path="/business-insights"
              element={
                <Layout>
                  <AnalyticsDashboard />
                </Layout>
              }
            />
            <Route
              path="/register"
              element={
                <AuthLayout>
                  <Register />
                </AuthLayout>
              }
            />
            <Route
              path="/sign-in"
              element={
                <AuthLayout>
                  <SignIn />
                </AuthLayout>
              }
            />
            <Route
              path="/auth/callback"
              element={
                <Layout>
                  <AuthCallback />
                </Layout>
              }
            />
            <Route
              path="/auto-login"
              element={
                <Layout>
                  <AutoLogin />
                </Layout>
              }
            />

            {/* Protected Routes - Require Login */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyBookings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-hotels"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyHotels />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-hotel"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AddHotel />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-hotel/:hotelId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditHotel />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/website-feedback"
              element={
                <Layout>
                  <WebsiteFeedback />
                </Layout>
              }
            />
            <Route
              path="/apply-resort-owner"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ApplyForResortOwner />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Resort Management Routes */}
            <Route
              path="/resort/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ResortDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/resort/reports"
              element={
                <ProtectedRoute requiredPermission="canManageOwnResorts">
                  <Layout>
                    <ResortReports />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Booking Routes - Require Login */}
            <Route
              path="/hotel/:hotelId/booking"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Booking />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin-login"
              element={
                <AuthLayout>
                  <AdminLogin />
                </AuthLayout>
              }
            />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRouteGuard>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/admin-management"
              element={
                <AdminRouteGuard>
                  <Layout>
                    <AdminManagement />
                  </Layout>
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/resort-approval"
              element={
                <AdminRouteGuard>
                  <Layout>
                    <ResortApproval />
                  </Layout>
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/admin-reports"
              element={
                <AdminRouteGuard>
                  <Layout>
                    <AdminReports />
                  </Layout>
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/admin-analytics"
              element={
                <AdminRouteGuard>
                  <Layout>
                    <AdminAnalytics />
                  </Layout>
                </AdminRouteGuard>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRouteGuard>
                  <Layout>
                    <AdminSettings />
                  </Layout>
                </AdminRouteGuard>
              }
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster />
        </Router>
      </BookingSelectionProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
};

export default App;
