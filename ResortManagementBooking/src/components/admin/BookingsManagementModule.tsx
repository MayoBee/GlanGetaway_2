import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "react-query";
import { axiosInstance } from "../../api-client";
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { useToast } from '../../hooks/use-toast';
import { BookingType } from '../../../../shared/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SmartImage } from '../SmartImage';
import { LoadingSpinner } from '../LoadingSpinner';
import { Calendar, User, MapPin, DollarSign, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import { format } from 'date-fns';

interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

// Add missing API functions (assuming they exist or will be implemented)
const fetchAllBookings = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: BookingType[]; pagination: any }> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  const response = await apiClient.axiosInstance.get(`/api/admin/bookings?${queryParams}`);
  return response.data;
};

const updateBookingStatus = async (bookingId: string, status: string, reason?: string) => {
  const response = await apiClient.axiosInstance.patch(`/api/admin/bookings/${bookingId}/status`, {
    status,
    reason
  });
  return response.data;
};

const fetchBookingStats = async (): Promise<BookingStats> => {
  const response = await apiClient.axiosInstance.get('/api/admin/bookings/stats');
  return response.data;
};

const BookingsManagementModule: React.FC = () => {
  const { canManageBookings } = useRoleBasedAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; bookingId: string; bookingName: string; currentStatus: string }>({
    open: false,
    bookingId: '',
    bookingName: '',
    currentStatus: ''
  });
  const [statusReason, setStatusReason] = useState('');

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery(
    ['bookings', activeTab, currentPage, searchTerm, startDate, endDate],
    () => fetchAllBookings({
      page: currentPage,
      limit: 10,
      status: activeTab === 'all' ? undefined : activeTab,
      search: searchTerm || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    { enabled: canManageBookings }
  );

  const { data: stats } = useQuery('bookingStats', fetchBookingStats, { enabled: canManageBookings });

  const updateStatusMutation = useMutation(
    ({ bookingId, status, reason }: { bookingId: string; status: string; reason?: string }) =>
      updateBookingStatus(bookingId, status, reason),
    {
      onSuccess: (data) => {
        toast({
          title: 'Status Updated',
          description: `Booking status has been updated to ${data.status}.`,
        });
        setStatusDialog({ open: false, bookingId: '', bookingName: '', currentStatus: '' });
        setStatusReason('');
        queryClient.invalidateQueries(['bookings']);
        queryClient.invalidateQueries('bookingStats');
      },
      onError: (error: any) => {
        toast({
          title: 'Update Failed',
          description: error.message || 'Failed to update booking status.',
          variant: 'destructive',
        });
      },
    }
  );

  const handleStatusUpdate = (bookingId: string, status: string, bookingName: string, currentStatus: string) => {
    if (status === currentStatus) return;
    setStatusDialog({ open: true, bookingId, bookingName, currentStatus });
  };

  const confirmStatusUpdate = (newStatus: string) => {
    if (!statusReason.trim() && (newStatus === 'cancelled')) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for cancelling this booking.',
        variant: 'destructive',
      });
      return;
    }

    updateStatusMutation.mutate({
      bookingId: statusDialog.bookingId,
      status: newStatus,
      reason: statusReason || undefined,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const tabs = [
    { id: 'all', label: 'All Bookings', count: stats?.total || 0 },
    { id: 'confirmed', label: 'Confirmed', count: stats?.confirmed || 0 },
    { id: 'pending', label: 'Pending', count: stats?.pending || 0 },
    { id: 'cancelled', label: 'Cancelled', count: stats?.cancelled || 0 },
  ];

  if (!canManageBookings) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to manage bookings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
        <p className="text-gray-600">Manage and monitor all resort bookings</p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Bookings</div>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
                  <div className="text-sm text-gray-600">Confirmed</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <Calendar className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                  <div className="text-sm text-gray-600">Cancelled</div>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by guest name, email, or resort..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStartDate('');
              setEndDate('');
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setCurrentPage(1);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings Table */}
      {bookingsLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : bookingsData?.data?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No bookings found for the selected filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Resort</TableHead>
                <TableHead>Check-in / Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingsData?.data?.map((booking: BookingType) => (
                <TableRow key={booking._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.firstName} {booking.lastName}</div>
                      <div className="text-sm text-gray-500">{booking.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {booking.hotelId?.imageUrls?.[0] && (
                        <SmartImage
                          src={booking.hotelId.imageUrls[0]}
                          alt={booking.hotelId.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{booking.hotelId?.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.hotelId?.city}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(booking.checkIn), 'MMM dd, yyyy')}</div>
                      <div className="text-gray-500">to {format(new Date(booking.checkOut), 'MMM dd, yyyy')}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status || 'pending')}>
                      {booking.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₱{booking.totalCost?.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Booking Details</DialogTitle>
                          </DialogHeader>
                          {selectedBooking && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Guest Information</h4>
                                  <p><strong>Name:</strong> {selectedBooking.firstName} {selectedBooking.lastName}</p>
                                  <p><strong>Email:</strong> {selectedBooking.email}</p>
                                  <p><strong>Phone:</strong> {selectedBooking.phone}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Booking Details</h4>
                                  <p><strong>Check-in:</strong> {format(new Date(selectedBooking.checkIn), 'MMM dd, yyyy')}</p>
                                  <p><strong>Check-out:</strong> {format(new Date(selectedBooking.checkOut), 'MMM dd, yyyy')}</p>
                                  <p><strong>Guests:</strong> {selectedBooking.adultCount} adults, {selectedBooking.childCount} children</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Room Selections</h4>
                                <div className="space-y-2">
                                  {selectedBooking.selectedRooms?.map((room, index) => (
                                    <div key={index} className="flex justify-between">
                                      <span>{room.roomType} x {room.units}</span>
                                      <span>₱{room.price * room.units}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="border-t pt-4">
                                <div className="flex justify-between font-semibold">
                                  <span>Total Cost:</span>
                                  <span>₱{selectedBooking.totalCost?.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      {booking.status !== 'confirmed' && booking.status !== 'cancelled' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking._id, 'confirmed', `${booking.firstName} ${booking.lastName}`, booking.status || 'pending')}
                            disabled={updateStatusMutation.isLoading}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(booking._id, 'cancelled', `${booking.firstName} ${booking.lastName}`, booking.status || 'pending')}
                            disabled={updateStatusMutation.isLoading}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {bookingsData?.pagination && bookingsData.pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {bookingsData.pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(bookingsData.pagination.pages, prev + 1))}
            disabled={currentPage === bookingsData.pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Status Update Dialog */}
      {statusDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Update Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Update status for booking by <strong>{statusDialog.bookingName}</strong>?
              </p>
              {(statusDialog.currentStatus === 'pending') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (required for cancellation)
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    placeholder="Provide a reason..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusDialog({ open: false, bookingId: '', bookingName: '', currentStatus: '' });
                    setStatusReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => confirmStatusUpdate('confirmed')}
                  disabled={updateStatusMutation.isLoading}
                >
                  {updateStatusMutation.isLoading ? 'Updating...' : 'Confirm Booking'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => confirmStatusUpdate('cancelled')}
                  disabled={updateStatusMutation.isLoading || (!statusReason.trim())}
                >
                  {updateStatusMutation.isLoading ? 'Updating...' : 'Cancel Booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BookingsManagementModule;

