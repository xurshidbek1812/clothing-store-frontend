import { Navigate, Outlet } from 'react-router-dom';

export default function GuestRoute() {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  if (token && userRaw) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}