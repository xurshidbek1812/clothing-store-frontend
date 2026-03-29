import { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Wallet, Package, Receipt } from 'lucide-react';
import Loader from '../components/Loader';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/analytics/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setStats(await res.json());
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <Loader />;

  // Statik grafik ma'lumotlari (buni keyinchalik dinamik qilamiz)
  const chartData = [
    { name: 'Dush', savdo: 4000 },
    { name: 'Sesh', savdo: 3000 },
    { name: 'Chor', savdo: 2000 },
    { name: 'Pay', savdo: 2780 },
    { name: 'Juma', savdo: 1890 },
    { name: 'Shan', savdo: 2390 },
    { name: 'Yak', savdo: 3490 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <LayoutDashboard className="text-blue-600" size={32} />
          Asosiy ko'rsatkichlar
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Do'koningizning real vaqtdagi statistikasi</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Bugungi tushum" value={stats?.dailySales} icon={<TrendingUp />} color="blue" />
        <StatCard title="Kassadagi pul" value={stats?.totalCash} icon={<Wallet />} color="green" />
        <StatCard title="Bugungi xarajat" value={stats?.dailyExpenses} icon={<Receipt />} color="red" />
        <StatCard title="Ombor qoldig'i" value={stats?.stockCount} icon={<Package />} color="orange" unit="ta" />
      </div>

      {/* Grafik qismi */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-8">Savdo dinamikasi (Haftalik)</h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="savdo" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorPv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Yordamchi Card komponenti
const StatCard = ({ title, value, icon, color, unit = "so'm" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
      <div className={`w-12 h-12 ${colors[color]} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900">
        {unit === "so'm" ? Number(value || 0).toLocaleString() : value} 
        <small className="text-sm font-medium text-slate-400 ml-1">{unit}</small>
      </h3>
    </div>
  );
};

export default Dashboard;