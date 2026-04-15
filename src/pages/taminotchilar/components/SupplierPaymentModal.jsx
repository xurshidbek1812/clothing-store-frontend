import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../../lib/api';

export default function SupplierPaymentModal({
  open,
  onClose,
  onSuccess,
  supplier,
  ledgerEntries = [],
}) {
  const [form, setForm] = useState({
    ledgerEntryId: '',
    source: 'CASHBOX',
    cashboxId: '',
    amount: '',
    note: '',
  });
  const [cashboxes, setCashboxes] = useState([]);
  const [loadingCashboxes, setLoadingCashboxes] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadCashboxes = async () => {
      setLoadingCashboxes(true);
      try {
        const res = await apiFetch('/cashboxes');
        setCashboxes(res || []);
      } catch (error) {
        toast.error(error.message || 'Kassalar yuklanmadi');
      } finally {
        setLoadingCashboxes(false);
      }
    };

    loadCashboxes();

    setForm({
      ledgerEntryId: '',
      source: 'CASHBOX',
      cashboxId: '',
      amount: '',
      note: '',
    });
  }, [open]);

  if (!open || !supplier) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("To'lov summasi to'g'ri bo'lishi kerak");
      return;
    }

    if (form.source === 'CASHBOX' && !form.cashboxId) {
      toast.error('Kassa tanlang');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/supplier-payments/pay', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: supplier.id,
          ledgerEntryId: form.ledgerEntryId || undefined,
          source: form.source,
          cashboxId: form.source === 'CASHBOX' ? form.cashboxId : undefined,
          amount,
          note: form.note.trim() || undefined,
        }),
      });

      toast.success("To'lov muvaffaqiyatli yozildi");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || "To'lovda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              Taminotchiga to‘lov
            </h3>
            <p className="mt-1 text-sm text-slate-500">{supplier.name}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Qarz yozuvi
            </label>
            <select
              value={form.ledgerEntryId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ledgerEntryId: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Umumiy qarz bo‘yicha</option>
              {ledgerEntries.map((entry) => {
                const remaining = (entry.totalAmount || 0) - (entry.paidAmount || 0);

                return (
                  <option key={entry.id} value={entry.id}>
                    {new Date(entry.createdAt).toLocaleDateString('uz-UZ')} — Qolgan: {remaining.toLocaleString('uz-UZ')}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                To‘lov manbai
              </label>
              <select
                value={form.source}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    source: e.target.value,
                    cashboxId: e.target.value === 'CASHBOX' ? prev.cashboxId : '',
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="CASHBOX">Kassadan</option>
                <option value="OTHER">Boshqa</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Summa
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {form.source === 'CASHBOX' ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Kassa
              </label>
              <select
                value={form.cashboxId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cashboxId: e.target.value }))
                }
                disabled={loadingCashboxes}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
              >
                <option value="">Kassa tanlang</option>
                {cashboxes.map((cashbox) => (
                  <option key={cashbox.id} value={cashbox.id}>
                    {cashbox.name} — {Number(cashbox.balance || 0).toLocaleString('uz-UZ')} {cashbox.currency?.code || ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Izoh
            </label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Masalan: 1-qism to‘lov"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {saving ? 'Saqlanmoqda...' : "To'lov qilish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}