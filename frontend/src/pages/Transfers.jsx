import { useState, useEffect } from 'react';
import { ArrowRightLeft, Wallet, Plus, AlertCircle, FileText } from 'lucide-react';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    fromCashboxId: '',
    toCashboxId: '',
    amount: '',
    description: ''
  });

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [transRes, cashRes] = await Promise.all([
        fetch(`${API_URL}/api/transfers`, { headers }),
        fetch(`${API_URL}/api/cashboxes`, { headers })
      ]);

      if (transRes.ok) setTransfers(await transRes.json());
      if (cashRes.ok) setCashboxes(await cashRes.json());
    } catch (error) {
      console.error("Xatolik:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.fromCashboxId === formData.toCashboxId) {
      return alert("Bir xil kassaga o'tkazma qilib bo'lmaydi!");
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchData();
        setIsModalOpen(false);
        setFormData({ fromCashboxId: '', toCashboxId: '', amount: '', description: '' });
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      alert("Server bilan ulanishda xatolik!");
    }
  };

  return (
    <div className="p-8">
      {/* Sarlavha qismi */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ArrowRightLeft className="text-blue-600" size={32} />
            Pul o'tkazmalari
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Kassalararo mablag' harakatini boshqarish</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          <Plus size={20} /> Yangi o'tkazma
        </button>
      </div>

      {isLoading ? <Loader /> : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase font-black tracking-widest">
                <th className="p-5">Sana</th>
                <th className="p-5">Qayerdan (Chiqim)</th>
                <th className="p-5">Qayerga (Kirim)</th>
                <th className="p-5">Izoh</th>
                <th className="p-5 text-right">Summa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <ArrowRightLeft size={48} className="opacity-20" />
                      <p>Hozircha o'tkazmalar mavjud emas...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-5 text-slate-500 font-medium">
                      {new Date(t.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-5">
                      <span className="flex items-center gap-2 font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg w-fit">
                        <Wallet size={16} /> {t.fromCashbox?.name}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="flex items-center gap-2 font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg w-fit">
                        <Wallet size={16} /> {t.toCashbox?.name}
                      </span>
                    </td>
                    <td className="p-5 text-slate-500 flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" />
                      {t.description || <span className="italic opacity-50">Izohsiz</span>}
                    </td>
                    <td className="p-5 text-right font-black text-slate-900 text-base">
                      {Number(t.amount).toLocaleString()} <small className="text-xs font-medium text-slate-400">so'm</small>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL OYNA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl border border-slate-100"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <ArrowRightLeft className="text-blue-600" /> Pul o'tkazish
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Qayerdan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chiquvchi kassa</label>
                    <select 
                      required value={formData.fromCashboxId}
                      onChange={e => setFormData({...formData, fromCashboxId: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Tanlang</option>
                      {cashboxes.map(c => <option key={c.id} value={c.id}>{c.name} ({Number(c.balance).toLocaleString()})</option>)}
                    </select>
                  </div>
                  
                  {/* Qayerga */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kiruvchi kassa</label>
                    <select 
                      required value={formData.toCashboxId}
                      onChange={e => setFormData({...formData, toCashboxId: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 cursor-pointer appearance-none"
                    >
                      <option value="" disabled>Tanlang</option>
                      {cashboxes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Xatolik haqida ogohlantirish (Bir xil kassa tanlansa) */}
                {formData.fromCashboxId && formData.fromCashboxId === formData.toCashboxId && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                    <AlertCircle size={18} /> Kassalar har xil bo'lishi kerak!
                  </div>
                )}

                {/* Summa */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">O'tkazma summasi</label>
                  <input 
                    type="number" required placeholder="0" min="1"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-2xl font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Izoh */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Izoh (ixtiyoriy)</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none font-medium text-slate-700 placeholder:text-slate-400"
                    placeholder="Masalan: Savdodan tushgan naqd pulni plastikga tashlash..."
                  ></textarea>
                </div>

                {/* Tugmalar */}
                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    type="submit" 
                    disabled={formData.fromCashboxId === formData.toCashboxId}
                    className="flex-1 py-4 font-bold bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:bg-slate-300 disabled:shadow-none"
                  >
                    O'tkazish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transfers;