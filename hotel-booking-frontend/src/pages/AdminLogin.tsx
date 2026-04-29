import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Label } from "../../../shared/ui/label";
import { Badge } from "../../../shared/ui/badge";
import { Sparkles } from "lucide-react";

export type AdminSignInFormData = {
  email: string;
  password: string;
};

const AdminLogin = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<AdminSignInFormData>();

  const mutation = useMutation(apiClient.signIn, {
    onSuccess: async () => {
      showToast({
        title: "Sign In Successful",
        description: "Welcome to the admin dashboard.",
        type: "SUCCESS",
      });
      
      // Refetch user data to get the updated role
      await queryClient.invalidateQueries("validateToken");
      await queryClient.invalidateQueries("currentUser");
      
      // Wait a bit for the data to be loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/admin-dashboard");
    },
    onError: (error: Error) => {
      showToast({
        title: "Authentication Failed",
        description: error.message,
        type: "ERROR",
      });
    },
  });

  const onSubmit = (data: AdminSignInFormData) => {
    const cleanData = {
      email: String(data.email).trim(),
      password: String(data.password).trim()
    };
    mutation.mutate(cleanData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
          
          <CardHeader className="text-center relative z-10 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Admin Access
            </CardTitle>
            <CardDescription className="text-gray-600">
              Secure administrative login
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Mail className="h-6 w-6 text-gray-600" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    className="pl-10 pr-3 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter admin email"
                    {...register("email", { required: "Email is required" })}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center mt-1">
                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.email.message}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock className="h-6 w-6 text-gray-600" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-12 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter admin password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 pr-3 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <div className="flex items-center mt-1">
                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                      <Sparkles className="w-4 h-4 mr-1" />
                      {errors.password.message}
                    </Badge>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={mutation.isLoading}
                className="w-full py-3 px-4 rounded-md text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {mutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="w-5 h-5 mr-2" />
                    Access Admin Dashboard
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
