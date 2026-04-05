import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, 
  CreditCard, Banknote, Barcode, ChevronLeft, ChevronRight, Percent
} from 'lucide-react';

// 1. KENGAYTIRILGAN TOVARLAR BAZASI (Backend kelguncha)
const DUMMY_DB = [
  { id: 1, barcode: "111111", name: "iPhone 15 Pro Max 256GB", price: 1250, category: "Telefonlar", stock: 10 },
  { id: 2, barcode: "222222", name: "iPhone 14 Pro 128GB", price: 950, category: "Telefonlar", stock: 5 },
  { id: 3, barcode: "333333", name: "AirPods Pro 2", price: 240, category: "Aksessuarlar", stock: 20 },
  { id: 4, barcode: "444444", name: "Apple Watch Series 9", price: 450, category: "Soatlar", stock: 8 },
  { id: 5, barcode: "555555", name: "MagSafe Charger", price: 45, category: "Aksessuarlar", stock: 50 },
  { id: 6, barcode: "666666", name: "MacBook Air M2 256GB", price: 1100, category: "Noutbuklar", stock: 3 },
  { id: 7, barcode: "777777", name: "iPad Pro 11-inch", price: 800, category: "Planshetlar", stock: 6 },
  { id: 8, barcode: "888888", name: "AirTag (4 pack)", price: 99, category: "Aksessuarlar", stock: 15 },
  { id: 9, barcode: "999999", name: "iPhone 13 128GB", price: 600, category: "Telefonlar", stock: 12 },
  { id: 10, barcode: "101010", name: "MacBook Pro 14 M3", price: 1600, category: "Noutbuklar", stock: 4 },
];

const CATEGORIES = ["Barchasi", "Telefonlar", "Aksessuarlar", "Soatlar", "Noutbuklar", "Planshetlar"];
const ITEMS_PER_PAGE = 8; // Bir sahifada nechta tovar chiqishi

