import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home,
  Wallet,
  ShoppingCart,
  Package,
  Users,
  Tag,
  PieChart,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Store,
  UserCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { title: "Bosh sahifa", icon: <Home size={20} />, path: "/" },

  {
    title: "Kassa",
    icon: <Wallet size={20} />,
    children: [
      { title: "Boshqa kassaga chiqim", path: "/cash/transfer-out" },
      { title: "Boshqa kassadan kirim", path: "/cash/transfer-in" },
      { title: "Xarajatga pul chiqim", path: "/cash/expense" },
      { title: "Barcha kassa amaliyotlari", path: "/cash/transactions" },
      { title: "Kassalarni boshqarish", path: "/cash/manage" },
      { title: "Kassalar qoldig'i", path: "/cash/balances" },
      { title: "Valyuta ayriboshlash", path: "/cash/exchange" },
    ],
  },

  {
    title: "Savdo",
    icon: <ShoppingCart size={20} />,
    children: [
      { title: "Naqd savdo", path: "/sales/cash" },
      { title: "Savdolar tarixi", path: "/sales/history" },
      { title: "Nasiya savdo", path: "/sales/credit" },
      { title: "Tovar qaytarish", path: "/sales/returns" },
    ],
  },

  {
    title: "Ombor",
    icon: <Package size={20} />,
    children: [
      { title: "Barcha ombor amaliyotlari", path: "/warehouse/movements" },
      { title: "Boshqa ombordan kirim", path: "/warehouse/in-from-warehouse" },
      { title: "Boshqa omborga chiqim", path: "/warehouse/out-to-warehouse" },
      { title: "Taminotchidan tovar kirimi", path: "/warehouse/in-from-supplier" },
      { title: "Taminotchiga tovar qaytarish", path: "/warehouse/return-to-supplier" },
      { title: "Mijozdan tovar kirimi", path: "/warehouse/in-from-customer" },
      { title: "Tovar qoldig'i", path: "/warehouse/balances" },
      { title: "Sanoq", path: "/warehouse/count" },
      { title: "Sanoq tarixi", path: "/warehouse/count-history" },
    ],
  },

  {
    title: "Hisob-kitoblar",
    icon: <Users size={20} />,
    children: [
      { title: "Taminotchilar ro'yxati", path: "/settlements/suppliers" },
      { title: "Taminotchilar hisob-kitob", path: "/settlements/supplier-balances" },
    ],
  },

  {
    title: "Narx yorlig'i",
    icon: <Tag size={20} />,
    children: [{ title: "Narx yorlig'i chop etish", path: "/labels/print" }],
  },

  {
    title: "Hisobotlar",
    icon: <PieChart size={20} />,
    children: [{ title: "Hisobotlar ro'yxati", path: "/reports" }],
  },

  {
    title: "References",
    icon: <BookOpen size={20} />,
    roles: ["DIRECTOR"],
    children: [
      { title: "Kategoriyalar", path: "/references/categories" },
      { title: "Xarajat moddalari", path: "/references/expense-categories" },
      { title: "Razmerlar", path: "/references/sizes" },
      { title: "Valyutalar", path: "/references/currencies" },
      { title: "Tovarlar", path: "/references/products" },
      { title: "Omborlar", path: "/references/warehouses" },
      { title: "Kassalar", path: "/references/cashboxes" },
      { title: "Taminotchilar", path: "/references/suppliers" },
    ],
  },

  {
    title: "Sozlamalar",
    icon: <Settings size={20} />,
    children: [
      { title: "Profil sozlamalari", path: "/settings/profile" },
      { title: "Xodimlar boshqaruvi", path: "/settings/employees", roles: ["DIRECTOR"] },
    ],
  },
];

export default function Layout() {
  const { user, stores, activeStoreId, selectedStore, setActiveStoreId, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role);
      })
      .map((item) => {
        if (!item.children) return item;

        return {
          ...item,
          children: item.children.filter((child) => {
            if (!child.roles) return true;
            return child.roles.includes(user?.role);
          }),
        };
      })
      .filter((item) => !item.children || item.children.length > 0);
  }, [user?.role]);

  const getActiveGroupTitle = () => {
    const found = filteredMenuItems.find(
      (item) =>
        item.children &&
        item.children.some((child) => location.pathname.startsWith(child.path))
    );

    return found?.title || null;
  };

  const [openMenu, setOpenMenu] = useState(getActiveGroupTitle());

  useEffect(() => {
    const activeGroup = getActiveGroupTitle();
    if (activeGroup) {
      setOpenMenu(activeGroup);
    }
  }, [location.pathname]);

  const toggleMenu = (title) => {
    setOpenMenu((prev) => (prev === title ? null : title));
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 h-screen w-72 overflow-hidden bg-gray-900 text-gray-100 shadow-xl">
        <div className="flex h-full flex-col">
          <div className="shrink-0 border-b border-gray-800 p-6">
            <div className="flex items-center justify-center">
              <h1 className="text-2xl font-bold tracking-wider text-blue-400">
                ERP TIZIM
              </h1>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
            <nav className="space-y-2 pb-4">
              {filteredMenuItems.map((item, index) => (
                <div key={index}>
                  {!item.children ? (
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex w-full items-center justify-between rounded-lg px-4 py-3 transition-colors duration-200 ${
                          isActive
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-400">{item.icon}</span>
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </NavLink>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={`flex w-full items-center justify-between rounded-lg px-4 py-3 transition-colors duration-200 ${
                          openMenu === item.title
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-400">{item.icon}</span>
                          <span className="font-medium">{item.title}</span>
                        </div>

                        <span className="text-gray-500">
                          {openMenu === item.title ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </span>
                      </button>

                      {openMenu === item.title && (
                        <ul className="mt-1 ml-4 space-y-1 border-l border-gray-700 pl-4">
                          {item.children.map((subItem, subIndex) => (
                            <li key={subIndex}>
                              <NavLink
                                to={subItem.path}
                                className={({ isActive }) =>
                                  `block rounded-lg px-4 py-2 text-sm transition-colors ${
                                    isActive
                                      ? 'bg-gray-800 text-white'
                                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                  }`
                                }
                              >
                                {subItem.title}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="shrink-0 border-t border-gray-800 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <LogOut size={16} />
              Chiqish
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-72 flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 p-6">
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedStore?.name || "Do'kon tanlanmagan"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedStore?.address || "Store bo'yicha ishlash oynasi"}
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <label className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    <Store size={14} />
                    Do'kon tanlash
                  </label>

                  <select
                    value={activeStoreId || ''}
                    onChange={(e) => setActiveStoreId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                  >
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <UserCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.fullName || ''}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        {user?.role || ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}