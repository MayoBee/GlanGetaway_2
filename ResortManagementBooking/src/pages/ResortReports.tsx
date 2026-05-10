import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";
import { ShieldOff, FileText, TrendingUp, Users, Wrench, Activity, DollarSign, Calendar, XCircle, BarChart2, Clock, CheckCircle, Eye, Download } from "lucide-react";
import { axiosInstance } from "../api-client";

// ─── API helpers ────────────────────────────────────────────────────────────

const buildParams = (extra: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(extra).forEach(([k, v]) => { if (v) p.append(k, v); });
  return p.toString() ? `?${p}` : "";
};

const fetchBookingSummary = (groupBy: string, startDate: string, endDate: string) =>
  axiosInstance.get(`/api/resort-reports/reservations/summary${buildParams({ groupBy, startDate, endDate })}`).then(r => r.data);

const fetchOccupancy = (startDate: string, endDate: string) =>
  axiosInstance.get(`/api/resort-reports/reservations/occupancy${buildParams({ startDate, endDate })}`).then(r => r.data);

const fetchCancelled = (startDate: string, endDate: string) =>
  axiosInstance.get(`/api/resort-reports/reservations/cancelled${buildParams({ startDate, endDate })}`).then(r => r.data);

const fetchRevenue = (startDate: string, endDate: string) =>
  axiosInstance.get(`/api/resort-reports/financial/revenue${buildParams({ startDate, endDate })}`).then(r => r.data);

const fetchDailyTransactions = (date: string) =>
  axiosInstance.get(`/api/resort-reports/financial/daily${buildParams({ date })}`).then(r => r.data);

const fetchTaxes = (startDate: string, endDate: string) =>
  axiosInstance.get(`/api/resort-reports/financial/taxes${buildParams({ startDate, endDate })}`).then(r => r.data);

const fetchGuests = (startDate: string, endDate: string) =>
  axiosInstance.get(`/api/resort-reports/operational/guests${buildParams({ startDate, endDate })}`).then(r => r.data);

const fetchActivities = (startDate: string, endDate: string) =>
  axiosInstance.get(`/api/resort-reports/operational/activities${buildParams({ startDate, endDate })}`).then(r => r.data);

const fetchMaintenance = (startDate: string, endDate: string) =>
  axiosInstance.get(`/api/resort-reports/operational/maintenance${buildParams({ startDate, endDate })}`).then(r => r.data);

const fetchAmenityUsage = (startDate: string, endDate: string) =>
  axiosInstance.get(`/api/resort-reports/amenity-usage${buildParams({ startDate, endDate })}`).then(r => r.data);

// Pending bookings management APIs
const fetchPendingBookings = (page: number) =>
  axiosInstance.get(`/api/resort-reports/pending-bookings${buildParams({ page: page.toString() })}`).then(r => r.data);

const fetchBookingDetails = (bookingId: string) =>
  axiosInstance.get(`/api/resort-reports/booking-details/${bookingId}`).then(r => r.data);

const confirmBooking = (params: { bookingId: string; notes?: string }) =>
  axiosInstance.patch(`/api/resort-reports/confirm-booking/${params.bookingId}`, { notes: params.notes }).then(r => r.data);

const cancelBooking = (params: { bookingId: string; reason: string; refundAmount?: number }) =>
  axiosInstance.patch(`/api/resort-reports/cancel-booking/${params.bookingId}`, { reason: params.reason, refundAmount: params.refundAmount }).then(r => r.data);

const verifyGCashPayment = (params: { bookingId: string; status: "verified" | "rejected"; rejectionReason?: string }) =>
  axiosInstance.patch(`/api/bookings/${params.bookingId}/gcash/verify`, { 
    status: params.status,
    rejectionReason: params.rejectionReason
  }).then(r => r.data);

const verifyDocument = (params: { documentId: string; status: "approved" | "rejected"; rejectionReason?: string; notes?: string }) =>
  axiosInstance.patch(`/api/resort-reports/verify-document/${params.documentId}`, { status: params.status, rejectionReason: params.rejectionReason, notes: params.notes }).then(r => r.data);

