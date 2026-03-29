import { useState, useEffect } from 'react';
import Loader from '../components/Loader';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination uchun yangi state'lar
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [formData, setFormData] = useState({
    name: '', sku: '', price: '', color: '', size: ''
  });

  // 1. Bazadan tovarlarni yuklab olish (Sahifa raqami bilan)
  const fetchProducts = async (page = 1) => {
    setIsLoading(true); // So'rov boshlanganda loaderni yoqamiz
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/products?page=${page}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalItems(data.totalItems);
        }
    } catch (error) {
        console.error("Tovarlarni yuklashda xatolik:", error);
    } finally {
        // Xato bo'lsa ham, to'g'ri bo'lsa ham oxirida loaderni o'chiramiz
        setIsLoading(false); 
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  // 2. Yangi tovar qo'shish
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchProducts(1); // Yangi tovar qo'shilganda 1-sahifaga qaytamiz
        setIsModalOpen(false);
        setFormData({ name: '', sku: '', price: '', color: '', size: '' });
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
          <h1 className="text-3xl font-bold text-gray-800">Tovarlar ombori</h1>
          <p className="text-gray-500 mt-1">Jami tovarlar: {totalItems} ta</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition duration-200 shadow-sm flex items-center gap-2"
        >
          <span className="text-xl">+</span> Yangi tovar qo'shish
        </button>
      </div>

      {/* --- LOADER YOKI KONTENT SHU YERDA --- */}
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {/* Tovarlar jadvali */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Nomi</th>
                  <th className="p-4 font-medium">Artikul (SKU)</th>
                  <th className="p-4 font-medium">Rangi</th>
                  <th className="p-4 font-medium">O'lchami</th>
                  <th className="p-4 font-medium text-right">Narxi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400">Hozircha tovarlar yo'q...</td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="p-4 font-medium text-gray-900">{p.name}</td>
                      <td className="p-4 text-gray-500">{p.sku}</td>
                      <td className="p-4 text-gray-500">{p.color || '-'}</td>
                      <td className="p-4 text-gray-500">{p.size || '-'}</td>
                      <td className="p-4 text-right font-bold text-gray-900">{Number(p.price).toLocaleString()} so'm</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                Oldingi
              </button>
              
              <span className="text-gray-600 font-medium">
                Sahifa {currentPage} / {totalPages}
              </span>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                Keyingi
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Yangi tovar qo'shish MODAL oynasi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Yangi kiyim qo'shish</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nomi (masalan: Qishki kurtka)</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Artikul / Shtrix kod</label>
                  <input type="text" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Sotish narxi (so'm)</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rangi</label>
                  <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">O'lchami (S, M, L...)</label>
                  <input type="text" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition">Bekor qilish</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;