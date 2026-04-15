import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import RoleRoute from './components/RoleRoute';

import Layout from './components/Layout';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import CashSalePage from './pages/savdo/CashSalePage';
import SalesHistoryPage from './pages/savdo/SalesHistoryPage';
import Settings from './pages/Settings';
import Users from './pages/Users';
import ProductsPage from './pages/tovarlar/ProductsPage';

import CategoriesPage from './pages/references/CategoriesPage';
import ExpenseCategoriesPage from './pages/references/ExpenseCategoriesPage';
import SizesPage from './pages/references/SizesPage';
import CurrenciesPage from './pages/references/CurrenciesPage';

import SuppliersPage from './pages/taminotchilar/SuppliersPage';
import SupplierBalancesPage from './pages/taminotchilar/SupplierBalancesPage';
import SupplierInPage from './pages/ombor/SupplierInPage';

function PlaceholderPage({ title }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        Bu bo‘lim keyingi stepda to‘ldiriladi.
      </p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" reverseOrder={false} />

        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />

              {/* Kassa */}
              <Route path="cash/transfer-out" element={<PlaceholderPage title="Boshqa kassaga chiqim" />} />
              <Route path="cash/transfer-in" element={<PlaceholderPage title="Boshqa kassadan kirim" />} />
              <Route path="cash/expense" element={<PlaceholderPage title="Xarajatga pul chiqim" />} />
              <Route path="cash/transactions" element={<PlaceholderPage title="Barcha kassa amaliyotlari" />} />
              <Route path="cash/manage" element={<PlaceholderPage title="Kassalarni boshqarish" />} />
              <Route path="cash/balances" element={<PlaceholderPage title="Kassalar qoldig'i" />} />
              <Route path="cash/exchange" element={<PlaceholderPage title="Valyuta ayirboshlash" />} />

              {/* Savdo */}
              <Route path="sales/cash" element={<CashSalePage />} />
              <Route path="sales/credit" element={<PlaceholderPage title="Nasiya savdo" />} />
              <Route path="sales/history" element={<SalesHistoryPage />} />
              <Route path="sales/returns" element={<PlaceholderPage title="Tovar qaytarish" />} />

              {/* Ombor */}
              <Route path="warehouse/movements" element={<PlaceholderPage title="Barcha ombor amaliyotlari" />} />
              <Route path="warehouse/in-from-warehouse" element={<PlaceholderPage title="Boshqa ombordan kirim" />} />
              <Route path="warehouse/out-to-warehouse" element={<PlaceholderPage title="Boshqa omborga chiqim" />} />
              <Route path="warehouse/in-from-supplier" element={<SupplierInPage />} />
              <Route path="warehouse/return-to-supplier" element={<PlaceholderPage title="Taminotchiga tovar qaytarish" />} />
              <Route path="warehouse/in-from-customer" element={<PlaceholderPage title="Mijozdan tovar kirimi" />} />
              <Route path="warehouse/balances" element={<PlaceholderPage title="Tovar qoldig'i" />} />
              <Route path="warehouse/count" element={<PlaceholderPage title="Sanoq" />} />
              <Route path="warehouse/count-history" element={<PlaceholderPage title="Sanoq tarixi" />} />

              {/* Hisob-kitoblar */}
              <Route path="settlements/suppliers" element={<SuppliersPage />} />
              <Route path="settlements/supplier-balances" element={<SupplierBalancesPage />} />

              {/* Narx yorlig'i */}
              <Route path="labels/print" element={<PlaceholderPage title="Narx yorlig'i chop etish" />} />

              {/* Hisobotlar */}
              <Route path="reports" element={<PlaceholderPage title="Hisobotlar ro'yxati" />} />

              {/* References faqat direktor uchun */}
              <Route element={<RoleRoute roles={['DIRECTOR']} />}>
                <Route path="references/categories" element={<CategoriesPage />} />
                <Route path="references/expense-categories" element={<ExpenseCategoriesPage />} />
                <Route path="references/sizes" element={<SizesPage />} />
                <Route path="references/currencies" element={<CurrenciesPage />} />
                <Route path="references/products" element={<ProductsPage />} />
                <Route path="references/warehouses" element={<PlaceholderPage title="Omborlar" />} />
                <Route path="references/cashboxes" element={<PlaceholderPage title="Kassalar" />} />
                <Route path="references/suppliers" element={<SuppliersPage />} />
              </Route>

              {/* Sozlamalar */}
              <Route path="settings/profile" element={<Settings />} />
              <Route path="settings/employees" element={<Users />} />

              {/* Qisqa route'lar */}
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;