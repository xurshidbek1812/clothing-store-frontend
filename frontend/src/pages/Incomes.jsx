import { useState, useEffect } from 'react';
import Loader from '../components/Loader'; // Loaderni import qildik

const Incomes = () => {
  const [incomes, setIncomes] = useState([]);
  const [products, setProducts] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading holati
  
  const [formData, setFormData] = useState({
    productId: '', quantity: '', costPrice: ''
  });

  // 1. Ma'lumotlarni bazadan olib kelish
  const fetchData = async () => {
    setIsLoading(true); // Yuklash boshlandi
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Ikkala so'rovni parallel yuboramiz (tezroq bo'lishi uchun)
      const [incomeRes, productRes] = await Promise.all([
        fetch('http://localhost:5000/api/incomes', { headers }),
        fetch('http://localhost:5000/api/products', { headers })
      ]);

      if (incomeRes.ok) setIncomes(await incomeRes.json());
      if (productRes.ok) setProducts(await productRes.json());

    } catch (error) {
      console.error("Ma'lumotlarni yuklashda xatolik:", error);
    } finally {
      setIsLoading(false); // Yuklash tugadi
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Yangi kirim saqlash
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/incomes', {
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
        setFormData({ productId: '', quantity: '', costPrice: '' });
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
      {/* Sarlavha qismi doim ko'rinib turadi */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Omborga kirimlar</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition duration-200 shadow-sm flex items-center gap-2"
        >
          <span className="text-xl">+</span> Yangi kirim
        </button>
      </div>

      {/* --- LOADER YOKI JADVAL --- */}
      {isLoading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Sana</th>
                <th className="p-4 font-medium">Tovar nomi</th>
                <th className="p-4 font-medium text-center">Miqdor</th>
                <th className="p-4 font-medium text-right">Kelish narxi</th>
                <th className="p-4 font-medium text-right">Umumiy summa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incomes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">Hozircha kirimlar yo'q...</td>
                </tr>
              ) : (
                incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(inc.date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {inc.product?.name} <span className="text-gray-400 text-xs ml-1">({inc.product?.size || '-'})</span>
                    </td>
                    <td className="p-4 text-center font-bold text-blue-600">{inc.quantity} ta</td>
                    <td className="p-4 text-right text-gray-500">{Number(inc.costPrice).toLocaleString()} so'm</td>
                    <td className="p-4 text-right font-bold text-green-600">
                      {(inc.quantity * Number(inc.costPrice)).toLocaleString()} so'm
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL OYNA (isLoading'dan tashqarida) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
             {/* ... form kodingiz o'zgarishsiz qoladi ... */}
             <h2 className="text-2xl font-bold mb-6">Omborga tovar qo'shish</h2>
             {/* Form qismi shu yerda */}
             <form onSubmit={handleSubmit} className="space-y-4">
               {/* Inputlar... */}
               <div>
                <label className="block text-sm text-gray-600 mb-1">Tovarni tanlang</label>
                <select 
                  required 
                  value={formData.productId} 
                  onChange={e => setFormData({...formData, productId: e.target.value})} 
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>-- Ro'yxatdan tanlang --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" required placeholder="Soni" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="border p-3 rounded-lg" />
                <input type="number" required placeholder="Narxi" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="border p-3 rounded-lg" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl">Bekor qilish</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl">Kirim qilish</button>
              </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incomes;