import { useQuery } from "react-query";
import axios from "axios";
import React from 'react';

const fetchFeatureFlags = async (): Promise<Record<string, boolean>> => {
  const response = await axios.get("/api/feature-flags");
  return response.data.data;
};

export const useFeatureFlag = (flagKey: string, defaultValue = true): boolean => {
  const { data } = useQuery({
    queryKey: ["featureFlags"],
    queryFn: fetchFeatureFlags,
    staleTime: 60000,
    cacheTime: 300000,
    retry: 1,
  });

  if (data === undefined) return defaultValue;
  return data[flagKey] ?? defaultValue;
};

export const useAllFeatureFlags = () => {
  return useQuery({
    queryKey: ["featureFlags"],
    queryFn: fetchFeatureFlags,
    staleTime: 60000,
  });
};

// Helper component for conditional rendering
interface FeatureFlagGuardProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureFlagGuard = ({
  flag,
  children,
  fallback = null,
}: FeatureFlagGuardProps) => {
  const isEnabled = useFeatureFlag(flag);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

// Higher order component
export function withFeatureFlag<P extends object>(flag: string) {
  return function(Component: React.ComponentType<P>) {
    return function WrappedComponent(props: P) {
      const isEnabled = useFeatureFlag(flag);
      return isEnabled ? <Component {...props} /> : null;
    };
  };
}

