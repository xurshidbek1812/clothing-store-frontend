import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import RoleRoute from './components/RoleRoute';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import CashboxTransfers from './pages/kassalar/CashboxTransferPage';
import OutToOtherCashbox from './pages/kassalar/OutToOtherCashboxPage';
import InFromOtherCashbox from './pages/kassalar/InFromOtherCashboxPage';
import Expenses from './pages/kassalar/ExpensesPage';
import CashboxesBalance from './pages/kassalar/CashboxesBalancePage';
import CashExchange from './pages/kassalar/CashExchangePage';

import CashSalePage from './pages/savdo/CashSalePage';
import CreditSalePage from './pages/savdo/CreditSalePage';
import CustomerBalancesPage from './pages/savdo/CustomerBalancesPage';
import SalesHistoryPage from './pages/savdo/SalesHistoryPage';
import SaleReturnsPage from './pages/savdo/SaleReturnsPage';

import Users from './pages/settings/Users';
import ProfilePage from './pages/settings/ProfilePage';
import StoresPage from './pages/settings/StoresPage';
import ProductsPage from './pages/tovarlar/ProductsPage';

import PrintLabelPage from './pages/labels/PrintLabelsPage'

import CategoriesPage from './pages/references/CategoriesPage';
import ExpenseCategoriesPage from './pages/references/ExpenseCategoriesPage';
import SizesPage from './pages/references/SizesPage';
import CurrenciesPage from './pages/references/CurrenciesPage';
import WarehousesPage from './pages/references/WarehousesPage';
import CashboxesPage from './pages/references/CashboxesPage';

import SuppliersPage from './pages/taminotchilar/SuppliersPage';
import SupplierBalancesPage from './pages/taminotchilar/SupplierBalancesPage';

import InFromOtherStore from './pages/ombor/InFromOtherStorePage';
import OutToOtherStore from './pages/ombor/OutToOtherStorePage';
import SupplierInPage from './pages/ombor/SupplierInPage';
import SupplierReturn from './pages/ombor/SupplierReturnsPage';
import WarehouseTransfersPage from './pages/ombor/WarehouseTransfersPage';
import StockBalancesPage from './pages/ombor/StockBalancesPage';
import Inventory from './pages/ombor/InventoryCountPage';
import InventoryHistory from './pages/ombor/InventoryHistoryPage';


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
              <Route path="cash/transfer-out" element={<OutToOtherCashbox />} />
              <Route path="cash/transfer-in" element={<InFromOtherCashbox />} />
              <Route path="cash/expense" element={<Expenses />} />
              <Route path="cash/transactions" element={<CashboxTransfers />} />
              <Route path="cash/balances" element={<CashboxesBalance />} />
              <Route path="cash/exchange" element={<CashExchange />} />

              {/* Savdo */}
              <Route path="sales/cash" element={<CashSalePage />} />
              <Route path="sales/credit" element={<CreditSalePage />} />
              <Route path="customers/balances" element={<CustomerBalancesPage />} />
              <Route path="sales/history" element={<SalesHistoryPage />} />
              <Route path="sales/returns" element={<SaleReturnsPage />} />

              {/* Ombor */}
              <Route path="warehouse/movements" element={<WarehouseTransfersPage />} />
              <Route path="warehouse/in-from-warehouse" element={<InFromOtherStore />} />
              <Route path="warehouse/out-to-warehouse" element={<OutToOtherStore />} />
              <Route path="warehouse/in-from-supplier" element={<SupplierInPage />} />
              <Route path="warehouse/return-to-supplier" element={<SupplierReturn />} />
              <Route path="warehouse/balances" element={<StockBalancesPage />} />
              <Route path="warehouse/count" element={<Inventory />} />
              <Route path="warehouse/count-history" element={<InventoryHistory />} />

              {/* Hisob-kitoblar */}
              <Route path="settlements/suppliers" element={<SuppliersPage />} />
              <Route path="settlements/supplier-balances" element={<SupplierBalancesPage />} />

              {/* Narx yorlig'i */}
              <Route path="labels/print" element={<PrintLabelPage />} />

              {/* Hisobotlar */}
              <Route path="reports" element={<PlaceholderPage title="Hisobotlar ro'yxati" />} />

              {/* References faqat direktor uchun */}
              <Route element={<RoleRoute roles={['DIRECTOR']} />}>
                <Route path="references/categories" element={<CategoriesPage />} />
                <Route path="references/expense-categories" element={<ExpenseCategoriesPage />} />
                <Route path="references/sizes" element={<SizesPage />} />
                <Route path="references/currencies" element={<CurrenciesPage />} />
                <Route path="references/products" element={<ProductsPage />} />
                <Route path="references/warehouses" element={<WarehousesPage />} />
                <Route path="references/cashboxes" element={<CashboxesPage />} />
                <Route path="references/suppliers" element={<SuppliersPage />} />
              </Route>

              {/* Sozlamalar */}
              <Route path="settings/employees" element={<Users />} />
              <Route path="settings/shops" element={<StoresPage />} />
              <Route path="settings/profile" element={<ProfilePage />} />

              {/* Qisqa route'lar */}
              <Route path="users" element={<Users />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;