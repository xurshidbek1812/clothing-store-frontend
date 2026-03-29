import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, Plus, Minus } from 'lucide-react';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCashbox, setSelectedCashbox] = useState('');
  const [paymentType, setPaymentType] = useState('NAQD');
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const [prodRes, cashRes] = await Promise.all([
          fetch(`${API_URL}/api/products`, { headers }),
          fetch(`${API_URL}/api/cashboxes`, { headers })
        ]);
        if (prodRes.ok) {
            const prodData = await prodRes.json();
            // Agar backend pagination ishlatsa, prodData.products ni olamiz
            setProducts(Array.isArray(prodData) ? prodData : prodData.products);
        }
        if (cashRes.ok) setCashboxes(await cashRes.json());
      } catch (error) {
        console.error("Xatolik:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Savatchaga qo'shish
  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.productId !== id));

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => 
      item.productId === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSale = async () => {
    if (cart.length === 0) return alert("Savatcha bo'sh!");
    if (!selectedCashbox) return alert("Kassani tanlang!");

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          items: cart,
          paymentType,
          cashboxId: selectedCashbox,
          totalAmount
        })
      });

      if (response.ok) {
        alert("Sotuv muvaffaqiyatli amalga oshirildi! 🎉");
        setCart([]);
        setSearchQuery('');
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      alert("Xatolik yuz berdi!");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <Loader />;

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-6 p-4 overflow-hidden">
      
      {/* CHAP TOMON: Qidiruv va Tanlash */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Tovar nomi yoki artikul (SKU) bo'yicha qidirish..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 pb-4 custom-scrollbar">
          {filteredProducts.map(product => (
            <motion.div 
              whileHover={{ y: -4 }}
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-blue-500 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus size={20} />
              </div>
              <h3 className="font-bold text-gray-800 line-clamp-1">{product.name}</h3>
              <p className="text-xs text-gray-400 mb-2">SKU: {product.sku}</p>
              <div className="flex justify-between items-end">
                <span className="text-blue-600 font-black">{Number(product.price).toLocaleString()} <small>so'm</small></span>
                <span className={`text-[10px] px-2 py-1 rounded-md ${product.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  Ombor: {product.stock}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* O'NG TOMON: Savatcha va To'lov */}
      <div className="w-96 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" /> Savatcha
          </h2>
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{cart.length} ta</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.productId}
                className="bg-gray-50 p-3 rounded-2xl flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-gray-800 leading-tight">{item.name}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-gray-300 hover:text-red-500 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-white rounded-lg p-1 border border-gray-100">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-gray-100 rounded text-blue-600"><Minus size={14} /></button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-gray-100 rounded text-blue-600"><Plus size={14} /></button>
                  </div>
                  <span className="font-bold text-sm">{(item.price * item.quantity).toLocaleString()} <small>so'm</small></span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="text-sm mt-2">Savatcha bo'sh</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setPaymentType('NAQD')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-sm ${paymentType === 'NAQD' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-transparent bg-white text-gray-400'}`}
            >
              <Banknote size={18} /> Naqd
            </button>
            <button 
              onClick={() => setPaymentType('PLASTIK')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-sm ${paymentType === 'PLASTIK' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-transparent bg-white text-gray-400'}`}
            >
              <CreditCard size={18} /> Plastik
            </button>
          </div>

          <select 
            className="w-full p-3 rounded-xl border-none bg-white shadow-sm outline-none text-sm font-medium"
            value={selectedCashbox}
            onChange={(e) => setSelectedCashbox(e.target.value)}
          >
            <option value="">Kassani tanlang</option>
            {cashboxes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-gray-500 font-medium">Jami:</span>
            <span className="text-2xl font-black text-gray-900">{totalAmount.toLocaleString()} <small className="text-xs font-normal">so'm</small></span>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleSale}
            className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all transform active:scale-95 ${cart.length > 0 ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            SOTUVNI YAKUNLASH
          </button>
        </div>
      </div>

    </div>
  );
};

export default Sales;