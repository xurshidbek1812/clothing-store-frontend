import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Search, Wallet } from 'lucide-react';
import { apiFetch } from '../../lib/api';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

export default function CashboxesBalancePage() {
  const [loading, setLoading] = useState(true);
  const [cashboxes, setCashboxes] = useState([]);
  const [search, setSearch] = useState('');

  const loadCashboxes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/cashboxes');
      setCashboxes(Array.isArray(res) ? res : []);
    } catch (error) {
      toast.error(error.message || 'Kassalar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashboxes();
  }, []);

  const filteredCashboxes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cashboxes;

    return cashboxes.filter((cashbox) => {
      const name = String(cashbox.name || '').toLowerCase();
      const currencyCode = String(cashbox.currency?.code || '').toLowerCase();
      const currencyName = String(cashbox.currency?.name || '').toLowerCase();

      return (
        name.includes(q) ||
        currencyCode.includes(q) ||
        currencyName.includes(q)
      );
    });
  }, [cashboxes, search]);

  const totalsByCurrency = useMemo(() => {
    const map = new Map();

    for (const cashbox of filteredCashboxes) {
      const code = cashbox.currency?.code || 'N/A';
      const current = map.get(code) || 0;
      map.set(code, current + Number(cashbox.balance || 0));
    }

    return Array.from(map.entries()).map(([code, total]) => ({
      code,
      total,
    }));
  }, [filteredCashboxes]);

  const activeCount = useMemo(
    () => filteredCashboxes.filter((item) => item.isActive).length,
    [filteredCashboxes]
  );

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Wallet size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Kassalar qoldig‘i
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Barcha kassalardagi mavjud pullar
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kassa yoki valyuta bo‘yicha qidirish"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-sm text-slate-500">
            Jami kassalar: {filteredCashboxes.length} ta
          </div>
        </div>

        {totalsByCurrency.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {totalsByCurrency.map((item) => (
              <div
                key={item.code}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-xs text-slate-400">Jami balans</div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {money(item.total)} {item.code}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-400">Faol kassalar</div>
              <div className="mt-1 text-lg font-black text-slate-900">
                {activeCount} ta
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Yuklanmoqda...
            </div>
          </div>
        ) : filteredCashboxes.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-sm font-semibold text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3">Kassa</th>
                  <th className="border-b border-slate-200 px-4 py-3">Valyuta</th>
                  <th className="border-b border-slate-200 px-4 py-3">Balans</th>
                  <th className="border-b border-slate-200 px-4 py-3">Holati</th>
                </tr>
              </thead>

              <tbody>
                {filteredCashboxes.map((cashbox) => (
                  <tr key={cashbox.id} className="text-sm text-slate-700">
                    <td className="border-b border-slate-100 px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {cashbox.name}
                      </div>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {cashbox.currency?.code || '-'}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {cashbox.currency?.name || '-'}
                      </div>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4">
                      <div className="text-base font-black text-slate-900">
                        {money(cashbox.balance)} {cashbox.currency?.code || ''}
                      </div>
                    </td>

                    <td className="border-b border-slate-100 px-4 py-4">
                      {cashbox.isActive ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Nofaol
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
            Kassa topilmadi
          </div>
        )}
      </section>
    </div>
  );
}