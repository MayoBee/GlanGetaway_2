// Environment detection and configuration utility
export interface EnvironmentConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  environment: 'development' | 'production';
  hostname: string;
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  const isProduction = !isDevelopment;

  // Determine API base URL
  let apiBaseUrl: string;
  
  // Priority order: Environment variable > Production URL > Local URL
  if (import.meta.env.VITE_API_BASE_URL) {
    apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  } else if (import.meta.env.VITE_PRODUCTION_API_URL && isProduction) {
    apiBaseUrl = import.meta.env.VITE_PRODUCTION_API_URL;
  } else if (isDevelopment) {
    apiBaseUrl = 'http://localhost:5000';
  } else {
    apiBaseUrl = 'https://glangetaway-2-1.onrender.com';
  }

  return {
    apiBaseUrl,
    isDevelopment,
    isProduction,
    environment: isDevelopment ? 'development' : 'production',
    hostname
  };
};

// Debug utility to log current environment
export const logEnvironmentInfo = () => {
  const config = getEnvironmentConfig();
  console.group('🌍 Environment Information');
  console.log('Environment:', config.environment);
  console.log('Hostname:', config.hostname);
  console.log('API Base URL:', config.apiBaseUrl);
  console.log('Is Development:', config.isDevelopment);
  console.log('Is Production:', config.isProduction);
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('VITE_PRODUCTION_API_URL:', import.meta.env.VITE_PRODUCTION_API_URL);
  console.log('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV);
  console.groupEnd();
};

export default getEnvironmentConfig;