// ─── Shared UI helpers ───────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
      <Icon className="w-5 h-5 text-blue-600" />
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const StatBox = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-blue-50 rounded-lg p-4 text-center">
    <p className="text-2xl font-bold text-blue-700">{value}</p>
    <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const Table = ({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          {headers.map(h => <th key={h} className="text-left px-4 py-2 font-semibold text-gray-600">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length} className="text-center py-8 text-gray-400">No data available</td></tr>
        ) : rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
            {row.map((cell, j) => <td key={j} className="px-4 py-2 text-gray-700">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DateRangeFilter = ({ startDate, endDate, onStartChange, onEndChange }: {
  startDate: string; endDate: string;
  onStartChange: (v: string) => void; onEndChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-3 mb-4">
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-500">From</label>
      <input type="date" value={startDate} onChange={e => onStartChange(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-500">To</label>
      <input type="date" value={endDate} onChange={e => onEndChange(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  </div>
);

const LoadingRow = () => (
  <div className="flex items-center justify-center py-10 text-gray-400">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3" />
    Loading...
  </div>
);

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const today = new Date().toISOString().split("T")[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

// ─── Section components ──────────────────────────────────────────────────────

const BookingSummarySection = () => {
  const [groupBy, setGroupBy] = useState("daily");
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-booking-summary", groupBy, startDate, endDate],
    () => fetchBookingSummary(groupBy, startDate, endDate),
    { enabled: !!startDate && !!endDate }
  );

  const byPeriod = data?.data?.byPeriod || {};
  const rows = Object.entries(byPeriod).sort(([a], [b]) => b.localeCompare(a)).map(([period, v]: any) => [
    period, v.bookings, v.cancelled, fmt(v.revenue)
  ]);

  return (
    <SectionCard title="2.5.1.1 Booking Summary" icon={Calendar}>
      <div className="flex flex-wrap gap-3 mb-4">
        <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
        <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      {isLoading ? <LoadingRow /> : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatBox label="Total Bookings" value={data?.data?.total ?? 0} />
            <StatBox label="Cancelled" value={data?.data?.cancelled ?? 0} />
            <StatBox label="Total Revenue" value={fmt(data?.data?.revenue ?? 0)} />
          </div>
          <Table headers={["Period", "Bookings", "Cancelled", "Revenue"]} rows={rows} />
        </>
      )}
    </SectionCard>
  );
};

const OccupancySection = () => {
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-occupancy", startDate, endDate],
    () => fetchOccupancy(startDate, endDate),
    { enabled: !!startDate && !!endDate }
  );

  const d = data?.data;
  const byType = (d?.byRoomType || []).map((r: any) => [r._id || "Unknown", r.bookings, fmt(r.revenue)]);

  return (
    <SectionCard title="2.5.1.2 Occupancy Rate Report" icon={BarChart2}>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {isLoading ? <LoadingRow /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatBox label="Total Rooms" value={d?.totalRooms ?? 0} />
            <StatBox label="Occupied Nights" value={Math.round(d?.occupiedRoomNights ?? 0)} />
            <StatBox label="Available Nights" value={d?.availableRoomNights ?? 0} />
            <StatBox label="Occupancy Rate" value={`${d?.occupancyRate ?? 0}%`} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">By Room Type</h3>
          <Table headers={["Room Type", "Bookings", "Revenue"]} rows={byType} />
        </>
      )}
    </SectionCard>
  );
};

const CancelledSection = () => {
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-cancelled", startDate, endDate],
    () => fetchCancelled(startDate, endDate),
    { enabled: !!startDate && !!endDate }
  );

  const rows = (data?.data || []).map((b: any) => [
    `${b.firstName} ${b.lastName}`,
    b.email,
    new Date(b.checkIn).toLocaleDateString(),
    new Date(b.checkOut).toLocaleDateString(),
    fmt(b.totalCost),
    b.cancellationReason || "—",
  ]);

  return (
    <SectionCard title="2.5.1.3 Cancelled Reservation Log" icon={XCircle}>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {isLoading ? <LoadingRow /> : (
        <>
          <p className="text-sm text-gray-500 mb-4">Total cancelled: <strong>{data?.pagination?.total ?? rows.length}</strong></p>
          <Table headers={["Guest", "Email", "Check-in", "Check-out", "Amount", "Reason"]} rows={rows} />
        </>
      )}
    </SectionCard>
  );
};

const RevenueSection = () => {
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-revenue", startDate, endDate],
    () => fetchRevenue(startDate, endDate),
    { enabled: !!startDate && !!endDate }
  );

  const d = data?.data;
  const roomRows = (d?.byCategory?.rooms || []).map((r: any) => [r._id || "Unknown", r.bookings, fmt(r.revenue)]);
  const amenityRows = (d?.byCategory?.amenities || []).map((a: any) => [a._id || "Unknown", a.count, fmt(a.revenue)]);

  return (
    <SectionCard title="2.5.2.1 Revenue Report per Category" icon={DollarSign}>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {isLoading ? <LoadingRow /> : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatBox label="Total Revenue" value={fmt(d?.totalRevenue ?? 0)} />
            <StatBox label="Total Bookings" value={d?.totalBookings ?? 0} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Rooms</h3>
          <Table headers={["Room Type", "Bookings", "Revenue"]} rows={roomRows} />
          <h3 className="text-sm font-semibold text-gray-600 mt-4 mb-2">Amenities</h3>
          <Table headers={["Amenity", "Count", "Revenue"]} rows={amenityRows} />
        </>
      )}
    </SectionCard>
  );
};

const DailyTransactionSection = () => {
  const [date, setDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-daily-tx", date],
    () => fetchDailyTransactions(date),
    { enabled: !!date }
  );

  const d = data?.data;
  const txRows = (d?.transactions || []).map((t: any) => [t._id, t.count, fmt(t.total)]);
  const methodRows = (d?.byPaymentMethod || []).map((m: any) => [m._id || "Unknown", m.count, fmt(m.total)]);
  const statusRows = (d?.byStatus || []).map((s: any) => [s._id, s.count]);

  return (
    <SectionCard title="2.5.2.2 Daily Transaction Summary" icon={TrendingUp}>
      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs font-medium text-gray-500">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {isLoading ? <LoadingRow /> : (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">By Payment Status</h3>
            <Table headers={["Status", "Count", "Total"]} rows={txRows} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">By Payment Method</h3>
            <Table headers={["Method", "Count", "Total"]} rows={methodRows} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">By Booking Status</h3>
            <Table headers={["Status", "Count"]} rows={statusRows} />
          </div>
        </div>
      )}
    </SectionCard>
  );
};

const TaxSection = () => {
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-taxes", startDate, endDate],
    () => fetchTaxes(startDate, endDate),
    { enabled: !!startDate && !!endDate }
  );

  const d = data?.data;

  return (
    <SectionCard title="2.5.2.3 Tax Collection Report (12% VAT)" icon={FileText}>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {isLoading ? <LoadingRow /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatBox label="Total Sales" value={fmt(d?.totalSales ?? 0)} />
          <StatBox label="Base Amount (excl. VAT)" value={fmt(d?.baseAmount ?? 0)} />
          <StatBox label="VAT Collected (12%)" value={fmt(d?.taxCollected ?? 0)} />
        </div>
      )}
    </SectionCard>
  );
};

