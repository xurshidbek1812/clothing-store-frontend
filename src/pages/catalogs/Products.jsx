import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, X, Barcode } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Tizimdan joriy do'konni avtomatik olish
  const [currentStoreId, setCurrentStoreId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '', 
    brand: '',
    gender: 'Unisex',
    season: 'Kuz/Qish',
    storeId: '',
    sizes: [{ sizeLabel: '', barcode: '' }]
  });

  // 1. Joriy do'konni aniqlash va ma'lumotlarni tortish
  const fetchData = useCallback(async (storeId) => {
    if (!storeId) return;
    
    try {
      // Tovarlarni olish
      const prodRes = await fetch(`http://localhost:5000/api/products?storeId=${storeId}`);
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.data);

      // Kategoriyalarni olish
      const catRes = await fetch(`http://localhost:5000/api/products/categories?storeId=${storeId}`);
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.data);
        
        // Formani joriy do'kon va birinchi kategoriya bilan yangilash
        setFormData(prev => ({ 
          ...prev, 
          storeId: storeId,
          categoryId: catData.data.length > 0 ? catData.data[0].id : '' 
        }));
      }
    } catch (error) {
      console.error("Ma'lumotlarni tortishda xatolik:", error);
    }
  }, []);

  // 2. Sahifa yuklanganda LocalStorage dan do'konni o'qish
  useEffect(() => {
    const storeData = localStorage.getItem('currentStore');
    if (storeData) {
      const parsedStore = JSON.parse(storeData);
      setCurrentStoreId(parsedStore.id);
      fetchData(parsedStore.id);
    }
  }, [fetchData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index][field] = value;
    setFormData({ ...formData, sizes: newSizes });
  };

  const addSizeRow = () => {
    setFormData({ ...formData, sizes: [...formData.sizes, { sizeLabel: '', barcode: '' }] });
  };

  const removeSizeRow = (index) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: newSizes });
  };

  // Backendga saqlash
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentStoreId) return alert("Do'kon tanlanmagan!");
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchData(currentStoreId); // Jadvalni joriy do'kon bo'yicha yangilash
        
        // Formani tozalash, lekin do'kon va kategoriyani saqlab qolish
        setFormData(prev => ({
          ...prev, 
          name: '', 
          brand: '', 
          sizes: [{ sizeLabel: '', barcode: '' }]
        }));
      } else {
        alert("Xatolik: " + result.message);
      }
    } catch (error) {
      alert("Server bilan ulanishda xato!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Katalog</h1>
          <p className="text-sm text-slate-500 font-medium">Barcha kiyimlar va ularning razmerlari</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={!currentStoreId || categories.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            title={categories.length === 0 ? "Oldin kategoriya qo'shishingiz kerak" : "Yangi tovar qo'shish"}
          >
            <Plus size={20} /> Yangi tovar
          </button>
        </div>
      </div>

      {/* Jadval */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-bold">Tovar nomi</th>
                <th className="p-4 font-bold">Kategoriya / Brend</th>
                <th className="p-4 font-bold">Razmerlar (Qoldiq)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-400">
                    {categories.length === 0 ? "Ushbu filialda kategoriyalar yo'q. Oldin kategoriya qo'shing." : "Tovarlar yo'q."}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{product.name}</td>
                    <td className="p-4 text-sm text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded-md mr-2">{product.category?.name}</span>
                      <span className="font-semibold">{product.brand}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {product.sizes?.map(size => (
                          <div key={size.id} className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded-md flex items-center gap-1 font-semibold">
                            {size.sizeLabel} 
                            <span className={`px-1.5 rounded-sm ${size.stock > 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                              {size.stock}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">Yangi tovar qo'shish</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">TOVAR NOMI</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border rounded-lg" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">KATEGORIYA</label>
                  <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border rounded-lg">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">BREND</label>
                  <input name="brand" value={formData.brand} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border rounded-lg" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2"><Barcode size={18}/> Razmerlar</h3>
                  <button type="button" onClick={addSizeRow} className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">+ Qo'shish</button>
                </div>

                {formData.sizes.map((size, index) => (
                  <div key={index} className="flex gap-3 items-center mb-2">
                    <input required placeholder="Razmer (M, 42...)" value={size.sizeLabel} onChange={(e) => handleSizeChange(index, 'sizeLabel', e.target.value)} className="w-1/3 px-4 py-2 border rounded-lg" />
                    <input required placeholder="Shtrix-kod (Skanerlang)" value={size.barcode} onChange={(e) => handleSizeChange(index, 'barcode', e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" />
                    {formData.sizes.length > 1 && (
                      <button type="button" onClick={() => removeSizeRow(index)} className="text-red-500 p-2"><Trash2 size={20}/></button>
                    )}
                  </div>
                ))}
              </div>
            </form>

            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 font-bold text-slate-600">Bekor qilish</button>
              <button onClick={handleSubmit} disabled={isLoading} className="px-6 py-2 font-bold bg-blue-600 text-white rounded-lg">
                {isLoading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;