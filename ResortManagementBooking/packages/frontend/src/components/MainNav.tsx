import { Button } from "../../../shared/ui/button";
import UsernameMenu from "./UsernameMenu";
import { Link } from "react-router-dom";
import useAppContext from "../../../shared/hooks/useAppContext";
import { useRoleBasedAccess } from "../../../shared/hooks/useRoleBasedAccess";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../shared/ui/dropdown-menu";
import {
  ChevronDown,
  MessageSquare,
  Flag,
  Settings,
  Users,
  FileText,
  Activity,
  BarChart3,
  Building,
  LayoutDashboard
} from "lucide-react";
import { getHotelsSearchUrl } from "../../../shared/lib/nav-utils";

const NAV_AUTH_WIDTH = "min-w-[120px]";

const navLinkClass =
  "flex items-center text-gray-800 hover:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200";

const MainNav = () => {
  const { isLoggedIn } = useAppContext();
  const { isAdmin, isSuperAdmin, permissions } = useRoleBasedAccess();

  return (
    <nav className="flex items-center gap-1 lg:gap-2">
      <Link to={getHotelsSearchUrl()} className={navLinkClass}>
        Resorts
      </Link>
      {isLoggedIn && (
        <Link to="/my-bookings" className={navLinkClass}>
          My Bookings
        </Link>
      )}
      
      {/* Admin Dropdown - Only visible to admins and resort owners */}
      {(isAdmin || permissions.canManageOwnResorts) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`${navLinkClass} flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-primary-600 rounded-lg`}
            >
              Admin
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white">
            {/* Admin Dashboard - Only for Admins and Super Admins */}
            {(isAdmin || isSuperAdmin) && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 cursor-pointer text-gray-900"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
            )}
            {/* Business Insights - Only for Super Admins */}
            {isSuperAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/business-insights"
                  className="flex items-center gap-2 cursor-pointer text-gray-900"
                >
                  <BarChart3 className="h-4 w-4" />
                  Business Insights
                </Link>
              </DropdownMenuItem>
            )}
            {/* User Management - Only for Admins */}
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/management"
                  className="flex items-center gap-2 cursor-pointer text-gray-900"
                >
                  <Users className="h-4 w-4" />
                  User Management
                </Link>
              </DropdownMenuItem>
            )}
            {/* Website Feedback - Only for Admins */}
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/feedback"
                  className="flex items-center gap-2 cursor-pointer text-gray-900"
                >
                  <MessageSquare className="h-4 w-4" />
                  Website Feedback
                </Link>
              </DropdownMenuItem>
            )}
            {/* User Reports - Only for Admins */}
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/reports"
                  className="flex items-center gap-2 cursor-pointer text-gray-900"
                >
                  <Flag className="h-4 w-4" />
                  User Reports
                </Link>
              </DropdownMenuItem>
            )}
            {/* Resort Reports - Available to Admins and Resort Owners */}
            {(isAdmin || permissions.canManageOwnResorts) && (
              <DropdownMenuItem asChild>
                <Link
                  to="/resort/reports"
                  className="flex items-center gap-2 cursor-pointer text-gray-900"
                >
                  <BarChart3 className="h-4 w-4" />
                  Resort Reports
                </Link>
              </DropdownMenuItem>
            )}
            {/* My Resorts - Only visible to Resort Owners */}
            {permissions.canManageOwnResorts && !isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  to="/my-hotels"
                  className="flex items-center gap-2 cursor-pointer text-gray-900"
                >
                  <Building className="h-4 w-4" />
                  My Resorts
                </Link>
              </DropdownMenuItem>
            )}
            {permissions.canApproveResorts && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/resort-approval"
                  className="flex items-center gap-2 cursor-pointer text-gray-900"
                >
                  <Settings className="h-4 w-4" />
                  Resort Approval
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`${navLinkClass} flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-primary-600 rounded-lg`}
          >
            API
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <DropdownMenuItem asChild>
            <Link
              to="/api-docs"
              className="flex items-center gap-2 cursor-pointer text-gray-900"
            >
              <FileText className="h-4 w-4" />
              API Docs
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/api-status"
              className="flex items-center gap-2 cursor-pointer text-gray-900"
            >
              <Activity className="h-4 w-4" />
              API Status
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className={`flex items-center justify-end ${NAV_AUTH_WIDTH}`}>
        {isLoggedIn ? (
          <UsernameMenu />
        ) : (
          <Link to="/sign-in">
            <Button
              variant="ghost"
              className="font-bold bg-white text-primary-600 hover:bg-primary-50 hover:text-primary-700 border-2 border-white/80"
            >
              Log In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default MainNav;
