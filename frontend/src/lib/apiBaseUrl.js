const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // In Vite dev we always prefer same-origin so /api and /socket.io can be proxied.
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  if (typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://127.0.0.1:3000';
};

export const API_BASE_URL = resolveApiBaseUrl();
