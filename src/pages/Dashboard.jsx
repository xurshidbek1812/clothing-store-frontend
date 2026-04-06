import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

function Card({ title, value, subtitle }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, topRes, recentRes] = await Promise.all([
        apiFetch('/dashboard/summary'),
        apiFetch('/dashboard/top-products?limit=5&days=30'),
        apiFetch('/dashboard/recent-sales?limit=8'),
      ]);

      setSummary(summaryRes);
      setTopProducts(topRes);
      setRecentSales(recentRes);
    } catch (error) {
      toast.error(error.message || 'Dashboard yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="rounded-3xl bg-white p-6 shadow-sm">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Bugungi savdo" value={summary?.today?.salesTotal || 0} />
        <Card title="Bugungi qaytarish" value={summary?.today?.returnsTotal || 0} />
        <Card title="Sof tushum" value={summary?.today?.netCashflow || 0} />
        <Card title="Nasiya qarzi" value={summary?.balances?.creditDebtTotal || 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Oxirgi savdolar</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-3">Sana</th>
                  <th className="pb-3">Sotuvchi</th>
                  <th className="pb-3">Turi</th>
                  <th className="pb-3">Summa</th>
                  <th className="pb-3">Item</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="border-t border-slate-100">
                    <td className="py-3">{new Date(sale.createdAt).toLocaleString()}</td>
                    <td className="py-3">{sale.seller?.fullName}</td>
                    <td className="py-3">{sale.type}</td>
                    <td className="py-3">{sale.totalAmount}</td>
                    <td className="py-3">{sale._count?.items || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Eng ko‘p sotilganlar</h3>
          <div className="mt-4 space-y-3">
            {topProducts.map((item) => (
              <div
                key={`${item.productVariantId}`}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <p className="font-semibold text-slate-900">{item.productName}</p>
                <p className="text-sm text-slate-500">
                  {item.brand || 'Brand yo‘q'} • {item.size}
                </p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>Sotilgan: {item.quantity}</span>
                  <span>Summa: {item.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}