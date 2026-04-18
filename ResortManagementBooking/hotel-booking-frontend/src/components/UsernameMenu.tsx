import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { axiosInstance, signOut } from '@glan-getaway/shared-auth';
import { Plus, LogOut, Building2, BarChart3, Building } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const { isLoggedIn } = useAppContext();
  const { permissions } = useRoleBasedAccess();
  const [loadingRequest, setLoadingRequest] = useState(true);

  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!isLoggedIn) return;
      try {
        const response = await axiosInstance.get('/api/role-promotion-requests');
        const requests = response.data?.data || response.data || [];
        const pending = requests.find((req: any) => req.status === 'pending');
        setPendingRequest(pending);
      } catch (err) {
        // Ignore errors, user just has no requests
      } finally {
        setLoadingRequest(false);
      }
    };
    checkPendingRequest();
  }, [isLoggedIn]);

  const email = localStorage.getItem("user_email");
  const name = localStorage.getItem("user_name");

  const avatarUrl = imgError
    ? `https://robohash.org/${email || "user"}.png?set=set1&size=80x80`
    : getAvatarUrl();

  const handleMenuClick = () => setIsOpen(false);

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
    window.location.href = "/";
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
         {/* Apply for Resort Owner - Regular users only */}
         {!permissions.canManageOwnResorts && !permissions.isAdmin && !loadingRequest && (
           pendingRequest ? (
             <DropdownMenuItem disabled className="py-1.5 rounded-md opacity-60">
               <div className="flex items-center gap-2 w-full">
                 <Building2 className="h-4 w-4 text-amber-500" />
                 <span className="text-amber-600 font-medium">Request Pending...</span>
               </div>
             </DropdownMenuItem>
           ) : (
             <DropdownMenuItem
               onClick={handleMenuClick}
               asChild
               className="py-1.5 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
             >
               <Link
                 to="/apply-resort-owner"
                 className="flex items-center gap-2 w-full font-bold hover:text-primary-600"
               >
                 <Building2 className="h-4 w-4" />
                 Apply for Resort Owner
               </Link>
             </DropdownMenuItem>
           )
         )}
         <Separator className="my-2 bg-gray-200" />

         {/* Add Resort - Only visible to Resort Owners */}
         {permissions.canManageOwnResorts && (
          <DropdownMenuItem
            onClick={handleMenuClick}
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
        <Separator className="my-2 bg-gray-200" />
        
        {/* Resort Owner Links */}
        {permissions.canManageOwnResorts && (
          <>
            {/* Resort Reports */}
            <DropdownMenuItem
              onClick={handleMenuClick}
              asChild
              className="py-1.5 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
            >
              <Link
                to="/resort/reports"
                className="flex items-center gap-2 w-full font-bold hover:text-green-600"
              >
                <BarChart3 className="h-4 w-4" />
                Resort Reports
              </Link>
            </DropdownMenuItem>
            {/* My Resorts */}
            <DropdownMenuItem
              onClick={handleMenuClick}
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
            <Separator className="my-2 bg-gray-200" />
          </>
        )}
        <DropdownMenuItem className="py-1.5 rounded-md cursor-pointer">
          <Button
            onClick={handleLogout}
            className="w-full font-bold bg-primary-600 hover:bg-primary-700 text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UsernameMenu;
