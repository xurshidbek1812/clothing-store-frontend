import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, Sparkles, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showStoreModal, setShowStoreModal] = useState(false);
  const [userStores, setUserStores] = useState([]);
  const [tempLoginData, setTempLoginData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const stores = data?.user?.stores || [];

      if (!stores.length) {
        toast.error("Sizga hech qanday do'kon biriktirilmagan");
        return;
      }

      if (stores.length === 1) {
        login({
          token: data.token,
          user: data.user,
        });

        toast.success(`Xush kelibsiz, ${data.user.fullName || ''}!`);
        navigate('/', { replace: true });
        return;
      }

      setUserStores(stores);
      setTempLoginData(data);
      setShowStoreModal(true);
    } catch (error) {
      toast.error(error.message || "Username yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  const finishLogin = (selectedStore) => {
    if (!tempLoginData?.token || !tempLoginData?.user) {
      toast.error("Login ma'lumotlari topilmadi");
      return;
    }

    const normalizedUser = {
      ...tempLoginData.user,
      stores: tempLoginData.user.stores || [],
    };

    login({
      token: tempLoginData.token,
      user: normalizedUser,
    });

    localStorage.setItem(
      'clothing_shop_auth',
      JSON.stringify({
        token: tempLoginData.token,
        user: normalizedUser,
        activeStoreId: selectedStore.id,
      })
    );

    localStorage.setItem('clothing_shop_last_activity', String(Date.now()));

    toast.success(`Xush kelibsiz, ${normalizedUser.fullName || ''}!`);
    setShowStoreModal(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f172a] p-4">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-[10%] -top-[20%] h-[500px] w-[500px] rounded-full bg-blue-600/30 blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[150px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-[2.5rem] border border-white/20 bg-white/10 p-10 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30"
            >
              <Sparkles className="text-white" size={32} />
            </motion.div>

            <h2 className="mb-2 text-3xl font-black tracking-wider text-white">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                IPHONE
              </span>{' '}
              HOUSE
            </h2>
            <p className="text-sm font-medium text-slate-400">
              Boshqaruv paneliga xush kelibsiz
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-2 block pl-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                Foydalanuvchi nomi
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <User
                    size={18}
                    className="text-slate-400 transition-colors group-focus-within:text-blue-400"
                  />
                </div>
                <input
                  type="text"
                  placeholder="login"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700/50 bg-slate-900/50 py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-blue-500/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block pl-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                Maxfiy parol
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock
                    size={18}
                    className="text-slate-400 transition-colors group-focus-within:text-blue-400"
                  />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700/50 bg-slate-900/50 py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-blue-500/10"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 py-4 font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-600/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <span>Tizimga kirish</span>
                  <ArrowRight
                    size={20}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>

      <AnimatePresence>
        {showStoreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <Store size={32} className="text-blue-600" />
              </div>

              <h3 className="mb-2 text-center text-2xl font-black text-slate-800">
                Do'konni tanlang
              </h3>
              <p className="mb-8 text-center font-medium text-slate-500">
                Sizga bir nechta filiallarga ruxsat berilgan. Hozir qaysi birida ishlaysiz?
              </p>

              <div className="custom-scrollbar max-h-[60vh] space-y-3 overflow-y-auto pr-2">
                {userStores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => finishLogin(store)}
                    className="group flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-blue-700">
                        {store.name}
                      </h4>
                      {store.address ? (
                        <p className="mt-1 text-xs text-slate-400">{store.address}</p>
                      ) : null}
                    </div>
                    <ArrowRight
                      size={18}
                      className="transform text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-600"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;