import React, { useState, useEffect } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../../shared/auth/api-client";

interface HousekeepingMobileViewProps {
  staffId?: string;
}

interface Task {
  _id: string;
  roomNumber: string;
  taskType: string;
  priority: string;
  status: string;
  checklist: { item: string; status: string }[];
  qrCode: string;
}

export const HousekeepingMobileView: React.FC<HousekeepingMobileViewProps> = ({
  staffId,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "completed">("pending");

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [staffId]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("session_id");
      const url = staffId
        ? `${getApiBaseUrl()}/api/housekeeping-tasks/staff/${staffId}`
        : `${getApiBaseUrl()}/api/housekeeping-tasks/test-hotel-id`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const scanQRCode = async (qrCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("session_id");
      const response = await axios.get(
        `${getApiBaseUrl()}/api/housekeeping-tasks/qr/${qrCode}`
      );

      setCurrentTask(response.data.task);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid QR code");
    } finally {
      setLoading(false);
    }
  };

  const startTask = async () => {
    if (!currentTask) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("session_id");
      await axios.post(
        `${getApiBaseUrl()}/api/housekeeping-tasks/${currentTask._id}/scan`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh tasks
      await fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to start task");
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistItem = async (itemIndex: number, status: string) => {
    if (!currentTask) return;

    try {
      const token = localStorage.getItem("session_id");
      await axios.post(
        `${getApiBaseUrl()}/api/housekeeping-tasks/${currentTask._id}/checklist`,
        { itemIndex, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setCurrentTask((prev) => {
        if (!prev) return null;
        const checklist = [...prev.checklist];
        checklist[itemIndex] = { ...checklist[itemIndex], status };
        return { ...prev, checklist };
      });
    } catch (err) {
      console.error("Error updating checklist:", err);
    }
  };

  const completeTask = async () => {
    if (!currentTask) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("session_id");
      await axios.post(
        `${getApiBaseUrl()}/api/housekeeping-tasks/${currentTask._id}/complete`,
        { depositAmount: 0 }, // No deposit refund for demo
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentTask(null);
      await fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to complete task");
    } finally {
      setLoading(false);
    }
  };

  // Manual QR input for demo
  const [manualQR, setManualQR] = useState("");

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "pending") return task.status === "pending";
    if (activeTab === "active") return task.status === "in_progress";
    return task.status === "completed";
  });

  if (currentTask) {
    return (
      <div className="max-w-md mx-auto p-4">
        {/* Task Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Room {currentTask.roomNumber}</h2>
            <span className="bg-white text-blue-600 px-2 py-1 rounded text-sm font-medium">
              {currentTask.taskType.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white border border-gray-200 rounded-b-lg p-4">
          <h3 className="font-bold text-gray-800 mb-3">Checklist</h3>
          <div className="space-y-2">
            {currentTask.checklist.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm">{item.item}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateChecklistItem(idx, "passed")}
                    className={`w-8 h-8 rounded ${
                      item.status === "passed"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => updateChecklistItem(idx, "failed")}
                    className={`w-8 h-8 rounded ${
                      item.status === "failed"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    ✗
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            {currentTask.status === "pending" && (
              <button
                onClick={startTask}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? "Starting..." : "Start Task"}
              </button>
            )}

            {currentTask.status === "in_progress" && (
              <button
                onClick={completeTask}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? "Completing..." : "Complete & Clear Room"}
              </button>
            )}

            <button
              onClick={() => setCurrentTask(null)}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-lg mb-4">
        <h1 className="text-xl font-bold">🏨 Housekeeping</h1>
        <p className="text-blue-100 text-sm">Scan room QR code to start task</p>
      </div>

      {/* QR Scanner (simulated) */}
      <div className="bg-gray-900 rounded-lg p-6 mb-4 text-center">
        <div className="w-48 h-48 mx-auto bg-white rounded-lg mb-3 flex items-center justify-center">
          <span className="text-4xl">📷</span>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          Point camera at room QR code
        </p>

        {/* Manual entry for demo */}
        <input
          type="text"
          value={manualQR}
          onChange={(e) => setManualQR(e.target.value)}
          placeholder="Or enter QR code manually"
          className="w-full px-3 py-2 rounded text-gray-900 text-sm mb-2"
        />
        <button
          onClick={() => manualQR && scanQRCode(manualQR)}
          disabled={!manualQR || loading}
          className="w-full bg-blue-500 text-white py-2 rounded font-medium disabled:opacity-50"
        >
          {loading ? "Scanning..." : "Scan QR Code"}
        </button>

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* Task Tabs */}
      <div className="flex gap-2 mb-3">
        {(["pending", "active", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg font-medium text-sm ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task._id}
            onClick={() => setCurrentTask(task)}
            className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center"
          >
            <div>
              <p className="font-bold">Room {task.roomNumber}</p>
              <p className="text-sm text-gray-600 capitalize">{task.taskType}</p>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                task.priority === "urgent"
                  ? "bg-red-100 text-red-700"
                  : task.priority === "high"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {task.priority}
            </span>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <p className="text-center text-gray-500 py-8">No tasks</p>
        )}
      </div>
    </div>
  );
};

export default HousekeepingMobileView;
