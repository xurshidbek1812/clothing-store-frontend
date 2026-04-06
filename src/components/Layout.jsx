import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Wallet,
  Settings,
  Users,
  LogOut,
  Tags,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StoreSwitcher from './StoreSwitcher';

const navItems = [
  { to: '/', label: 'Bosh sahifa', icon: LayoutDashboard },
  { to: '/pos', label: 'Savdo', icon: ShoppingCart },
  { to: '/inventory/stock', label: 'Ombor', icon: Boxes },
  { to: '/finance', label: 'Kassa', icon: Wallet },
  { to: '/catalogs', label: 'Ma’lumotnomalar', icon: Tags },
  { to: '/users', label: 'Xodimlar', icon: Users, roles: ['DIRECTOR'] },
  { to: '/settings', label: 'Sozlamalar', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-4">
          <div className="mb-6 rounded-3xl bg-slate-900 p-4 text-white shadow-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Clothing Shop</p>
            <h1 className="mt-2 text-xl font-bold">Boshqaruv paneli</h1>
            <p className="mt-2 text-sm text-slate-300">{user?.fullName}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>

          <nav className="space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-900 text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            <LogOut size={16} />
            Chiqish
          </button>
        </aside>

        <main className="p-4 lg:p-6">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Kiyim do‘koni boshqaruvi</h2>
              <p className="text-sm text-slate-500">
                Store-markazli savdo, ombor va kassa tizimi
              </p>
            </div>

            <StoreSwitcher />
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}