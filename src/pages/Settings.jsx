import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Store, Shield, Key, Save } from 'lucide-react';
import Loader from '../components/Loader';

const Settings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({ name: '', storeName: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/settings/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({ name: data.name, storeName: data.store?.name || '' });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/settings/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...profile, ...passwords })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setPasswords({ currentPassword: '', newPassword: '' }); // Parol maydonlarini tozalash
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Xatolik yuz berdi!");
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <SettingsIcon className="text-blue-600" size={32} />
          Tizim sozlamalari
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Shaxsiy ma'lumotlar va xavfsizlikni boshqarish</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-8">
        
        {/* Asosiy ma'lumotlar */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <User className="text-blue-600" /> Asosiy ma'lumotlar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Sizning ismingiz</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" required
                  value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Do'kon nomi</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" required
                  value={profile.storeName} onChange={e => setProfile({...profile, storeName: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Xavfsizlik (Parol) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Shield className="text-blue-600" /> Xavfsizlik
          </h2>
          <p className="text-sm text-slate-500 mb-6">Parolni o'zgartirish uchun avval joriy parolni kiritishingiz shart. Agar o'zgartirishni xohlamasangiz, bu joylarni bo'sh qoldiring.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Joriy parol</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" placeholder="••••••••"
                  value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Yangi parol</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" placeholder="Yangi parolni kiriting"
                  value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Saqlash tugmasi */}
        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-2">
            <Save size={20} /> O'zgarishlarni saqlash
          </button>
        </div>

      </form>
    </div>
  );
};

export default Settings;