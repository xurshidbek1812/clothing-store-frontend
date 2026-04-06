import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute() {
  const location = useLocation();

  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  if (!token || !userRaw) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  try {
    JSON.parse(userRaw);
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeStoreId');

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}