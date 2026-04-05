import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, 
  Settings, LogOut, Store, ChevronDown, Menu, X, 
  Wallet, Tag, BookOpen, UserCircle, PieChart, ChevronRight
} from 'lucide-react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Ichki menyularni ochib yopish uchun state
  const [openMenus, setOpenMenus] = useState({});
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStore, setCurrentStore] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Test uchun vaqtinchalik fake data yozib turamiz, o'zingiz haqiqiysiga almashtirasiz
    const fakeUser = { name: "Admin", role: "ADMIN", stores: [{id: 1, name: "Asosiy Filial"}] };
    const fakeStore = { id: 1, name: "Asosiy Filial" };
    
    const user = JSON.parse(localStorage.getItem('user')) || fakeUser;
    const store = JSON.parse(localStorage.getItem('currentStore')) || fakeStore;
    
    if (!user || !store) {
      navigate('/login');
    } else {
      setCurrentUser(user);
      setCurrentStore(store);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const changeStore = (store) => {
    localStorage.setItem('currentStore', JSON.stringify(store));
    setCurrentStore(store);
    setShowStoreDropdown(false);
    window.location.reload(); 
  };

  const toggleMenu = (title) => {
    setOpenMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // YANGILANGAN MENYU STRUKTURASI
  const menuItems = [
    { title: 'Bosh sahifa', icon: <LayoutDashboard size={20} />, path: '/' },
    { 
      title: 'Kassa', 
      icon: <Wallet size={20} />, 
      children: [
        { title: "Boshqa kassaga chiqim", path: "/kassa/chiqim" },
        { title: "Boshqa kassadan kirim", path: "/kassa/kirim" },
        { title: "Xarajatga pul chiqim", path: "/kassa/xarajat" },
        { title: "Barcha kassa amaliyotlari", path: "/kassa/barcha" },
        { title: "Kassalarni boshqarish", path: "/kassa/boshqarish" },
        { title: "Kassalar qoldig'i", path: "/kassa/qoldiq" },
        { title: "Valyuta ayriboshlash", path: "/kassa/ayriboshlash" }
      ]
    },
    { 
      title: 'Savdo', 
      icon: <ShoppingCart size={20} />, 
      children: [
        { title: "Naqd savdo", path: "/pos" },
        { title: "Nasiya savdo", path: "/credits" },
        { title: "Tovar qaytarish", path: "/returns" }
      ]
    },
    { 
      title: 'Ombor', 
      icon: <Package size={20} />, 
      children: [
        { title: "Barcha amaliyotlar", path: "/ombor/barcha" },
        { title: "Boshqa ombordan kirim", path: "/ombor/kirim" },
        { title: "Boshqa omborga chiqim", path: "/ombor/chiqim" },
        { title: "Taminotchidan tovar kirimi", path: "/inventory/in" },
        { title: "Taminotchiga qaytarish", path: "/ombor/qaytarish" },
        { title: "Mijozdan tovar kirimi", path: "/ombor/mijoz-kirim" },
        { title: "Tovar qoldig'i", path: "/inventory/stock" },
        { title: "Sanoq", path: "/ombor/sanoq" },
        { title: "Sanoq tarixi", path: "/ombor/sanoq-tarixi" }
      ]
    },
    { 
      title: 'Hisob-kitoblar', 
      icon: <Users size={20} />, 
      children: [
        { title: "Taminotchilar ro'yxati", path: "/hisob/taminotchilar" },
        { title: "Taminotchilar hisob-kitob", path: "/hisob/hisob-kitob" }
      ]
    },
    { 
      title: 'Narx yorlig\'i', 
      icon: <Tag size={20} />, 
      children: [
        { title: "Chop etish", path: "/print-labels" }
      ]
    },
    { 
      title: 'Hisobotlar', 
      icon: <PieChart size={20} />, 
      children: [
        { title: "Hisobotlar ro'yxati", path: "/reports" }
      ]
    },
    { 
      title: 'Ma\'lumotnomalar', 
      icon: <BookOpen size={20} />, 
      children: [
        { title: "Kategoriyalar", path: "/catalogs/kategoriyalar" },
        { title: "Xarajat moddalari", path: "/catalogs/xarajat-moddalari" },
        { title: "Razmerlar", path: "/catalogs/razmerlar" },
        { title: "Valyutalar", path: "/finance/currency" }
      ]
    },
    { 
      title: 'Sozlamalar', 
      icon: <Settings size={20} />, 
      children: [
        { title: "Profil sozlamalari", path: "/settings" },
        { title: "Xodimlar boshqaruvi", path: "/settings/xodimlar" }
      ]
    }
  ];

  if (!currentUser || !currentStore) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR (YON MENYU) */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-slate-900 text-white flex flex-col shadow-2xl relative z-20"
          >
            {/* LOGO QISMI */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Store size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">IPHONE HOUSE</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ERP System</p>
              </div>
            </div>

            {/* MENYU RO'YXATI */}
            <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
              {menuItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                const hasChildren = item.children && item.children.length > 0;
                const isOpen = openMenus[item.title];

                return (
                  <div key={index} className="mb-1">
                    {/* ASOSIY MENYU TUGMASI */}
                    {hasChildren ? (
                      <button 
                        onClick={() => toggleMenu(item.title)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                          isOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="font-semibold text-sm">{item.title}</span>
                        </div>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    ) : (
                      <Link to={item.path}>
                        <motion.div 
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                            isActive 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {item.icon}
                          <span className="font-semibold text-sm">{item.title}</span>
                        </motion.div>
                      </Link>
                    )}

                    {/* ICHKI MENYULAR (DROPDOWN) */}
                    <AnimatePresence>
                      {hasChildren && isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 ml-4 pl-4 border-l border-slate-700 flex flex-col gap-1">
                            {item.children.map((subItem, subIndex) => (
                              <Link 
                                key={subIndex} 
                                to={subItem.path}
                                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                  location.pathname === subItem.path 
                                  ? 'bg-blue-600/10 text-blue-400 font-semibold' 
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                {subItem.title}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ASOSIY QISM (TOPBAR + CONTENT) - Sizning kodingiz o'zgarishsiz qoldi */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Store size={16} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Hozirgi do'kon</p>
                  <p className="text-sm font-black text-slate-800">{currentStore.name}</p>
                </div>
                <ChevronDown size={16} className={`text-blue-600 transition-transform ${showStoreDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showStoreDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2"
                  >
                    <div className="px-4 py-2 border-b border-slate-50 mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase">Boshqa filialga o'tish</p>
                    </div>
                    {currentUser.stores && currentUser.stores.map(store => (
                      <button 
                        key={store.id}
                        onClick={() => changeStore(store)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between ${currentStore.id === store.id ? 'bg-blue-50/50' : ''}`}
                      >
                        <span className={`font-semibold text-sm ${currentStore.id === store.id ? 'text-blue-600' : 'text-slate-700'}`}>
                          {store.name}
                        </span>
                        {currentStore.id === store.id && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 pl-4 border-l border-slate-200"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-xs font-semibold text-slate-500 capitalize">{currentUser.role === 'ADMIN' ? 'Direktor' : 'Sotuvchi'}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                <UserCircle size={24} />
              </div>
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2"
                >
                  <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Settings size={16} /> Sozlamalar
                  </Link>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Tizimdan chiqish
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;