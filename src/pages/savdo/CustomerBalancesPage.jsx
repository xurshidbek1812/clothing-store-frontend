import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Eye,
  Loader2,
  Search,
  Users,
  Plus,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ');
}

function getCurrencyLabel(currency) {
  if (!currency) return '-';
  return `${currency.code}${currency.symbol ? ` (${currency.symbol})` : ''}`;
}

function formatMoneyWithCurrency(value, currency) {
  if (!currency) return money(value);
  return `${money(value)} ${currency.code}`;
}

function summarizeSalesByCurrency(sales = []) {
  const map = new Map();

  for (const sale of sales) {
    const items = sale.items || [];
    const firstCurrency = items[0]?.currency || null;
    const currencyId = firstCurrency?.id || items[0]?.currencyId;

    if (!currencyId) continue;

    const prev = map.get(currencyId) || {
      currency: firstCurrency,
      totalCredit: 0,
      totalPaid: 0,
      totalDebt: 0,
    };

    map.set(currencyId, {
      currency: firstCurrency || prev.currency,
      totalCredit: prev.totalCredit + Number(sale.totalAmount || 0),
      totalPaid: prev.totalPaid + Number(sale.paidAmount || 0),
      totalDebt: prev.totalDebt + Number(sale.creditDueAmount || 0),
    });
  }

  return Array.from(map.values());
}

function summarizePaymentsByCurrency(payments = []) {
  const map = new Map();

  for (const payment of payments) {
    const currency = payment.cashbox?.currency || payment.currency || null;
    const currencyId = currency?.id || payment.currencyId;

    if (!currencyId) continue;

    const prev = map.get(currencyId) || {
      currency,
      amount: 0,
    };

    map.set(currencyId, {
      currency: currency || prev.currency,
      amount: prev.amount + Number(payment.amount || 0),
    });
  }

  return Array.from(map.values());
}

