import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Ikonkalarni import qilamiz
import { 
  LayoutDashboard, 
  Package, 
  Shirt, 
  ArrowDownLeft, 
  Wallet, 
  Banknote, 
  ArrowRightLeft, 
  LogOut,
  ChevronDown,
  ShoppingCart,
  FileText,
  ReceiptText,
  Settings as SettingsIcon
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState('ombor');

  const isActive = (path) => location.pathname === path 
    ? "bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/20" 
    : "text-gray-400 hover:bg-gray-800 hover:text-white font-medium";

  const toggleGroup = (groupName) => {
    setOpenGroup(openGroup === groupName ? '' : groupName);
  };

  return (
    <div className="w-64 bg-[#0f172a] min-h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50 select-none">
      {/* Logotip qismi */}
      <div className="p-6 border-b border-slate-800/50">
        <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShoppingCart size={20} strokeWidth={3} />
          </div>
          <span>IPHONE <span className="text-blue-500 text-lg">HOUSE</span></span>
        </h2>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto custom-scrollbar">
        
        {/* ASOSIY */}
        <Link to="/" className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${isActive('/')}`}>
          <LayoutDashboard size={20} />
          <span className="text-sm">Asosiy panel</span>
        </Link>

        {/* OMBOR GURUHI */}
        <div className="mt-2">
          <button 
            onClick={() => toggleGroup('ombor')} 
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Package size={20} />
              <span className="text-sm font-semibold">Ombor boshqaruvi</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${openGroup === 'ombor' ? 'rotate-180' : ''}`} />
          </button>
          
          {openGroup === 'ombor' && (
            <div className="pl-10 pr-2 mt-1 flex flex-col gap-1">
              <Link to="/products" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${isActive('/products')}`}>
                <Shirt size={14} /> Tovarlar
              </Link>
              <Link to="/incomes" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${isActive('/incomes')}`}>
                <ArrowDownLeft size={14} /> Kirimlar
              </Link>
            </div>
          )}
        </div>

        {/* SAVDO GURUHI */}
        <div className="mt-2">
          <button 
            onClick={() => toggleGroup('savdo')} 
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} />
              <span className="text-sm font-semibold">Savdo bo'limi</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${openGroup === 'savdo' ? 'rotate-180' : ''}`} />
          </button>
          
          {openGroup === 'savdo' && (
            <div className="pl-10 pr-2 mt-1 flex flex-col gap-1">
              <Link to="/sales" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${isActive('/sales')}`}>
                <ShoppingCart size={14} /> Savdo terminali
              </Link>
              <Link to="/sales-history" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${isActive('/sales-history')}`}>
                <FileText size={14} /> Sotuvlar tarixi
              </Link>
            </div>
          )}
        </div>

        {/* KASSA GURUHI */}
        <div>
          <button 
            onClick={() => toggleGroup('kassa')} 
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Wallet size={20} />
              <span className="text-sm font-semibold">Moliya bo'limi</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${openGroup === 'kassa' ? 'rotate-180' : ''}`} />
          </button>
          
          {openGroup === 'kassa' && (
            <div className="pl-10 pr-2 mt-1 flex flex-col gap-1">
              <Link to="/cashboxes" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${isActive('/cashboxes')}`}>
                <Banknote size={14} /> Kassalar
              </Link>
              <Link to="/transfers" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${isActive('/transfers')}`}>
                <ArrowRightLeft size={14} /> O'tkazmalar
              </Link>
              
              {/* MANA SHU YANGI QATORNI QO'SHING */}
              <Link to="/expenses" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${isActive('/expenses')}`}>
                <ReceiptText size={14} /> Xarajatlar
              </Link>
            </div>
          )}
        </div>

      </div>

      <div className="px-4 mt-4 border-t border-slate-800/50 pt-4">
        <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive('/settings')}`}>
          <SettingsIcon size={20} />
          <span className="text-sm font-semibold">Sozlamalar</span>
        </Link>
      </div>

      {/* CHIQISH */}
      <div className="p-4 border-t border-slate-800/50">
        <button className="w-full bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-sm font-bold">
          <LogOut size={18} />
          Tizimdan chiqish
        </button>
      </div>
    </div>
  );
};

export default Sidebar;