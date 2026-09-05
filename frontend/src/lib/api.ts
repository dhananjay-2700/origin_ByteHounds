export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const API_ENDPOINTS = {
  dashboard: `${API_BASE_URL}/api/dashboard`,
  forecast: `${API_BASE_URL}/api/forecast`,
  forecastAccuracy: `${API_BASE_URL}/api/forecast/accuracy`,
  forecastPeak: `${API_BASE_URL}/api/forecast/peak`,
  risk: `${API_BASE_URL}/api/risk`,
  anomalies: `${API_BASE_URL}/api/anomalies`,
  explanation: `${API_BASE_URL}/api/explanation`,
  weather: `${API_BASE_URL}/api/weather`,
  areas: `${API_BASE_URL}/api/areas`,
  areaDetail: (id: string) => `${API_BASE_URL}/api/areas/${encodeURIComponent(id)}`,
  dataHealth: `${API_BASE_URL}/api/data-health`,
  simulation: `${API_BASE_URL}/api/simulation`,
  copilot: `${API_BASE_URL}/api/copilot`,
  waitlist: `${API_BASE_URL}/api/waitlist`,
};