function CreditPaymentModal({
  open,
  onClose,
  customer,
  sales = [],
  cashboxes = [],
  onSuccess,
}) {
  const [saleId, setSaleId] = useState('');
  const [cashboxId, setCashboxId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const debtSales = useMemo(
    () => (sales || []).filter((sale) => Number(sale.creditDueAmount || 0) > 0),
    [sales]
  );

  const selectedSale = useMemo(() => {
    if (!saleId) return debtSales[0] || null;
    return debtSales.find((sale) => sale.id === saleId) || null;
  }, [saleId, debtSales]);

  const saleCurrency = useMemo(() => {
    return selectedSale?.items?.[0]?.currency || null;
  }, [selectedSale]);

  const saleCurrencyId = useMemo(() => {
    return selectedSale?.items?.[0]?.currencyId || selectedSale?.items?.[0]?.currency?.id || '';
  }, [selectedSale]);

  const filteredCashboxes = useMemo(() => {
    if (!saleCurrencyId) return cashboxes;
    return cashboxes.filter((cashbox) => cashbox.currencyId === saleCurrencyId);
  }, [cashboxes, saleCurrencyId]);

  useEffect(() => {
    if (!open) return;
    setSaleId('');
    setAmount('');
    setNote('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setCashboxId(filteredCashboxes[0]?.id || '');
  }, [open, saleCurrencyId, filteredCashboxes]);

  if (!open || !customer) return null;

  const submitPayment = async (e) => {
    e.preventDefault();

    if (!cashboxId) {
      toast.error('Kassa tanlang');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("To'lov summasini to'g'ri kiriting");
      return;
    }

    if (saleCurrencyId && !filteredCashboxes.some((cashbox) => cashbox.id === cashboxId)) {
      toast.error("Tanlangan kassa savdo valyutasiga mos emas");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/customers/credit-payment', {
        method: 'POST',
        body: JSON.stringify({
          customerId: customer.id,
          saleId: saleId || undefined,
          cashboxId,
          amount: Number(amount),
          note: note.trim() || undefined,
        }),
      });

      toast.success(res.message || "To'lov qabul qilindi");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || "To'lovda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              Nasiya to‘lovi olish
            </h3>
            <p className="mt-1 text-sm text-slate-500">{customer.fullName}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitPayment} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Qaysi nasiya savdoga
            </label>
            <select
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Avtomatik (eng eski qarz)</option>
              {debtSales.map((sale) => {
                const currency = sale.items?.[0]?.currency || null;
                return (
                  <option key={sale.id} value={sale.id}>
                    {formatDateTime(sale.createdAt)} • Qarz:{' '}
                    {formatMoneyWithCurrency(sale.creditDueAmount, currency)}
                  </option>
                );
              })}
            </select>
          </div>

          {saleCurrency ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                To‘lov valyutasi
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {getCurrencyLabel(saleCurrency)}
              </p>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Kassa
            </label>
            <select
              value={cashboxId}
              onChange={(e) => setCashboxId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Kassa tanlang</option>
              {filteredCashboxes.map((cashbox) => (
                <option key={cashbox.id} value={cashbox.id}>
                  {cashbox.name} • {cashbox.currency?.code || '-'}
                </option>
              ))}
            </select>
            {saleCurrencyId && filteredCashboxes.length === 0 ? (
              <p className="mt-2 text-xs font-medium text-rose-600">
                Bu valyuta uchun mos kassa topilmadi
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              To‘lov summasi
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Izoh
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Ixtiyoriy"
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
              disabled={saving || (saleCurrencyId && filteredCashboxes.length === 0)}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {saving ? 'Saqlanmoqda...' : "To'lovni saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerHistoryModal({
  open,
  onClose,
  customerId,
  cashboxes,
  onPaymentSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const loadHistory = async () => {
    if (!customerId) return;

    setLoading(true);
    try {
      const res = await apiFetch(`/customers/${customerId}/history`);
      setData(res);
    } catch (error) {
      toast.error(error.message || 'Mijoz tarixi yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customerId) {
      loadHistory();
    }
  }, [open, customerId]);

  if (!open) return null;

  const salesSummary = summarizeSalesByCurrency(data?.sales || []);
  const paymentsSummary = summarizePaymentsByCurrency(data?.payments || []);

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-900">
                Mijoz qarzdorligi
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Batafsil tarix va nasiya to‘lovlari
              </p>
            </div>

            <div className="flex items-center gap-2">
              {data?.customer ? (
                <button
                  onClick={() => setPaymentOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus size={16} />
                  To‘lov olish
                </button>
              ) : null}

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-[calc(90vh-73px)] overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                <Loader2 size={18} className="mr-2 animate-spin" />
                Yuklanmoqda...
              </div>
            ) : data ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Mijoz</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {data.customer?.fullName || '-'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Jami nasiya</p>
                    <div className="mt-1 space-y-1">
                      {salesSummary.length > 0 ? (
                        salesSummary.map((row, index) => (
                          <p key={index} className="text-sm font-bold text-slate-900">
                            {formatMoneyWithCurrency(row.totalCredit, row.currency)}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm font-bold text-slate-900">0</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Jami to‘langan</p>
                    <div className="mt-1 space-y-1">
                      {paymentsSummary.length > 0 ? (
                        paymentsSummary.map((row, index) => (
                          <p key={index} className="text-sm font-bold text-emerald-600">
                            {formatMoneyWithCurrency(row.amount, row.currency)}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm font-bold text-slate-900">
                          {money(data.summary?.totalPaid)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Qolgan qarz</p>
                    <div className="mt-1 space-y-1">
                      {salesSummary.length > 0 ? (
                        salesSummary.map((row, index) => (
                          <p key={index} className="text-sm font-bold text-rose-600">
                            {formatMoneyWithCurrency(row.totalDebt, row.currency)}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm font-bold text-slate-900">0</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-3 text-lg font-black text-slate-900">
                    Nasiya savdolar
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-slate-500">
                          <th className="pb-3 font-semibold">Sana</th>
                          <th className="pb-3 font-semibold">Sotuvchi</th>
                          <th className="pb-3 font-semibold">Valyuta</th>
                          <th className="pb-3 font-semibold">Jami</th>
                          <th className="pb-3 font-semibold">To‘langan</th>
                          <th className="pb-3 font-semibold">Qarz</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(data.sales || []).length > 0 ? (
                          data.sales.map((sale) => {
                            const currency = sale.items?.[0]?.currency || null;
                            return (
                              <tr key={sale.id} className="border-b border-slate-50">
                                <td className="py-3 text-slate-700">
                                  {formatDateTime(sale.createdAt)}
                                </td>
                                <td className="py-3 text-slate-700">
                                  {sale.seller?.fullName || '-'}
                                </td>
                                <td className="py-3 text-slate-700">
                                  {currency?.code || '-'}
                                </td>
                                <td className="py-3 font-semibold text-slate-900">
                                  {formatMoneyWithCurrency(sale.totalAmount, currency)}
                                </td>
                                <td className="py-3 text-emerald-600">
                                  {formatMoneyWithCurrency(sale.paidAmount, currency)}
                                </td>
                                <td className="py-3 text-rose-600 font-semibold">
                                  {formatMoneyWithCurrency(sale.creditDueAmount, currency)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-10 text-center text-sm text-slate-500">
                              Nasiya savdolar yo‘q
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-3 text-lg font-black text-slate-900">
                    Nasiya to‘lovlar
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-slate-500">
                          <th className="pb-3 font-semibold">Sana</th>
                          <th className="pb-3 font-semibold">Kassa</th>
                          <th className="pb-3 font-semibold">Valyuta</th>
                          <th className="pb-3 font-semibold">Summa</th>
                          <th className="pb-3 font-semibold">Kim kiritdi</th>
                          <th className="pb-3 font-semibold">Izoh</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(data.payments || []).length > 0 ? (
                          data.payments.map((payment) => (
                            <tr key={payment.id} className="border-b border-slate-50">
                              <td className="py-3 text-slate-700">
                                {formatDateTime(payment.createdAt)}
                              </td>
                              <td className="py-3 text-slate-700">
                                {payment.cashbox?.name || '-'}
                              </td>
                              <td className="py-3 text-slate-700">
                                {payment.cashbox?.currency?.code || payment.currency?.code || '-'}
                              </td>
                              <td className="py-3 font-semibold text-emerald-600">
                                {formatMoneyWithCurrency(
                                  payment.amount,
                                  payment.cashbox?.currency || payment.currency
                                )}
                              </td>
                              <td className="py-3 text-slate-700">
                                {payment.createdBy?.fullName || '-'}
                              </td>
                              <td className="py-3 text-slate-700">
                                {payment.note || '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-10 text-center text-sm text-slate-500">
                              To‘lovlar yo‘q
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-slate-500">
                Ma’lumot topilmadi
              </div>
            )}
          </div>
        </div>
      </div>

      <CreditPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        customer={data?.customer}
        sales={data?.sales || []}
        cashboxes={cashboxes}
        onSuccess={async () => {
          setPaymentOpen(false);
          await loadHistory();
          onPaymentSaved?.();
        }}
      />
    </>
  );
}

export default function CustomerBalancesPage() {
  const [items, setItems] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [balancesRes, cashboxesRes] = await Promise.all([
        apiFetch('/customers/balances'),
        apiFetch('/cashboxes'),
      ]);

      setItems(balancesRes || []);
      setCashboxes(cashboxesRes || []);
    } catch (error) {
      toast.error(error.message || 'Qarzdorlik ma’lumotlari yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const fullName = String(item.fullName || '').toLowerCase();
      const phone = String(item.phone || '').toLowerCase();
      return fullName.includes(q) || phone.includes(q);
    });
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Mijozlar qarzdorligi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Nasiya savdolar va mijozlarning qolgan qarzi
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="max-w-md">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Qidiruv
          </label>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              placeholder="Mijoz nomi yoki telefon"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-14 text-sm text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Yuklanmoqda...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 font-semibold">Mijoz</th>
                  <th className="pb-3 font-semibold">Telefon</th>
                  <th className="pb-3 font-semibold">Jami nasiya</th>
                  <th className="pb-3 font-semibold">Jami to‘langan</th>
                  <th className="pb-3 font-semibold">Qolgan qarz</th>
                  <th className="pb-3 text-right font-semibold">Amal</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-3 font-semibold text-slate-900">
                        {item.fullName}
                      </td>
                      <td className="py-3 text-slate-700">
                        {item.phone || '-'}
                      </td>
                      <td className="py-3 text-slate-900 font-semibold">
                        {item.totalCreditFormatted || money(item.totalCredit)}
                      </td>
                      <td className="py-3 text-emerald-600 font-semibold">
                        {item.totalPaidFormatted || money(item.totalPaid)}
                      </td>
                      <td className="py-3 text-rose-600 font-semibold">
                        {item.totalDebtFormatted || money(item.totalDebt)}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedCustomerId(item.id);
                              setHistoryOpen(true);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            title="Ko‘rish"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-slate-500">
                      Hozircha qarzdor mijozlar yo‘q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerHistoryModal
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setSelectedCustomerId('');
        }}
        customerId={selectedCustomerId}
        cashboxes={cashboxes}
        onPaymentSaved={loadData}
      />
    </div>
  );
}