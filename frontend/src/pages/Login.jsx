import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // serverga username ketadi
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(`Xush kelibsiz, ${data.user.name}! 🎉`);
        navigate('/');
      } else {
        toast.error(data.message || "Username yoki parol noto'g'ri");
      }
    } catch (err) {
      toast.error("Server bilan ulanib bo'lmadi! Internetni tekshiring.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* ORQA FONDAGI ANIMATSION NAQSHLAR */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none"
      />

      {/* SHISHASIMON KIRISH KARTOCHKASI */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-10 shadow-2xl shadow-black/50">
          
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30"
            >
              <Sparkles className="text-white" size={32} />
            </motion.div>
            <h2 className="text-3xl font-black text-white tracking-wider mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">IPHONE</span> HOUSE
            </h2>
            <p className="text-slate-400 text-sm font-medium">Boshqaruv paneliga xush kelibsiz</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Username inputi */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Foydalanuvchi nomi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="masalan: admin_123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-slate-900/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  required
                />
              </div>
            </div>

            {/* Parol inputi */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Maxfiy parol</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-slate-900/80 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  required
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isLoading}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <span>Tizimga kirish</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
            
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;