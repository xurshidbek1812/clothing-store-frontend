export async function apiFetch(path, options = {}) {
  const raw = localStorage.getItem('clothing_shop_auth');
  const auth = raw ? JSON.parse(raw) : null;

  const token = auth?.token;
  const activeStoreId = auth?.activeStoreId;

  const response = await fetch(`http://127.0.0.1:5050/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(activeStoreId ? { 'x-store-id': activeStoreId } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('clothing_shop_auth');
    localStorage.removeItem('clothing_shop_last_activity');
    window.location.href = '/login';
    return;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'So‘rovda xatolik');
  }

  localStorage.setItem('clothing_shop_last_activity', String(Date.now()));

  return data;
}

export const API_BASE_URL = 'http://127.0.0.1:5050';