const GuestListSection = () => {
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-guests", startDate, endDate],
    () => fetchGuests(startDate, endDate),
    { enabled: !!startDate && !!endDate }
  );

  const rows = (data?.data || []).map((g: any) => [
    `${g.firstName} ${g.lastName}`,
    g.email,
    g.phone || "—",
    g.adultCount,
    g.childCount,
    new Date(g.checkIn).toLocaleDateString(),
    new Date(g.checkOut).toLocaleDateString(),
  ]);

  return (
    <SectionCard title="2.5.3.1 Guest Master List" icon={Users}>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {isLoading ? <LoadingRow /> : (
        <>
          <p className="text-sm text-gray-500 mb-4">Total guests: <strong>{data?.pagination?.total ?? rows.length}</strong></p>
          <Table headers={["Name", "Email", "Phone", "Adults", "Children", "Check-in", "Check-out"]} rows={rows} />
        </>
      )}
    </SectionCard>
  );
};

const ActivitySection = () => {
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-activities", startDate, endDate],
    () => fetchActivities(startDate, endDate),
    { enabled: !!startDate && !!endDate }
  );

  const rows = (data?.data || []).map((a: any) => [
    a.activityName || a._id,
    a.bookings,
    a.totalParticipants,
    a.totalAdults,
    a.totalChildren,
    fmt(a.revenue),
  ]);

  return (
    <SectionCard title="2.5.3.2 Activity Participation Report" icon={Activity}>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {isLoading ? <LoadingRow /> : (
        <Table headers={["Activity", "Bookings", "Total Participants", "Adults", "Children", "Revenue"]} rows={rows} />
      )}
    </SectionCard>
  );
};