const Pos = () => {
  const [activeCategory, setActiveCategory] = useState("Barchasi");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  
  // Paginatsiya state-lari
  const [currentPage, setCurrentPage] = useState(1);

  // Chegirma/Ustama state-i (Musbat = Chegirma, Manfiy = Ustama)
  const [discountAmount, setDiscountAmount] = useState(0);

  // 2. QIDIRUV VA FILTR LOKIGASI
  const filteredProducts = useMemo(() => {
    return DUMMY_DB.filter(product => {
      const matchesCategory = activeCategory === "Barchasi" || product.category === activeCategory;
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.barcode.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  // 3. PAGINATSIYA LOGIKASI
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Agar filtr/qidiruv o'zgarsa, doim 1-sahifaga qaytish
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  // 4. SHTRIX-KOD ORQALI AVTOMATIK QO'SHISH (Skaner ishlatganda 'Enter' bosiladi)
  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      const foundProduct = DUMMY_DB.find(p => p.barcode === searchQuery.trim());
      if (foundProduct) {
        addToCart(foundProduct);
        setSearchQuery(""); // Qo'shilgach qidiruvni tozalash (keyingi tovar uchun)
      } else {
        alert("Bunday shtrix-kodli tovar topilmadi!");
      }
    }
  };

  // 5. SAVAT LOGIKASI
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        // Ombor qoldig'idan oshib ketmasligini tekshirish
        if (existingItem.qty >= product.stock) {
          alert(`Omborda faqat ${product.stock} ta bor!`);
          return prevCart;
        }
        return prevCart.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, amount) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.qty + amount;
          if (newQty > item.stock) {
            alert(`Omborda bundan ortiq yo'q!`);
            return item;
          }
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      });
    });
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // TOZALASH (Sotuvdan keyin)
  const handleCheckout = (type) => {
    alert(`Savdo ${type} orqali yakunlandi! Jami: $${finalTotal}`);
    setCart([]);
    setDiscountAmount(0);
    setSearchQuery("");
  };

  // 6. HISOB-KITOB LOGIKASI
  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Final hisoblash: Subtotal - Discount (Agar discount manfiy bo'lsa ustama bo'lib qo'shiladi)
  const finalTotal = Math.max(0, subTotal - discountAmount); // Summa minusga tushib ketmasligi uchun Math.max qo'yildi

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6">
      
      {/* ================= CHAP TOMON (TOVARLAR VA QIDIRUV) ================= */}
      <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200 relative">
        
        {/* Qidiruv va Filtr */}
        <div className="p-4 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="relative mb-4">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              autoFocus
              placeholder="Shtrix-kod skanerlang yoki nomini yozing (Enter bosing)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleBarcodeScan} // Shtrix-kod skaneri siri shu yerda
              className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-transparent rounded-xl focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium text-slate-700 transition-all outline-none"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tovarlar Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {currentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Tovarlar topilmadi...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentProducts.map(product => {
                // Savatdagi miqdorni topish (Stock bilan solishtirish uchun)
                const cartItem = cart.find(c => c.id === product.id);
                const isOutOfStock = cartItem && cartItem.qty >= product.stock;

                return (
                  <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={`flex flex-col bg-white rounded-2xl overflow-hidden border transition-all text-left relative ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-200'
                    }`}
                  >
                    <div className="h-24 bg-slate-100 flex flex-col items-center justify-center p-4 relative">
                      <span className="text-4xl">📱</span>
                      <span className="absolute top-2 right-2 bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 shadow-sm">
                        Qoldiq: {product.stock}
                      </span>
                    </div>
                    <div className="p-3 flex flex-col flex-1 bg-white">
                      <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{product.barcode}</span>
                      <span className="font-bold text-slate-700 text-sm leading-tight mb-2 flex-1">{product.name}</span>
                      <span className="font-black text-blue-600 text-lg">${product.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Paginatsiya qismi (Faqat sahifa 1 dan ko'p bo'lsa chiqadi) */}
        {totalPages > 1 && (
          <div className="bg-white border-t border-slate-200 p-3 flex items-center justify-between z-10">
            <span className="text-sm font-medium text-slate-500">
              Jami: {filteredProducts.length} ta tovar
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= O'NG TOMON (SAVAT / CHEK) ================= */}
      <div className="w-[420px] bg-white flex flex-col shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
        
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-blue-600" />
            <h2 className="font-bold text-lg text-slate-800">Joriy chek</h2>
          </div>
          <button 
            onClick={() => {setCart([]); setDiscountAmount(0)}}
            disabled={cart.length === 0}
            className="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            Tozalash
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p className="font-medium text-center">Savat bo'sh.<br/>Tovarni qidiring yoki skanerlang.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex flex-col p-3 border border-slate-200 bg-white shadow-sm rounded-xl relative group">
                <div className="flex justify-between items-start mb-2 pr-6">
                  <span className="font-bold text-slate-700 text-sm leading-tight">{item.name}</span>
                </div>
                
                {/* O'chirish tugmasi hover bo'lganda chiqadi */}
                <button 
                  onClick={() => removeFromCart(item.id)} 
                  className="absolute top-3 right-3 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold">{item.qty} x ${item.price}</span>
                    <span className="font-black text-slate-800 text-lg">${item.price * item.qty}</span>
                  </div>
                  
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1.5 hover:bg-white hover:shadow-sm text-slate-600 rounded-md transition-all">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-slate-800">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1.5 hover:bg-white hover:shadow-sm text-slate-600 rounded-md transition-all">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ================= TO'LOV VA CHEGIRMA QISMI ================= */}
        <div className="p-5 border-t border-slate-200 bg-white">
          
          {/* Subtotal */}
          <div className="flex justify-between items-center mb-3 text-slate-500">
            <span className="font-semibold text-sm">Oraliq summa:</span>
            <span className="font-bold">${subTotal}</span>
          </div>

          {/* Chegirma / Ustama Input */}
          <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-600">
              <Percent size={16} />
              <span className="font-bold text-sm leading-tight">Chegirma (+)<br/>Ustama (-)</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input 
                type="number"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                placeholder="0"
                className="w-24 pl-7 pr-3 py-2 text-right bg-white border border-slate-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-bold text-slate-800 outline-none transition-all"
              />
            </div>
          </div>

          {/* Final Total */}
          <div className="flex justify-between items-end mb-5">
            <span className="text-slate-800 font-black text-lg">Jami To'lov:</span>
            <span className="text-4xl font-black text-blue-600">${finalTotal}</span>
          </div>

          {/* Pay Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleCheckout("Terminal")}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-2 py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <CreditCard size={20} />
              Terminal
            </button>
            <button 
              onClick={() => handleCheckout("Naqd")}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20 active:scale-95"
            >
              <Banknote size={20} />
              Naqd
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pos;