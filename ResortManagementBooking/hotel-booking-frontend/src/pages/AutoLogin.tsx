import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { axiosInstance } from '@glan-getaway/shared-auth';;
import { Loader2 } from "lucide-react";

interface UserInfo {
  id: string;
  email: string;
  name?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
}

const AutoLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const destination = searchParams.get("destination") || "/";
    const validateAndLogin = async () => {
      if (!token) {
        setError("No token provided");
        navigate("/sign-in");
        return;
      }

      try {
        const validateResponse = await axiosInstance.get("/api/auth/validate-token", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (validateResponse.data && validateResponse.data.userId) {
          localStorage.setItem("session_id", token);

          try {
            const userResponse = await axiosInstance.get("/api/users/me", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const userInfo: UserInfo = userResponse.data;
            localStorage.setItem("user_id", userInfo.id || "");
            localStorage.setItem("user_email", userInfo.email || "");
            if (userInfo.name) localStorage.setItem("user_name", userInfo.name);
            if (userInfo.firstName) localStorage.setItem("user_firstName", userInfo.firstName);
            if (userInfo.lastName) localStorage.setItem("user_lastName", userInfo.lastName);
            if (userInfo.role) localStorage.setItem("user_role", userInfo.role);
            if (userInfo.image) localStorage.setItem("user_image", userInfo.image);
          } catch (userErr: any) {
            }

          navigate(destination, { replace: true });
        } else {
          setError("Invalid token");
          navigate("/sign-in");
        }
      } catch (err: any) {
        setError("Token validation failed");
        navigate("/sign-in");
      }
    };

    validateAndLogin();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-600">{error}</p>
          <p className="text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
};

export default AutoLogin;
