import React, { useState } from "react";
import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";
import { Button } from "../../../shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FileText,
  Download,
  Printer,
  ShieldOff,
  BarChart3,
  Users,
  DollarSign,
  Receipt,
  Activity,
  Wrench,
  XCircle
} from "lucide-react";
import { HotelType } from "../../../shared/types";

type ReportType = "occupancy" | "cancellations" | "revenue" | "tax" | "guestList" | "activities" | "maintenance";

interface ReportTableProps {
  reportType: ReportType;
  data: any;
}

const ReportTable: React.FC<ReportTableProps> = ({ reportType, data }) => {
  const renderTable = () => {
    switch (reportType) {
      case "occupancy":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rooms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupied Rooms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalRooms}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.occupiedRooms}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.occupancyRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "cancellations":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancellation Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bookingId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.guestName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.cancellationDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.refundAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "revenue":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average per Booking</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.categories?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.totalRevenue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bookingsCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.averagePerBooking}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "tax":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collected</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.taxes?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.taxType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.taxableAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.taxAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.totalCollected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "guestList":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.guests?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.guestName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.checkInDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.checkOutDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.totalPaid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "activities":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Participants</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Generated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions Count</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.activities?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.activityName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalParticipants}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.revenueGenerated}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.averageRating}/5</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sessionsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "maintenance":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.maintenance?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.roomNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.issueType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.reportedDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.resolvedDate ? new Date(item.resolvedDate).toLocaleDateString() : 'Pending'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.cost || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return <div>No data available</div>;
    }
  };

  return (
    <div className="overflow-x-auto">
      {renderTable()}
    </div>
  );
};

const AdminReports: React.FC = () => {
  const { showToast } = useAppContext();
  const { isAdmin } = useRoleBasedAccess();
  const [reportType, setReportType] = useState<ReportType>("occupancy");
  const [startDate, setStartDate] = useState<Date | null>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Check if user has access
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShieldOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access the reports module.</p>
        </div>
      </div>
    );
  }

  // Fetch hotels for the resort filter
  const { data: hotels } = useQuery("hotels", apiClient.fetchHotels);

  const fetchReportData = async () => {
    if (!startDate || !endDate) {
      showToast({
        title: "Invalid Dates",
        description: "Please select both start and end dates.",
        type: "ERROR",
      });
      return;
    }

    setIsLoadingReport(true);
    try {
      const params = {
        hotelId: selectedHotel || undefined,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      let data;
      switch (reportType) {
        case "occupancy":
          data = await apiClient.fetchOccupancyRate(params);
          break;
        case "cancellations":
          data = await apiClient.fetchCancelledReservations(params);
          break;
        case "revenue":
          data = await apiClient.fetchRevenueReport(params);
          break;
        case "tax":
          data = await apiClient.fetchTaxCollection(params);
          break;
        case "guestList":
          data = await apiClient.fetchGuestMasterList(params);
          break;
        case "activities":
          data = await apiClient.fetchActivityParticipation(params);
          break;
        case "maintenance":
          data = await apiClient.fetchRoomMaintenanceHistory(params);
          break;
        default:
          throw new Error("Invalid report type");
      }

      setReportData(data);
    } catch (error: any) {
      showToast({
        title: "Failed to Load Report",
        description: error.message || "An error occurred while fetching the report.",
        type: "ERROR",
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    // Simple CSV export - in a real app, you'd want to handle different data structures
    const csvContent = "data:text/csv;charset=utf-8," + JSON.stringify(reportData);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case "occupancy":
        return <BarChart3 className="w-5 h-5" />;
      case "cancellations":
        return <XCircle className="w-5 h-5" />;
      case "revenue":
        return <DollarSign className="w-5 h-5" />;
      case "tax":
        return <Receipt className="w-5 h-5" />;
      case "guestList":
        return <Users className="w-5 h-5" />;
      case "activities":
        return <Activity className="w-5 h-5" />;
      case "maintenance":
        return <Wrench className="w-5 h-5" />;
    }
  };



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Reports</h1>
        <p className="text-gray-600">Generate and view comprehensive business reports</p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Report Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occupancy">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Occupancy
                  </div>
                </SelectItem>
                <SelectItem value="cancellations">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Cancellations
                  </div>
                </SelectItem>
                <SelectItem value="revenue">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Revenue
                  </div>
                </SelectItem>
                <SelectItem value="tax">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Tax
                  </div>
                </SelectItem>
                <SelectItem value="guestList">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Guest List
                  </div>
                </SelectItem>
                <SelectItem value="activities">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Activities
                  </div>
                </SelectItem>
                <SelectItem value="maintenance">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Maintenance
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resort Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resort
            </label>
            <Select value={selectedHotel} onValueChange={setSelectedHotel}>
              <SelectTrigger>
                <SelectValue placeholder="All resorts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resorts</SelectItem>
                {hotels?.map((hotel: HotelType) => (
                  <SelectItem key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={fetchReportData}
            disabled={isLoadingReport}
            className="flex items-center gap-2"
          >
            {isLoadingReport ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FileText className="w-4 h-4" />
            )}
            View Report
          </Button>

          {reportData && (
            <>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>

              <Button
                onClick={printReport}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            {getReportIcon(reportType)}
            <h2 className="text-xl font-semibold capitalize">
              {reportType.replace(/([A-Z])/g, ' $1').trim()} Report
            </h2>
          </div>

          {/* Render appropriate sub-component based on report type */}
          <ReportTable reportType={reportType} data={reportData} />
        </div>
      )}
    </div>
  );
};

export default AdminReports;
