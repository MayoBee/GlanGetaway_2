import { useEffect, useState } from "react";
import useAppContext from "../hooks/useAppContext";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";

const DebugUser = () => {
  const { user, userRole, isLoggedIn } = useAppContext();
  const { permissions, hasAnyManagementPermission, isFrontDesk } = useRoleBasedAccess();

  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    setDebugInfo({
      localStorage: {
        email: localStorage.getItem("user_email"),
        role: localStorage.getItem("user_role"),
        userId: localStorage.getItem("user_id"),
        sessionId: localStorage.getItem("session_id"),
      },
      context: {
        user,
        userRole,
        isLoggedIn,
      },
      permissions: {
        permissions,
        hasAnyManagementPermission,
        isFrontDesk,
      },
      rawUserPermissions: user?.permissions,
    });
  }, [user, userRole, isLoggedIn, permissions, hasAnyManagementPermission, isFrontDesk]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Debug Information</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Local Storage</h2>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo?.localStorage, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">App Context</h2>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo?.context, null, 2)}
        </pre>
      </div>

      <div className="bg-green-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Permissions</h2>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo?.permissions, null, 2)}
        </pre>
      </div>

      <div className="bg-yellow-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Raw User Permissions</h2>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo?.rawUserPermissions, null, 2)}
        </pre>
      </div>

      <div className="bg-red-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Manage Resort Should Show?</h2>
        <p className="text-lg font-bold">
          {isFrontDesk && hasAnyManagementPermission ? "✅ YES" : "❌ NO"}
        </p>
        <p className="text-sm">
          isFrontDesk: {isFrontDesk ? "true" : "false"}<br/>
          hasAnyManagementPermission: {hasAnyManagementPermission ? "true" : "false"}
        </p>
      </div>
    </div>
  );
};

export default DebugUser;