const MaintenanceSection = () => {
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-maintenance", startDate, endDate],
    () => fetchMaintenance(startDate, endDate),
    { enabled: !!startDate && !!endDate }
  );

  const rows = (data?.data || []).map((m: any) => [
    m.roomId || "—",
    m.category || "—",
    m.description || "—",
    m.status || "—",
    m.actualCost ? fmt(m.actualCost) : "—",
    new Date(m.createdAt).toLocaleDateString(),
  ]);

  const statsRows = (data?.stats || []).map((s: any) => [s._id, s.count, fmt(s.totalCost || 0)]);

  return (
    <SectionCard title="2.5.3.3 Room Maintenance History" icon={Wrench}>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {isLoading ? <LoadingRow /> : (
        <>
          {statsRows.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Summary by Category</h3>
              <Table headers={["Category", "Count", "Total Cost"]} rows={statsRows} />
              <h3 className="text-sm font-semibold text-gray-600 mt-4 mb-2">Maintenance Log</h3>
            </>
          )}
          <Table headers={["Room", "Category", "Description", "Status", "Cost", "Date"]} rows={rows} />
        </>
      )}
    </SectionCard>
  );
};

const AmenityUsageSection = () => {
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = useQuery(
    ["report-amenity-usage", startDate, endDate],
    () => fetchAmenityUsage(startDate, endDate),
    { enabled: !!startDate && !!endDate }
  );

  const rows = (data?.data || []).map((a: any) => [
    a.amenityName || a._id,
    a.totalBookings,
    a.totalGuests,
    fmt(a.revenue),
  ]);

  return (
    <SectionCard title="2.5.4 Amenity Usage Report" icon={BarChart2}>
      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      {isLoading ? <LoadingRow /> : (
        <Table headers={["Amenity", "Total Bookings", "Total Guests", "Revenue"]} rows={rows} />
      )}
    </SectionCard>
  );
};

// ─── Pending Bookings Management Section ─────────────────────────────────────

interface BookingDetailModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ bookingId, isOpen, onClose }) => {
  const { data, isLoading } = useQuery(
    ["booking-details", bookingId],
    () => fetchBookingDetails(bookingId),
    { enabled: isOpen && !!bookingId }
  );

