import { Link } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import {
  Hotel,
  Calendar,
  Building2,
  Building,
  FileText,
  Activity,
  Users,
  MessageSquare,
  Flag,
  Settings,
  LogIn,
  BarChart3,
} from "lucide-react";
import UsernameMenu from "./UsernameMenu";
import useAppContext from "../../../shared/hooks/useAppContext";
import { useRoleBasedAccess } from "../../../shared/hooks/useRoleBasedAccess";
import { getHotelsSearchUrl } from "../../../shared/lib/nav-utils";

const linkClass =
  "flex items-center gap-2 w-full py-3 font-bold text-gray-900 hover:text-primary-600 transition-colors";

const MobileNavLinks = () => {
  const { isLoggedIn } = useAppContext();
  const { isAdmin, permissions } = useRoleBasedAccess();

  return (
    <div className="flex flex-col gap-1">
      <Link to={getHotelsSearchUrl()} className={linkClass}>
        <Hotel className="h-4 w-4" />
        Resorts
      </Link>
      
      {isLoggedIn && (
        <Link to="/my-bookings" className={linkClass}>
          <Calendar className="h-4 w-4" />
          My Bookings
        </Link>
      )}
      
      {/* Admin Links - Only visible to admins and resort owners */}
      {(isAdmin || permissions.canManageOwnResorts) && (
        <div className="py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Admin
          </p>
          {isAdmin && (
            <Link to="/admin/management" className={`${linkClass} pl-4`}>
              <Users className="h-4 w-4" />
              User Management
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/feedback" className={`${linkClass} pl-4`}>
              <MessageSquare className="h-4 w-4" />
              Website Feedback
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/reports" className={`${linkClass} pl-4`}>
              <Flag className="h-4 w-4" />
              User Reports
            </Link>
          )}
          {(isAdmin || permissions.canManageOwnResorts) && (
            <Link to="/resort/reports" className={`${linkClass} pl-4`}>
              <BarChart3 className="h-4 w-4" />
              Resort Reports
            </Link>
          )}
          {permissions.canManageOwnResorts && !isAdmin && (
            <Link to="/my-hotels" className={`${linkClass} pl-4`}>
              <Building className="h-4 w-4" />
              My Resorts
            </Link>
          )}
          {/* Super Admin Only */}
          {permissions.canApproveResorts && (
            <Link to="/admin/resort-approval" className={`${linkClass} pl-4`}>
              <Settings className="h-4 w-4" />
              Resort Approval
            </Link>
          )}
        </div>
      )}
      <div className="py-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
          API
        </p>
        <Link to="/api-docs" className={`${linkClass} pl-4`}>
          <FileText className="h-4 w-4" />
          API Docs
        </Link>
        <Link to="/api-status" className={`${linkClass} pl-4`}>
          <Activity className="h-4 w-4" />
          API Status
        </Link>
      </div>

      <div className="h-px bg-border my-4" />

      <div className="min-h-[52px] flex items-center justify-center">
        {isLoggedIn ? (
          <UsernameMenu />
        ) : (
          <Link to="/sign-in" className="w-full">
            <Button className="w-full font-bold bg-primary-600 hover:bg-primary-700">
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default MobileNavLinks;
