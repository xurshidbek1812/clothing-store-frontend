import { useState, useEffect } from 'react';
import Loader from '../components/Loader';

const Cashboxes = () => {
  const [cashboxes, setCashboxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', balance: '' });

  // .env dan URL ni olish
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchCashboxes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/cashboxes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setCashboxes(await response.json());
      }
    } catch (error) {
      console.error("Kassalarni yuklashda xatolik:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashboxes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/cashboxes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCashboxes();
        setIsModalOpen(false);
        setFormData({ name: '', balance: '' });
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      alert("Server bilan ulanib bo'lmadi!");
    }
  };

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Do'kon Kassalari</h1>
          <p className="text-gray-500 mt-1">Barcha tushum va xarajatlar markazi</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition duration-200 shadow-sm flex items-center gap-2"
        >
          <span className="text-xl">+</span> Yangi kassa ochish
        </button>
      </div>

      {/* Loader yoki Kontent */}
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {cashboxes.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-gray-400">
              Hozircha hech qanday kassa yo'q. Birinchi kassangizni yarating!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cashboxes.map((box) => (
                <div key={box.id} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <span className="text-2xl">🏦</span>
                    </div>
                    <span className="text-gray-400 text-sm">Aktiv</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">{box.name}</h3>
                    <p className="text-3xl font-bold tracking-wider">
                      {Number(box.balance).toLocaleString()} <span className="text-lg font-normal text-gray-400">so'm</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal oyna */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Yangi kassa yaratish</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Kassa nomi</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Masalan: Naqd kassa" 
                  className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Boshlang'ich qoldiq</label>
                <input 
                  type="number" value={formData.balance} 
                  onChange={e => setFormData({...formData, balance: e.target.value})} 
                  placeholder="0" 
                  className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl">Bekor qilish</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl">Yaratish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashboxes;