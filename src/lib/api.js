const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const buildHeaders = (options = {}) => {
  const token = localStorage.getItem('token');
  const activeStoreId = localStorage.getItem('activeStoreId');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeStoreId ? { 'x-store-id': activeStoreId } : {}),
    ...(options.headers || {}),
  };
};

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'So‘rovda xatolik yuz berdi');
  }

  return data;
};

export { API_BASE_URL };