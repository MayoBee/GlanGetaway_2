import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Hotel,
  Calendar,
  FileText,
  Activity,
  LogIn,
  BarChart3,
  Building,
} from "lucide-react";
import UsernameMenu from "./UsernameMenu";
import useAppContext from "../hooks/useAppContext";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";
import { getHotelsSearchUrl } from "../lib/nav-utils";

const linkClass =
  "flex items-center gap-3 w-full py-4 px-4 font-bold text-gray-900 hover:text-primary-600 hover:bg-primary-50 transition-colors min-h-[44px] active:scale-[0.98]";

const subLinkClass =
  "flex items-center gap-3 w-full py-3 px-6 font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-colors min-h-[44px] active:scale-[0.98]";

const MobileNavLinks = () => {
  const { isLoggedIn } = useAppContext();
  const { permissions } = useRoleBasedAccess();

  return (
    <div className="flex flex-col">
      <Link to={getHotelsSearchUrl()} className={linkClass}>
        <Hotel className="h-5 w-5" />
        <span className="text-base">Resorts</span>
      </Link>
      
      {isLoggedIn && (
        <Link to="/my-bookings" className={linkClass}>
          <Calendar className="h-5 w-5" />
          <span className="text-base">My Bookings</span>
        </Link>
      )}
      
      {permissions.canManageOwnResorts && (
        <div className="space-y-1">
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Resort Owner
            </p>
          </div>
          <Link to="/resort/reports" className={subLinkClass}>
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm">Resort Reports</span>
          </Link>
          <Link to="/my-hotels" className={subLinkClass}>
            <Building className="h-4 w-4" />
            <span className="text-sm">My Resorts</span>
          </Link>
        </div>
      )}
      
      <div className="space-y-1">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            API
          </p>
        </div>
        <Link to="/api-docs" className={subLinkClass}>
          <FileText className="h-4 w-4" />
          <span className="text-sm">API Docs</span>
        </Link>
        <Link to="/api-status" className={subLinkClass}>
          <Activity className="h-4 w-4" />
          <span className="text-sm">API Status</span>
        </Link>
      </div>

      <div className="h-px bg-border my-4" />

      <div className="min-h-[52px] p-4">
        {isLoggedIn ? (
          <UsernameMenu />
        ) : (
          <Link to="/sign-in" className="w-full">
            <Button className="w-full font-bold bg-primary-600 hover:bg-primary-700 h-12 min-h-[44px] text-base">
              <LogIn className="h-5 w-5 mr-2" />
              Log In
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default MobileNavLinks;

