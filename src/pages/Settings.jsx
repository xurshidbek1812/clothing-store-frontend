import { useState, useEffect } from 'react';
import { User, Store, Users, Plus, Shield, Save, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ma'lumotlar uchun statelar
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Formalar uchun statelar
  const [newStore, setNewStore] = useState({ name: '', address: '' });
  const [newEmployee, setNewEmployee] = useState({ name: '', username: '', password: '', storeIds: [] });

  const API_URL = import.meta.env.VITE_API_URL;

  // Dastlabki yuklanish
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    if (user?.role === 'ADMIN') {
      fetchAdminData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [storesRes, empRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stores`, { headers }),
        fetch(`${API_URL}/api/admin/employees`, { headers })
      ]);

      if (storesRes.ok) setStores(await storesRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik!");
    } finally {
      setIsLoading(false);
    }
  };

  // YANGI DO'KON QO'SHISH
  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newStore)
      });
      if (res.ok) {
        toast.success("Yangi do'kon qo'shildi!");
        setNewStore({ name: '', address: '' });
        fetchAdminData(); // Ro'yxatni yangilash
      } else {
        const data = await res.json();
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Server xatosi");
    }
  };

  // YANGI ISHCHI QO'SHISH
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (newEmployee.storeIds.length === 0) {
      return toast.error("Ishchiga kamida bitta do'kon biriktirishingiz shart!");
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newEmployee)
      });
      if (res.ok) {
        toast.success("Yangi ishchi muvaffaqiyatli qo'shildi!");
        setNewEmployee({ name: '', username: '', password: '', storeIds: [] });
        fetchAdminData();
      } else {
        const data = await res.json();
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Server xatosi");
    }
  };

  // Ishchiga do'kon tanlash/olib tashlash
  const toggleStoreSelection = (storeId) => {
    setNewEmployee(prev => {
      const isSelected = prev.storeIds.includes(storeId);
      if (isSelected) {
        return { ...prev, storeIds: prev.storeIds.filter(id => id !== storeId) };
      } else {
        return { ...prev, storeIds: [...prev.storeIds, storeId] };
      }
    });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Tizim Sozlamalari</h1>
        <p className="text-slate-500 mt-2 font-medium">Boshqaruv va xavfsizlik paneli</p>
      </div>

      {/* TAB MENU */}
      <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
        >
          <User size={20} /> Mening profilim
        </button>

        {/* FAQAT ADMIN UCHUN TABLAR */}
        {currentUser?.role === 'ADMIN' && (
          <>
            <button 
              onClick={() => setActiveTab('stores')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'stores' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <Store size={20} /> Do'konlar tarmog'i
            </button>
            <button 
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'employees' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <Users size={20} /> Xodimlar boshqaruvi
            </button>
          </>
        )}
      </div>

      {/* TAB 1: PROFIL */}
      {activeTab === 'profile' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 max-w-2xl">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Shield className="text-blue-600" /> Xavfsizlik va Ma'lumotlar</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Ismingiz</label>
              <input type="text" disabled value={currentUser?.name || ''} className="w-full bg-slate-50 border-none rounded-xl px-4 py-4 font-medium text-slate-700 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Username</label>
              <input type="text" disabled value={currentUser?.username || ''} className="w-full bg-slate-50 border-none rounded-xl px-4 py-4 font-medium text-slate-700 cursor-not-allowed" />
            </div>
            <div className="bg-blue-50 p-4 rounded-xl text-blue-700 text-sm font-medium">
              Tez orada bu yerdan parolingizni o'zgartirishingiz mumkin bo'ladi.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DO'KONLAR (FAQAT ADMIN) */}
      {activeTab === 'stores' && currentUser?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Mavjud do'konlar</h2>
            {stores.map(store => (
              <div key={store.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-800">{store.name}</h3>
                  <p className="text-slate-500 text-sm">{store.address || 'Manzil kiritilmagan'}</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm">
                  {store._count?.users || 0} ta ishchi
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Yangi do'kon qo'shish</h2>
              <form onSubmit={handleCreateStore} className="space-y-4">
                <input type="text" required placeholder="Do'kon nomi (Masalan: Filial 1)" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Manzili (Ixtiyoriy)" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Plus size={18} /> Yaratish
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: XODIMLAR (FAQAT ADMIN) */}
      {activeTab === 'employees' && currentUser?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Ishchilar ro'yxati</h2>
            {employees.length === 0 ? <p className="text-slate-400">Hali ishchilar qo'shilmagan.</p> : 
              employees.map(emp => (
                <div key={emp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">{emp.name}</h3>
                      <p className="text-slate-500 text-sm font-medium">@{emp.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {emp.stores.map(s => (
                      <span key={s.id} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-md flex items-center gap-1">
                        <Store size={12} /> {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>

          <div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Yangi ishchi yaratish</h2>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <input type="text" required placeholder="To'liq ismi" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" required placeholder="Username (Login uchun)" value={newEmployee.username} onChange={e => setNewEmployee({...newEmployee, username: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="password" required placeholder="Parol" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                
                {/* Do'konlarni biriktirish (Checkboxes) */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Qaysi do'konlarda ishlaydi?</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {stores.map(store => (
                      <label key={store.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition">
                        <input 
                          type="checkbox" 
                          checked={newEmployee.storeIds.includes(store.id)}
                          onChange={() => toggleStoreSelection(store.id)}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700 text-sm">{store.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 mt-4">
                  <Plus size={18} /> Ishchini saqlash
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;