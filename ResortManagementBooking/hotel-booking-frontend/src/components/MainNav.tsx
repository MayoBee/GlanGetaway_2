import { Button } from "./ui/button";
import UsernameMenu from "./UsernameMenu";
import { Link } from "react-router-dom";
import useAppContext from "../hooks/useAppContext";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { 
  ChevronDown, 
  FileText,
  Activity,
  Building,
  BarChart3
} from "lucide-react";
import { getHotelsSearchUrl } from "../lib/nav-utils";

const NAV_AUTH_WIDTH = "min-w-[120px]";

const navLinkClass =
  "flex items-center text-gray-800 hover:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200";

const MainNav = () => {
  const { isLoggedIn } = useAppContext();
  const { permissions } = useRoleBasedAccess();

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
      
      {/* Management Dropdown - Only visible to resort owners */}
      {permissions.canManageOwnResorts && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`${navLinkClass} flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-primary-600 rounded-lg`}
            >
              Management
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white">
            {/* Resort Reports - Available to Resort Owners */}
            {permissions.canManageOwnResorts && (
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
            {permissions.canManageOwnResorts && (
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
