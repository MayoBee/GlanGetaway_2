import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../shared/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Separator } from "../shared/ui/separator";
import { Button } from "../shared/ui/button";
import { useState } from "react";
import * as apiClient from "../api-client";
import { Plus, LogOut, Building, UserCheck, BarChart3, Users } from "lucide-react";
import useAppContext from "../hooks/useAppContext";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";

const getAvatarUrl = () => {
  const image = localStorage.getItem("user_image");
  const email = localStorage.getItem("user_email");
  const name = localStorage.getItem("user_name");
  const id = email || name || "user";
  if (image) return image;
  return `https://robohash.org/${encodeURIComponent(id)}.png?set=set1&size=80x80`;
};

const UsernameMenu = () => {
  const [imgError, setImgError] = useState(false);
  const { isLoggedIn } = useAppContext();
  const { permissions, hasAnyManagementPermission, isFrontDesk } = useRoleBasedAccess();

  // Debug logging for front desk menu issue
  console.log("UsernameMenu - Debug Info:", {
    isLoggedIn,
    isFrontDesk,
    hasAnyManagementPermission,
    email: localStorage.getItem("user_email"),
    userRole: localStorage.getItem("user_role")
  });

  const email = localStorage.getItem("user_email");
  const name = localStorage.getItem("user_name");

  const avatarUrl = imgError
    ? `https://robohash.org/${email || "user"}.png?set=set1&size=80x80`
    : getAvatarUrl();

  const handleLogout = async () => {
    await apiClient.signOut();
    window.location.href = "/";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border-2 border-teal-400/80 p-0.5 focus:outline-none focus:ring-2 focus:ring-teal-300">
          <img
            src={avatarUrl}
            alt={name || email || "User"}
            className="h-9 w-9 rounded-full object-cover"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white p-2">
        <div className="px-2 py-1">
          <p className="font-medium">{name || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <Separator className="my-2 bg-gray-200" />
        {/* Apply for Resort Owner - Only visible to regular users */}
        {!permissions.canManageOwnResorts && (
          <DropdownMenuItem
            asChild
            className="py-1.5 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
          >
            <Link
              to="/apply-resort-owner"
              className="flex items-center gap-2 w-full font-bold hover:text-primary-600"
            >
              <UserCheck className="h-4 w-4" />
              Apply for Resort Owner
            </Link>
          </DropdownMenuItem>
        )}
        {/* Add Resort - Only visible to Resort Owners */}
        {permissions.canManageOwnResorts && (
          <DropdownMenuItem
            asChild
            className="py-1.5 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
          >
            <Link
              to="/add-hotel"
              className="flex items-center gap-2 w-full font-bold hover:text-primary-600"
            >
              <Plus className="h-4 w-4" />
              Add Resort
            </Link>
          </DropdownMenuItem>
        )}
        {permissions.canManageOwnResorts && (
          <DropdownMenuItem
            asChild
            className="py-1.5 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
          >
            <Link
              to="/my-hotels"
              className="flex items-center gap-2 w-full font-bold hover:text-primary-600"
            >
              <Building className="h-4 w-4" />
              My Resorts
            </Link>
          </DropdownMenuItem>
        )}
        {permissions.canManageOwnResorts && (
          <DropdownMenuItem
            asChild
            className="py-1.5 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
          >
            <Link
              to="/resort/reports"
              className="flex items-center gap-2 w-full font-bold hover:text-primary-600"
            >
              <BarChart3 className="h-4 w-4" />
              Resort Analytics
            </Link>
          </DropdownMenuItem>
        )}
        {permissions.canManageOwnResorts && (
          <DropdownMenuItem
            asChild
            className="py-1.5 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
          >
            <Link
              to="/manage-front-desk"
              className="flex items-center gap-2 w-full font-bold hover:text-primary-600"
            >
              <Users className="h-4 w-4" />
              Manage Front Desk
            </Link>
          </DropdownMenuItem>
        )}
        {/* Manage Resort - Only visible to Front Desk users with management permissions */}
        {isFrontDesk && hasAnyManagementPermission && (
          <DropdownMenuItem
            asChild
            className="py-1.5 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
          >
            <Link
              to="/front-desk-resorts"
              className="flex items-center gap-2 w-full font-bold hover:text-primary-600"
            >
              <Building className="h-4 w-4" />
              Manage Resort
            </Link>
          </DropdownMenuItem>
        )}
        <Separator className="my-2 bg-gray-200" />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UsernameMenu;
