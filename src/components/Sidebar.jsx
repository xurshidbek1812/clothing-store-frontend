import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

const menuItems = [
  { title: "Bosh sahifa", icon: <Home size={20} />, path: "/" },
  { 
    title: "Kassa", 
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
    title: "Savdo", 
    icon: <ShoppingCart size={20} />, 
    children: [
      { title: "Naqd savdo", path: "/savdo/naqd" },
      { title: "Nasiya savdo", path: "/savdo/nasiya" },
      { title: "Savdolar tarixi", path: "/sales/history" },
      { title: "Tovar qaytarish", path: "/savdo/qaytarish" }
    ]
  },
  { 
    title: "Ombor", 
    icon: <Package size={20} />, 
    children: [
      { title: "Barcha ombor amaliyotlari", path: "/ombor/barcha" },
      { title: "Boshqa ombordan kirim", path: "/ombor/boshqa-kirim" },
      { title: "Boshqa omborga chiqim", path: "/ombor/boshqa-chiqim" },
      { title: "Taminotchidan tovar kirimi", path: "/ombor/taminotchi-kirim" },
      { title: "Taminotchiga tovar qaytarish", path: "/ombor/taminotchi-qaytarish" },
      { title: "Mijozdan tovar kirimi", path: "/ombor/mijoz-kirim" },
      { title: "Tovar qoldig'i", path: "/ombor/qoldiq" },
      { title: "Sanoq", path: "/ombor/sanoq" },
      { title: "Sanoq tarixi", path: "/ombor/sanoq-tarixi" }
    ]
  },
  { 
    title: "Hisob-kitoblar", 
    icon: <Users size={20} />, 
    children: [
      { title: "Taminotchilar ro'yxati", path: "/hisob/taminotchilar" },
      { title: "Taminotchilar hisob-kitob", path: "/hisob/taminotchi-hisob" }
    ]
  },
  { 
    title: "Narx yorlig'i", 
    icon: <Tag size={20} />, 
    children: [
      { title: "Narx yorlig'i chop etish", path: "/narx/chop-etish" }
    ]
  },
  { 
    title: "Hisobotlar", 
    icon: <PieChart size={20} />, 
    children: [
      { title: "Hisobotlar ro'yxati", path: "/hisobotlar/royxat" }
    ]
  },
  { 
    title: "Ma'lumotnomalar", 
    icon: <BookOpen size={20} />, 
    children: [
      { title: "Kategoriyalar", path: "/malumotlar/kategoriyalar" },
      { title: "Xarajat moddalari", path: "/malumotlar/xarajat-moddalari" },
      { title: "Razmerlar", path: "/malumotlar/razmerlar" },
      { title: "Valyutalar", path: "/malumotlar/valyutalar" }
    ]
  },
  { 
    title: "Sozlamalar", 
    icon: <Settings size={20} />, 
    children: [
      { title: "Profil sozlamalari", path: "/sozlamalar/profil" },
      { title: "Xodimlar boshqaruvi", path: "/sozlamalar/xodimlar" }
    ]
  }
];

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (title) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <div className="w-72 h-screen bg-gray-900 text-gray-100 overflow-y-auto flex flex-col shadow-xl">
      {/* Logo Qismi */}
      <div className="p-6 flex items-center justify-center border-b border-gray-800">
        <h1 className="text-2xl font-bold tracking-wider text-blue-400">ERP TIZIM</h1>
      </div>

      {/* Menyu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item, index) => (
          <div key={index}>
            {/* Asosiy Menyu Elementi */}
            <button
              onClick={() => item.children ? toggleMenu(item.title) : null}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                openMenus[item.title] ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-blue-400">{item.icon}</span>
                <span className="font-medium">{item.title}</span>
              </div>
              
              {/* Chevron icon (faqat children bo'lsa) */}
              {item.children && (
                <span className="text-gray-500">
                  {openMenus[item.title] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
              )}
            </button>

            {/* Sub-menyu Elementlari */}
            {item.children && openMenus[item.title] && (
              <ul className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                {item.children.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    <a
                      href={subItem.path}
                      className="block px-4 py-2 text-sm text-gray-400 rounded-lg hover:text-white hover:bg-gray-800 transition-colors"
                    >
                      {subItem.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;