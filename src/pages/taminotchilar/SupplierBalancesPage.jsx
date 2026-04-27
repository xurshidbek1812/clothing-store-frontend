import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { WalletCards, Eye, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import SupplierLedgerDrawer from './components/SupplierLedgerDrawer';

export default function SupplierBalancesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const loadBalances = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/supplier-payments/balances');
      setItems(res || []);
    } catch (error) {
      toast.error(error.message || 'Taminotchi balanslari yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const openLedger = async (supplierId) => {
    setSelectedSupplierId(supplierId);
    setDrawerOpen(true);
    setLedgerLoading(true);

    try {
      const res = await apiFetch(`/supplier-payments/${supplierId}/history`);
      setLedgerData(res);
    } catch (error) {
      toast.error(error.message || 'Tafsilot yuklanmadi');
      setDrawerOpen(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  const refreshLedger = async () => {
    if (!selectedSupplierId) return;

    try {
      const res = await apiFetch(`/supplier-payments/${selectedSupplierId}/history`);
      setLedgerData(res);
      await loadBalances();
    } catch (error) {
      toast.error(error.message || 'Yangilashda xatolik');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <WalletCards size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Taminotchilar hisob-kitob
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Qarzlar, to‘lovlar va qolgan balanslar
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Yuklanmoqda...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 font-semibold">Taminotchi</th>
                  <th className="pb-3 font-semibold">Telefon</th>
                  <th className="pb-3 font-semibold">Umumiy qarz</th>
                  <th className="pb-3 font-semibold">To‘langan</th>
                  <th className="pb-3 font-semibold">Qolgan qarz</th>
                  <th className="pb-3 text-right font-semibold">Amal</th>
                </tr>
              </thead>

              <tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.address || '-'}</p>
                        </div>
                      </td>

                      <td className="py-3 text-slate-700">{item.phone || '-'}</td>

                      <td className="py-3 font-semibold text-slate-900">
                        {item.totalDebtFormatted || '0'}
                      </td>

                      <td className="py-3 font-semibold text-emerald-600">
                        {item.totalPaidFormatted || '0'}
                      </td>

                      <td className="py-3 font-semibold text-rose-600">
                        {item.remainingDebtFormatted || '0'}
                      </td>

                      <td className="py-3 text-right">
                        <button
                          onClick={() => openLedger(item.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye size={14} />
                          Ko‘rish
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-slate-500">
                      Hozircha qarz yozuvlari yo‘q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawerOpen &&
        (ledgerLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
            <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-700 shadow-xl">
              Yuklanmoqda...
            </div>
          </div>
        ) : (
          <SupplierLedgerDrawer
            open={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              setLedgerData(null);
              setSelectedSupplierId(null);
            }}
            data={ledgerData}
            onRefresh={refreshLedger}
          />
        ))}
    </div>
  );
}