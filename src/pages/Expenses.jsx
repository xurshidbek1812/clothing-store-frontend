import { useState, useEffect } from 'react';
import { MinusCircle, Plus, Wallet, ReceiptText } from 'lucide-react';
import Loader from '../components/Loader';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: '', description: '', cashboxId: '' });

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [expRes, cashRes] = await Promise.all([
        fetch(`${API_URL}/api/expenses`, { headers }),
        fetch(`${API_URL}/api/cashboxes`, { headers })
      ]);
      if (expRes.ok) setExpenses(await expRes.json());
      if (cashRes.ok) setCashboxes(await cashRes.json());
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchData();
        setIsModalOpen(false);
        setFormData({ amount: '', description: '', cashboxId: '' });
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (error) { alert("Xatolik!"); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Do'kon xarajatlari</h1>
          <p className="text-gray-500 mt-1">Barcha chiqim amaliyotlari tarixi</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 transition shadow-lg flex items-center gap-2"
        >
          <MinusCircle size={20} /> Xarajat qo'shish
        </button>
      </div>

      {isLoading ? <Loader /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chap tomon: Ro'yxat */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b">
                  <th className="p-4">Sana</th>
                  <th className="p-4">Tafsilot</th>
                  <th className="p-4">Kassa</th>
                  <th className="p-4 text-right">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-red-50/30 transition">
                    <td className="p-4 text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-gray-700">{exp.description}</td>
                    <td className="p-4 text-sm text-gray-500 flex items-center gap-2">
                      <Wallet size={14} className="text-gray-300" /> {exp.cashbox?.name}
                    </td>
                    <td className="p-4 text-right font-black text-red-600">-{Number(exp.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* O'ng tomon: Kichik statistika (Kelajak uchun) */}
          <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-3xl p-8 text-white h-fit shadow-xl">
             <ReceiptText size={48} className="opacity-20 mb-4" />
             <h3 className="text-red-100 font-medium">Umumiy xarajatlar</h3>
             <p className="text-4xl font-black mt-2">
               {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()} <small className="text-sm font-normal">so'm</small>
             </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Xarajatni rasmiylashtirish</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="number" required placeholder="Summa" 
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-xl font-bold"
                value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
              />
              <input 
                type="text" required placeholder="Nima uchun?" 
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <select 
                required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4"
                value={formData.cashboxId} onChange={e => setFormData({...formData, cashboxId: e.target.value})}
              >
                <option value="">Kassani tanlang</option>
                {cashboxes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.balance.toLocaleString()})</option>)}
              </select>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-gray-400">Bekor qilish</button>
                <button type="submit" className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;