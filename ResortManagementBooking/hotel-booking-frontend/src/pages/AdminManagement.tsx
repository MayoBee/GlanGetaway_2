import React, { useState, useEffect } from "react";
import { useMutationWithLoading, useQueryWithLoading } from "../hooks/useLoadingHooks";
import { axiosInstance } from '@glan-getaway/shared-auth';
import {
  fetchAllUsers,
  searchUsers,
  promoteUserToAdmin,
  demoteUserToUser,
  deleteUser,
  toggleUserStatus,
} from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useAdminBypass } from "../hooks/useAdminBypass";
import { 
  Users, 
  Search, 
  Shield, 
  ShieldOff, 
  UserPlus, 
  UserMinus,
  Crown,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  TrendingUp,
  AlertCircle,
  Trash2,
  Power,
  PowerOff
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Separator } from "../components/ui/separator";

const AdminManagement = () => {
  const { showToast } = useAppContext();
  const { isAdmin } = useAdminBypass();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [recentPromotions, setRecentPromotions] = useState<any[]>([]);

  // Add to recent promotions when promotion succeeds
  const addToRecentPromotions = (user: any) => {
    const promotion = {
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      promotedAt: new Date(),
      previousRole: 'user',
      newRole: 'admin'
    };
    
    setRecentPromotions(prev => [promotion, ...prev.slice(0, 4)]); // Keep last 5 promotions
  };

  // Fetch all users
  const { data: users = [], isLoading } = useQueryWithLoading(
    "allUsers",
    fetchAllUsers,
    {
      loadingMessage: "Loading users...",
    }
  );

  // Search users
  const { data: searchResults = [], isLoading: isSearching } = useQueryWithLoading(
    ["searchUsers", searchQuery],
    () => searchUsers(searchQuery),
    {
      enabled: searchQuery.length > 2,
      loadingMessage: "Searching users...",
    }
  );

  // Promote user mutation
  const promoteMutation = useMutationWithLoading(promoteUserToAdmin, {
    onSuccess: (data) => {
      showToast({
        title: "User Promoted Successfully",
        description: `${data.firstName} ${data.lastName} has been promoted to admin.`,
        type: "SUCCESS",
      });
      
      // Add to recent promotions tracking
      addToRecentPromotions(data);
      
      setIsDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      showToast({
        title: "Promotion Failed",
        description: error.message || "Failed to promote user to admin.",
        type: "ERROR",
      });
    },
  });

  // Demote user mutation
  const demoteMutation = useMutationWithLoading(demoteUserToUser, {
    onSuccess: (data) => {
      showToast({
        title: "User Demoted Successfully",
        description: `${data.firstName} ${data.lastName} has been demoted to user.`,
        type: "SUCCESS",
      });
      
      setIsDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      showToast({
        title: "Demotion Failed",
        description: error.message || "Failed to demote user.",
        type: "ERROR",
      });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutationWithLoading(deleteUser, {
    onSuccess: (data) => {
      showToast({
        title: "User Deleted Successfully",
        description: `${data.firstName} ${data.lastName} has been deleted.`,
        type: "SUCCESS",
      });
      
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      showToast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete user.",
        type: "ERROR",
      });
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutationWithLoading(toggleUserStatus, {
    onSuccess: (data) => {
      showToast({
        title: `User ${data.isActive ? 'Activated' : 'Deactivated'}`,
        description: data.message,
        type: "SUCCESS",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Status Update Failed",
        description: error.message,
        type: "ERROR",
      });
    },
    loadingMessage: "Updating user status...",
  });

  const handlePromoteUser = (user: any) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const confirmPromotion = () => {
    if (selectedUser) {
      promoteMutation.mutate(selectedUser._id);
    }
  };

  const confirmDemotion = () => {
    if (selectedUser) {
      demoteMutation.mutate(selectedUser._id);
    }
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete._id);
    }
  };

  const handleToggleStatus = (user: any) => {
    toggleStatusMutation.mutate(user._id);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200"><Crown className="w-3 h-3 mr-1" />Admin</Badge>;
      case "resort_owner":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Shield className="w-3 h-3 mr-1" />Resort Owner</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Users className="w-3 h-3 mr-1" />User</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-5 h-5 text-purple-600" />;
      case "resort_owner":
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  // Check if user was recently promoted
  const isRecentlyPromoted = (userId: string) => {
    return recentPromotions.some(promotion => promotion.userId === userId);
  };

  // Get promotion time for display
  const getPromotionTime = (userId: string) => {
    const promotion = recentPromotions.find(p => p.userId === userId);
    if (!promotion) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - promotion.promotedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const displayUsers = searchQuery.length > 2 ? searchResults : users;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-red-600">Access Denied</CardTitle>
            <CardDescription>
              Only Admins can access the User Management page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-primary-600" />
            User Management
          </h1>
          {recentPromotions.length > 0 && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <TrendingUp className="w-3 h-3 mr-1" />
              {recentPromotions.length} recent promotion{recentPromotions.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <p className="text-gray-600">
          Promote or demote users to manage admin access for the resort booking system.
        </p>
      </div>

      {/* Recent Promotions Section */}
      {recentPromotions.length > 0 && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <TrendingUp className="w-5 h-5 mr-2" />
              Recent Promotions
            </CardTitle>
            <CardDescription className="text-green-700">
              Users who have been recently promoted to admin role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPromotions.map((promotion, index) => (
                <div key={`${promotion.userId}-${index}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{promotion.userName}</div>
                      <div className="text-sm text-gray-600">{promotion.userEmail}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800 border-green-200 mb-1">
                      Promoted to Admin
                    </Badge>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {getPromotionTime(promotion.userId)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              All Users ({displayUsers.length})
            </span>
            {searchQuery && (
              <Badge variant="outline" className="text-sm">
                Search: "{searchQuery}"
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchQuery ? "No users found matching your search." : "No users found."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayUsers.map((user: any) => (
                <div
                  key={user._id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    isRecentlyPromoted(user._id) ? 'border-green-300 bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        user.isActive ? 'bg-gray-200' : 'bg-gray-100 opacity-50'
                      }`}>
                        {getRoleIcon(user.role)}
                      </div>
                      {isRecentlyPromoted(user._id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {!user.isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <PowerOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className={`${!user.isActive ? 'opacity-50' : ''}`}>
                      <div className="font-semibold text-gray-900 flex items-center">
                        {user.firstName} {user.lastName}
                        {isRecentlyPromoted(user._id) && (
                          <Badge className="ml-2 bg-green-100 text-green-800 border-green-200 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Recently Promoted
                          </Badge>
                        )}
                        {!user.isActive && (
                          <Badge className="ml-2 bg-red-100 text-red-800 border-red-200 text-xs">
                            <PowerOff className="w-3 h-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-1" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                        {isRecentlyPromoted(user._id) && (
                          <span className="ml-3 text-green-600 font-medium">
                            <Clock className="w-3 h-3 mr-1 inline" />
                            Promoted {getPromotionTime(user._id)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getRoleBadge(user.role)}
                    
                    {user.role !== "admin" && (
                      <div className="flex space-x-2">
                        {user.role === "user" ? (
                          <Dialog open={isDialogOpen && selectedUser?._id === user._id} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => handlePromoteUser(user)}
                                variant="outline"
                                size="sm"
                                className="border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Promote
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center">
                                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                                  Promote User to Resort Owner
                                </DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to promote <strong>{user.firstName} {user.lastName}</strong> 
                                  ({user.email}) to resort owner role? This will give them access to manage their own resorts.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsDialogOpen(false)}
                                  disabled={promoteMutation.isLoading}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={confirmPromotion}
                                  disabled={promoteMutation.isLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {promoteMutation.isLoading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Promoting...
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Promote to Admin
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Dialog open={isDialogOpen && selectedUser?._id === user._id} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => handlePromoteUser(user)}
                                variant="outline"
                                size="sm"
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                              >
                                <UserMinus className="w-4 h-4 mr-1" />
                                Demote
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center">
                                  <ShieldOff className="w-5 h-5 mr-2 text-orange-600" />
                                  Demote Admin to User
                                </DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to demote <strong>{user.firstName} {user.lastName}</strong> 
                                  ({user.email}) to regular user role? This will remove their access to admin features.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsDialogOpen(false)}
                                  disabled={demoteMutation.isLoading}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={confirmDemotion}
                                  disabled={demoteMutation.isLoading}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  {demoteMutation.isLoading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Demoting...
                                    </>
                                  ) : (
                                    <>
                                      <UserMinus className="w-4 h-4 mr-2" />
                                      Demote to User
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    )}
                    
                    {/* Delete Confirmation Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center">
                            <Trash2 className="w-5 h-5 mr-2 text-red-600" />
                            Delete User Account
                          </DialogTitle>
                          <DialogDescription>
                            Are you sure you want to permanently delete <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> 
                            ({userToDelete?.email})? This action cannot be undone and will remove all their data.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={deleteMutation.isLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={confirmDelete}
                            disabled={deleteMutation.isLoading}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteMutation.isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Delete and Disable buttons for all users except current admin */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleToggleStatus(user)}
                        variant="outline"
                        size="sm"
                        className={`${
                          user.isActive 
                            ? 'border-orange-200 text-orange-700 hover:bg-orange-50' 
                            : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <PowerOff className="w-4 h-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setUserToDelete(user);
                          setIsDeleteDialogOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagement;