  const queryClient = useQueryClient();
  const documentVerificationMutation = useMutation(verifyDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries(["booking-details", bookingId]);
      queryClient.invalidateQueries("pending-bookings");
    }
  });

  const handleDocumentVerification = (documentId: string, status: "approved" | "rejected", rejectionReason?: string) => {
    documentVerificationMutation.mutate({ documentId, status, rejectionReason });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading booking details...</p>
          </div>
        ) : data?.data ? (
          <div className="p-6 space-y-6">
            {/* Guest Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Guest Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>Name:</strong> {data.data.user?.firstName} {data.data.user?.lastName}</p>
                <p><strong>Email:</strong> {data.data.user?.email}</p>
                <p><strong>Phone:</strong> {data.data.user?.phone || "Not provided"}</p>
              </div>
            </div>

            {/* Booking Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Booking Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>Check-in:</strong> {new Date(data.data.booking.checkIn).toLocaleDateString()}</p>
                <p><strong>Check-out:</strong> {new Date(data.data.booking.checkOut).toLocaleDateString()}</p>
                <p><strong>Adults:</strong> {data.data.booking.adultCount}</p>
                <p><strong>Children:</strong> {data.data.booking.childCount}</p>
                <p><strong>Total Cost:</strong> {fmt(data.data.booking.totalCost)}</p>
                <p><strong>Status:</strong> <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">{data.data.booking.status}</span></p>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
              {data.data.payment ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Payment Method:</strong> {data.data.payment.paymentMethod}</p>
                  <p><strong>Amount:</strong> {fmt(data.data.payment.amount)}</p>
                  <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-sm ${
                    data.data.payment.status === "succeeded" || data.data.payment.status === "verified" ? "bg-green-100 text-green-800" :
                    data.data.payment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>{data.data.payment.status}</span></p>
                  {data.data.payment.referenceNumber && (
                    <p><strong>Reference Number:</strong> {data.data.payment.referenceNumber}</p>
                  )}
                  {data.data.payment.gcashNumber && (
                    <p><strong>GCash Number:</strong> {data.data.payment.gcashNumber}</p>
                  )}
                  {data.data.payment.screenshotUrl && (
                    <div className="mt-2">
                      <strong>Payment Screenshot:</strong>
                      <div className="mt-2">
                        <img 
                          src={data.data.payment.screenshotUrl} 
                          alt="GCash Payment Screenshot" 
                          className="max-w-xs rounded-lg border border-gray-300"
                          onClick={() => window.open(data.data.payment.screenshotUrl, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}
                  {data.data.payment.stripePaymentIntentId && (
                    <p><strong>Stripe Payment ID:</strong> {data.data.payment.stripePaymentIntentId}</p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-gray-500">No payment information available</div>
              )}
            </div>

            {/* Verification Documents */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Verification Documents</h4>
              {data.data.documents && data.data.documents.length > 0 ? (
                <div className="space-y-3">
                  {data.data.documents.map((doc: any) => (
                    <div key={doc._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p><strong>Type:</strong> {doc.documentType.replace("_", " ").toUpperCase()}</p>
                          <p className="flex items-center gap-2">
                            <strong>File:</strong> 
                            <a 
                              href={doc.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              download={doc.originalName}
                            >
                              <Download className="w-4 h-4" />
                              {doc.originalName}
                            </a>
                          </p>
                          <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-sm ${
                            doc.status === "approved" ? "bg-green-100 text-green-800" :
                            doc.status === "rejected" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>{doc.status}</span></p>
                        </div>
                      </div>
                      {doc.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleDocumentVerification(doc._id, "approved")}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            disabled={documentVerificationMutation.isLoading}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Rejection reason:");
                              if (reason) handleDocumentVerification(doc._id, "rejected", reason);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            disabled={documentVerificationMutation.isLoading}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {doc.rejectionReason && (
                        <p className="text-red-600 text-sm mt-2"><strong>Rejection Reason:</strong> {doc.rejectionReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-gray-500">No verification documents uploaded</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">Failed to load booking details</div>
        )}
      </div>
    </div>
  );
};

const PendingBookingsSection: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery(
    ["pending-bookings", currentPage],
    () => fetchPendingBookings(currentPage),
    { keepPreviousData: true }
  );

  const queryClient = useQueryClient();
  const confirmBookingMutation = useMutation(confirmBooking, {
    onSuccess: () => {
      // Invalidate all booking-related queries to update both resort owner and user views
      queryClient.invalidateQueries("pending-bookings");
      queryClient.invalidateQueries("booking-details");
      queryClient.invalidateQueries(["booking-details", selectedBookingId]);
      queryClient.invalidateQueries("report-booking-summary");
      queryClient.invalidateQueries("report-occupancy");
      queryClient.invalidateQueries("report-cancelled");
      alert("Booking confirmed successfully! The booking status has been updated for both resort owner and user.");
    },
    onError: (error: any) => {
      alert(`Failed to confirm booking: ${error.response?.data?.message || error.message}`);
    }
  });

  const cancelBookingMutation = useMutation(cancelBooking, {
    onSuccess: () => {
      // Invalidate all booking-related queries to update both resort owner and user views
      queryClient.invalidateQueries("pending-bookings");
      queryClient.invalidateQueries("booking-details");
      queryClient.invalidateQueries(["booking-details", selectedBookingId]);
      queryClient.invalidateQueries("report-booking-summary");
      queryClient.invalidateQueries("report-occupancy");
      queryClient.invalidateQueries("report-cancelled");
      alert("Booking cancelled successfully! The booking has been removed for both resort owner and user.");
    },
    onError: (error: any) => {
      alert(`Failed to cancel booking: ${error.response?.data?.message || error.message}`);
    }
  });

  const gcashVerificationMutation = useMutation(verifyGCashPayment, {
    onSuccess: () => {
      // Invalidate all booking-related queries to update both resort owner and user views
      queryClient.invalidateQueries("pending-bookings");
      queryClient.invalidateQueries("booking-details");
      queryClient.invalidateQueries(["booking-details", selectedBookingId]);
      queryClient.invalidateQueries("report-booking-summary");
      queryClient.invalidateQueries("report-occupancy");
      alert("GCash payment verification updated successfully!");
    },
    onError: (error: any) => {
      alert(`Failed to verify GCash payment: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleConfirmBooking = (bookingId: string) => {
    if (confirm("Are you sure you want to confirm this booking?")) {
      confirmBookingMutation.mutate({ bookingId, notes: "Booking confirmed by resort owner" });
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    const reason = prompt("Please provide cancellation reason:");
    if (reason) {
      cancelBookingMutation.mutate({ bookingId, reason, refundAmount: 0 });
    }
  };

  const handleVerifyGCashPayment = (bookingId: string, status: "verified" | "rejected") => {
    if (status === "rejected") {
      const reason = prompt("Please provide rejection reason:");
      if (reason) {
        gcashVerificationMutation.mutate({ bookingId, status, rejectionReason: reason });
      }
    } else {
      if (confirm("Are you sure you want to verify this GCash payment?")) {
        gcashVerificationMutation.mutate({ bookingId, status });
      }
    }
  };

  const handleRejectGCashPayment = (bookingId: string) => {
    handleVerifyGCashPayment(bookingId, 'rejected');
  };

  const handleViewDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setIsModalOpen(true);
  };

  const rows = (data?.data || []).map((booking: any) => [
    `${booking.firstName} ${booking.lastName}`,
    booking.email,
    new Date(booking.checkIn).toLocaleDateString(),
    new Date(booking.checkOut).toLocaleDateString(),
    fmt(booking.totalCost),
    booking.payment?.status || "pending",
    booking.documentCount || 0,
  ]);

  return (
    <>
      <SectionCard title="Pending Bookings Management" icon={Clock}>
        {isLoading ? <LoadingRow /> : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Total pending bookings: <strong>{data?.pagination?.total ?? 0}</strong>
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Guest</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Email</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Check-in</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Check-out</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Payment</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Documents</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No pending bookings</td></tr>
                  ) : (data?.data || []).map((booking: any, i: number) => (
                    <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{rows[i][0]}</td>
                      <td className="px-4 py-2 text-gray-700">{rows[i][1]}</td>
                      <td className="px-4 py-2 text-gray-700">{rows[i][2]}</td>
                      <td className="px-4 py-2 text-gray-700">{rows[i][3]}</td>
                      <td className="px-4 py-2 text-gray-700">{rows[i][4]}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          rows[i][5] === "succeeded" ? "bg-green-100 text-green-800" :
                          rows[i][5] === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>{rows[i][5]}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {rows[i][6] > 0 ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {rows[i][6]} file(s)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(booking._id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {booking.paymentMethod === 'gcash' ? (
                            <>
                              <button
                                onClick={() => handleVerifyGCashPayment(booking._id, 'verified')}
                                className="text-green-600 hover:text-green-800"
                                title="Verify GCash Payment"
                                disabled={gcashVerificationMutation.isLoading}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectGCashPayment(booking._id)}
                                className="text-red-600 hover:text-red-800"
                                title="Reject GCash Payment"
                                disabled={gcashVerificationMutation.isLoading}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleConfirmBooking(booking._id)}
                                className="text-green-600 hover:text-green-800"
                                title="Confirm Booking"
                                disabled={confirmBookingMutation.isLoading}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking._id)}
                                className="text-red-600 hover:text-red-800"
                                title="Cancel Booking"
                                disabled={cancelBookingMutation.isLoading}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {data.pagination.pages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(data.pagination.pages, prev + 1))}
                  disabled={currentPage === data.pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </SectionCard>

      <BookingDetailModal
        bookingId={selectedBookingId || ""}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = [
  { id: "reservation", label: "Reservation Reports", icon: Calendar },
  { id: "financial", label: "Financial Reports", icon: DollarSign },
  { id: "operational", label: "Operational Reports", icon: Users },
  { id: "amenity", label: "Amenity Usage", icon: Activity },
  { id: "pending", label: "Pending Bookings", icon: Clock },
];

// ─── Main page ───────────────────────────────────────────────────────────────

const ResortReports: React.FC = () => {
  const { isAdmin, isSuperAdmin, permissions } = useRoleBasedAccess();
  const [activeTab, setActiveTab] = useState("reservation");

  if (!isAdmin && !isSuperAdmin && !permissions.canManageOwnResorts) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators and resort owners can access the reports module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Resort Reports
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Generate and view all system reports. Use date filters to narrow results.</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {activeTab === "reservation" && (
          <>
            <BookingSummarySection />
            <OccupancySection />
            <CancelledSection />
          </>
        )}
        {activeTab === "financial" && (
          <>
            <RevenueSection />
            <DailyTransactionSection />
            <TaxSection />
          </>
        )}
        {activeTab === "operational" && (
          <>
            <GuestListSection />
            <ActivitySection />
            <MaintenanceSection />
          </>
        )}
        {activeTab === "amenity" && (
          <AmenityUsageSection />
        )}
        {activeTab === "pending" && (
          <PendingBookingsSection />
        )}
      </div>
    </div>
  );
};

export default ResortReports;

