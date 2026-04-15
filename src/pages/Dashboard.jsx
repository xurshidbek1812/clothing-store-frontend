import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  RefreshCcw,
  Wallet,
  Package,
  CreditCard,
  TrendingUp,
  Store,
  Clock3,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ title, value, subtitle, icon, tone = 'blue' }) {
  const toneMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900">
            {value}
          </h3>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        <div className={`rounded-xl border p-2 ${toneMap[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('uz-UZ').format(amount);
}

function formatDateTime(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  return date.toLocaleString('uz-UZ');
}

export default function Dashboard() {
  const { selectedStore } = useAuth();

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  const loadDashboard = async () => {
    if (!selectedStore?.id) return;

    setLoading(true);
    try {
      const [summaryRes, topProductsRes, recentSalesRes] = await Promise.all([
        apiFetch('/dashboard/summary'),
        apiFetch('/dashboard/top-products?limit=5&days=30'),
        apiFetch('/dashboard/recent-sales?limit=8'),
      ]);

      setSummary(summaryRes || null);
      setTopProducts(topProductsRes || []);
      setRecentSales(recentSalesRes || []);
    } catch (error) {
      toast.error(error.message || 'Dashboard yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStore?.id) {
      loadDashboard();
    } else {
      setLoading(false);
      setSummary(null);
      setTopProducts([]);
      setRecentSales([]);
    }
  }, [selectedStore?.id]);

  const cashboxSummaryText = useMemo(() => {
    if (!summary?.cashboxes?.length) return "Kassa ma'lumoti yo'q";

    return summary.cashboxes
      .map(
        (cashbox) =>
          `${cashbox.name}: ${formatMoney(cashbox.balance)} ${cashbox.currency?.code || ''}`
      )
      .join(' • ');
  }, [summary]);

  if (!selectedStore?.id) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Do‘kon tanlanmagan</p>
        <p className="mt-2 text-sm text-slate-500">
          Yuqoridan do‘kon tanlang, shunda bosh sahifa ma’lumotlari chiqadi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-white shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-300">Bugungi holat</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              {selectedStore?.name || "Do'kon tanlanmagan"}
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Savdo, kassa va ombor bo‘yicha umumiy ko‘rsatkichlar
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:opacity-70"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            Yangilash
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Bugungi savdo"
          value={loading ? '...' : formatMoney(summary?.today?.salesTotal)}
          subtitle={`${summary?.today?.salesCount || 0} ta savdo`}
          icon={<ShoppingCart size={18} />}
          tone="blue"
        />

        <StatCard
          title="Bugungi qaytarish"
          value={loading ? '...' : formatMoney(summary?.today?.returnsTotal)}
          subtitle={`${summary?.today?.returnsCount || 0} ta qaytarish`}
          icon={<RefreshCcw size={18} />}
          tone="rose"
        />

        <StatCard
          title="Sof tushum"
          value={loading ? '...' : formatMoney(summary?.today?.netCashflow)}
          subtitle="Bugungi kirim - qaytarish"
          icon={<TrendingUp size={18} />}
          tone="emerald"
        />

        <StatCard
          title="Nasiya qoldig'i"
          value={loading ? '...' : formatMoney(summary?.balances?.creditDebtTotal)}
          subtitle="To'lanmagan savdolar"
          icon={<CreditCard size={18} />}
          tone="violet"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3)">
        <StatCard
          title="Kassalar qoldig'i"
          value={loading ? '...' : formatMoney(summary?.balances?.cashboxesTotal)}
          subtitle={cashboxSummaryText}
          icon={<Wallet size={18} />}
          tone="amber"
        />

        <StatCard
          title="Ombordagi dona qoldiq"
          value={loading ? '...' : formatMoney(summary?.balances?.stockUnitsTotal)}
          subtitle="Qolgan umumiy birliklar"
          icon={<Package size={18} />}
          tone="slate"
        />

        <StatCard
          title="Faol store"
          value={selectedStore?.name || '-'}
          subtitle={selectedStore?.address || "Manzil ko'rsatilmagan"}
          icon={<Store size={18} />}
          tone="blue"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">
                Oxirgi savdolar
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Store bo‘yicha eng oxirgi amaliyotlar
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              <Clock3 size={14} className="mr-1 inline-block" />
              Yangi
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-2 font-semibold">Sana</th>
                  <th className="pb-2 font-semibold">Sotuvchi</th>
                  <th className="pb-2 font-semibold">Turi</th>
                  <th className="pb-2 font-semibold">Summa</th>
                  <th className="pb-2 font-semibold">To'langan</th>
                  <th className="pb-2 font-semibold">Items</th>
                </tr>
              </thead>

              <tbody>
                {!loading && recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-slate-50">
                      <td className="py-2.5 text-slate-700">{formatDateTime(sale.createdAt)}</td>
                      <td className="py-2.5 text-slate-700">{sale.seller?.fullName || '-'}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            sale.type === 'CASH'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-violet-50 text-violet-600'
                          }`}
                        >
                          {sale.type === 'CASH' ? 'Naqd' : sale.type}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-900">
                        {formatMoney(sale.totalAmount)}
                      </td>
                      <td className="py-2.5 text-slate-700">
                        {formatMoney(sale.paidAmount)}
                      </td>
                      <td className="py-2.5 text-slate-700">{sale._count?.items || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      {loading ? 'Yuklanmoqda...' : 'Hozircha savdolar yo‘q'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              Eng ko'p sotilganlar
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">Oxirgi 30 kun</p>
          </div>

          <div className="space-y-2.5">
            {!loading && topProducts.length > 0 ? (
              topProducts.map((item, index) => (
                <div
                  key={`${item.productVariantId}-${index}`}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.brand || 'Brand yo‘q'} • {item.size}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white px-2.5 py-1.5 text-right shadow-sm">
                      <p className="text-[10px] text-slate-400">Sotilgan</p>
                      <p className="text-sm font-black text-slate-900">{item.quantity}</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Jami summa</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500">
                {loading ? 'Yuklanmoqda...' : 'Hozircha top mahsulotlar yo‘q'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}