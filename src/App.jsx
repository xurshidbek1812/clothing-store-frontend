import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/Sidebar';
import AnimatedPage from './components/AnimatedPage';
import Loader from './components/Loader'; // Kutib turish uchun o'zimizning chiroyli loader

// SAHIFALARNI LAZY (Yalqov) USULDA YUKLAYMIZ
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Products = lazy(() => import('./pages/Products'));
const Incomes = lazy(() => import('./pages/Incomes'));
const Cashboxes = lazy(() => import('./pages/Cashboxes'));
const Transfers = lazy(() => import('./pages/Transfers'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Sales = lazy(() => import('./pages/Sales'));
const SalesHistory = lazy(() => import('./pages/SalesHistory'));
const Settings = lazy(() => import('./pages/Settings'));

function MainLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="font-sans text-gray-900 bg-pattern min-h-screen flex overflow-hidden">
      {!isLoginPage && <Sidebar />}
      
      <div className={`flex-1 h-screen overflow-y-auto ${!isLoginPage ? 'ml-64' : ''}`}>
        <AnimatePresence mode="wait">
          {/* Suspense: Sahifa yuklanguncha Loaderni aylantirib turadi */}
          <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader /></div>}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
              <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
              <Route path="/products" element={<AnimatedPage><Products /></AnimatedPage>} />
              <Route path="/incomes" element={<AnimatedPage><Incomes /></AnimatedPage>} />
              <Route path="/cashboxes" element={<AnimatedPage><Cashboxes /></AnimatedPage>} />
              <Route path="/transfers" element={<AnimatedPage><Transfers /></AnimatedPage>} />
              <Route path="/expenses" element={<AnimatedPage><Expenses /></AnimatedPage>} />
              <Route path="/sales" element={<AnimatedPage><Sales /></AnimatedPage>} />
              <Route path="/sales-history" element={<AnimatedPage><SalesHistory /></AnimatedPage>} />
              <Route path="/settings" element={<AnimatedPage><Settings /></AnimatedPage>} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      {/* Toast xabarlari chiqadigan joyni sozlaymiz */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '16px',
            padding: '16px',
            fontWeight: 'bold'
          },
          success: {
            style: { background: '#10b981', color: 'white' },
            iconTheme: { primary: 'white', secondary: '#10b981' },
          },
          error: {
            style: { background: '#ef4444', color: 'white' },
            iconTheme: { primary: 'white', secondary: '#ef4444' },
          },
        }} 
      />
      <MainLayout />
    </Router>
  );
}

export default App;