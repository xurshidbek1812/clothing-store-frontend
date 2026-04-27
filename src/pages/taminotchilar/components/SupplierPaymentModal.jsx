import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../../lib/api';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatMoneyWithCurrency(value, currency) {
  if (!currency) return money(value);
  return `${money(value)} ${currency.code}`;
}

function getCurrencyLabel(currency) {
  if (!currency) return '-';
  return `${currency.code}${currency.symbol ? ` (${currency.symbol})` : ''}`;
}

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

  const selectedLedgerEntry = useMemo(() => {
    return ledgerEntries.find((entry) => entry.id === form.ledgerEntryId) || null;
  }, [ledgerEntries, form.ledgerEntryId]);

  const filteredCashboxes = useMemo(() => {
    if (!selectedLedgerEntry?.currencyId) return cashboxes;
    return cashboxes.filter(
      (cashbox) => cashbox.currencyId === selectedLedgerEntry.currencyId
    );
  }, [cashboxes, selectedLedgerEntry]);

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
      ledgerEntryId: ledgerEntries[0]?.id || '',
      source: 'CASHBOX',
      cashboxId: '',
      amount: '',
      note: '',
    });
  }, [open, ledgerEntries]);

  useEffect(() => {
    if (!open) return;

    if (form.source !== 'CASHBOX') return;

    const exists = filteredCashboxes.some((cashbox) => cashbox.id === form.cashboxId);

    if (!exists) {
      setForm((prev) => ({
        ...prev,
        cashboxId: filteredCashboxes[0]?.id || '',
      }));
    }
  }, [open, form.source, filteredCashboxes, form.cashboxId]);

  if (!open || !supplier) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (!form.ledgerEntryId) {
      toast.error('Qarz yozuvini tanlang');
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("To'lov summasi to'g'ri bo'lishi kerak");
      return;
    }

    if (form.source === 'CASHBOX' && !form.cashboxId) {
      toast.error('Kassa tanlang');
      return;
    }

    if (
      form.source === 'CASHBOX' &&
      selectedLedgerEntry?.currencyId &&
      !filteredCashboxes.some((cashbox) => cashbox.id === form.cashboxId)
    ) {
      toast.error("Tanlangan kassa qarz valyutasiga mos emas");
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/supplier-payments', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: supplier.id,
          ledgerEntryId: form.ledgerEntryId,
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
              <option value="">Qarz yozuvini tanlang</option>
              {ledgerEntries.map((entry) => {
                const remaining =
                  Number(entry.dueAmount ?? ((entry.totalAmount || 0) - (entry.paidAmount || 0)));

                return (
                  <option key={entry.id} value={entry.id}>
                    {new Date(entry.createdAt).toLocaleDateString('uz-UZ')} —{' '}
                    {entry.currency?.code || '-'} — Qolgan:{' '}
                    {formatMoneyWithCurrency(remaining, entry.currency)}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedLedgerEntry?.currency ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                To‘lov valyutasi
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {getCurrencyLabel(selectedLedgerEntry.currency)}
              </p>
            </div>
          ) : null}

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
                {filteredCashboxes.map((cashbox) => (
                  <option key={cashbox.id} value={cashbox.id}>
                    {cashbox.name} — {money(cashbox.balance || 0)} {cashbox.currency?.code || ''}
                  </option>
                ))}
              </select>

              {selectedLedgerEntry?.currencyId && filteredCashboxes.length === 0 ? (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  Bu valyuta uchun mos kassa topilmadi
                </p>
              ) : null}
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
              disabled={saving || (form.source === 'CASHBOX' && selectedLedgerEntry?.currencyId && filteredCashboxes.length === 0)}
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