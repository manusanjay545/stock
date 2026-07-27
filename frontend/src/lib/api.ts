import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching auth token if needed
api.interceptors.request.use((config) => {
  // Try to get token from Zustand persist storage manually if needed
  if (typeof window !== 'undefined') {
    const storageStr = localStorage.getItem('auth-storage');
    if (storageStr) {
      try {
        const authData = JSON.parse(storageStr);
        const token = authData?.state?.session?.access_token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        // ignore parsing errors
      }
    }
  }
  return config;
});
