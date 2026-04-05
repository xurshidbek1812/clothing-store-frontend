import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Asosiy qismlar
import Layout from './components/Layout';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Pos from './pages/pos/Pos';

import { Toaster } from 'react-hot-toast';

// ==========================================
// VAQTINCHALIK SAHIFALAR (Keyin har birini alohida yozamiz)
// ==========================================
const Dashboard = () => <div className="p-8 text-3xl font-black text-slate-800">📊 Bosh sahifa (Tez kunda...)</div>;
const Credits = () => <div className="p-8 text-3xl font-black text-slate-800">👥 Nasiya savdolar ro'yxati</div>;
const Returns = () => <div className="p-8 text-3xl font-black text-slate-800">🔄 Tovar qaytarish oynasi</div>;

const InventoryIn = () => <div className="p-8 text-3xl font-black text-slate-800">📦 Taminotchidan tovar kirimi</div>;
const InventoryStock = () => <div className="p-8 text-3xl font-black text-slate-800">📋 Ombor qoldig'i (Barcha tovarlar)</div>;
const Transfers = () => <div className="p-8 text-3xl font-black text-slate-800">🚚 Omborlararo o'tkazmalar</div>;

const Finance = () => <div className="p-8 text-3xl font-black text-slate-800">💵 Kassa amaliyotlari (Kirim/Chiqim)</div>;
const Currency = () => <div className="p-8 text-3xl font-black text-slate-800">💱 Valyutalar va Kurslarni boshqarish</div>;

const PrintLabels = () => <div className="p-8 text-3xl font-black text-slate-800">🖨️ Narx yorliqlari (Shtrixkod) chop etish</div>;
const Reports = () => <div className="p-8 text-3xl font-black text-slate-800">📈 Tahliliy Hisobotlar</div>;
const Catalogs = () => <div className="p-8 text-3xl font-black text-slate-800">📚 Kataloglar (Tovarlar, Kategoriyalar)</div>;

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* 1. OCHIQ YO'L (Faqat Login uchun) */}
        <Route path="/login" element={<Login />} />

        {/* 2. HIMOYALANGAN YO'LLAR (Layout qobig'i ichida ochiladi) */}
        <Route path="/" element={<Layout />}>
          
          {/* Asosiy sahifa (Layout ni o'ziga kirsangiz shu chiqadi) */}
          <Route index element={<Dashboard />} />
          
          {/* Savdo */}
          <Route path="pos" element={<Pos />} />
          <Route path="credits" element={<Credits />} />
          <Route path="returns" element={<Returns />} />
          
          {/* Ombor */}
          <Route path="inventory/in" element={<InventoryIn />} />
          <Route path="inventory/stock" element={<InventoryStock />} />
          <Route path="inventory/transfers" element={<Transfers />} />
          
          {/* Moliya */}
          <Route path="finance" element={<Finance />} />
          <Route path="finance/currency" element={<Currency />} />
          
          {/* Boshqalar */}
          <Route path="print-labels" element={<PrintLabels />} />
          <Route path="reports" element={<Reports />} />
          <Route path="catalogs" element={<Catalogs />} />
          
          {/* Sozlamalar (Biz buning kodini to'liq yozganmiz) */}
          <Route path="settings" element={<Settings />} />
          
        </Route>

        {/* 3. XATO YO'L (Boshqa yozuv yozib kirsa, Asosiyga otib yuboradi) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;