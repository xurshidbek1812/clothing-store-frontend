import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Eye,
  Loader2,
  Receipt,
  Search,
  CalendarDays,
  RefreshCcw,
  Printer,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ');
}

function getTypeLabel(type) {
  switch (type) {
    case 'CASH':
      return 'Naqd';
    case 'CREDIT':
      return 'Nasiya';
    default:
      return type || '-';
  }
}

function getTypeClass(type) {
  switch (type) {
    case 'CASH':
      return 'bg-emerald-50 text-emerald-600';
    case 'CREDIT':
      return 'bg-violet-50 text-violet-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatMoneyWithCurrency(value, currency) {
  if (!currency) return money(value);
  return `${money(value)} ${currency.code}`;
}

function summarizeItemsByCurrency(items = []) {
  const map = new Map();

  for (const row of items) {
    const currencyId = row.currencyId || row.currency?.id;
    if (!currencyId) continue;

    const prev = map.get(currencyId) || {
      currency: row.currency || null,
      amount: 0,
    };

    map.set(currencyId, {
      currency: row.currency || prev.currency,
      amount: prev.amount + Number(row.totalPrice || 0),
    });
  }

  return Array.from(map.values());
}

function summarizePaymentsByCurrency(payments = []) {
  const map = new Map();

  for (const payment of payments) {
    const currencyId = payment.cashbox?.currency?.id || payment.currencyId;
    if (!currencyId) continue;

    const prev = map.get(currencyId) || {
      currency: payment.cashbox?.currency || null,
      amount: 0,
    };

    map.set(currencyId, {
      currency: payment.cashbox?.currency || prev.currency,
      amount: prev.amount + Number(payment.amount || 0),
    });
  }

  return Array.from(map.values());
}

function SaleDetailsModal({ open, onClose, item, loading }) {
  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const itemTotals = summarizeItemsByCurrency(item?.items || []);
  const paymentTotals = summarizePaymentsByCurrency(item?.CashTransaction || []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm print:bg-white">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl print:max-h-none print:max-w-full print:rounded-none print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 print:hidden">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              Savdo tafsiloti
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Batafsil ma’lumot va chop etish
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!loading && item ? (
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                <Printer size={16} />
                Chop etish
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

        <div className="max-h-[calc(90vh-73px)] overflow-y-auto px-6 py-5 print:max-h-none print:overflow-visible print:px-0 print:py-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500 print:hidden">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Yuklanmoqda...
            </div>
          ) : item ? (
            <div className="space-y-4">
              <div className="hidden print:block">
                <div className="mx-auto max-w-[320px] px-4 py-4 font-mono text-sm text-black">
                  <div className="text-center">
                    <h2 className="text-lg font-bold uppercase">DO'KON</h2>
                    <p className="mt-1 text-xs">Savdo cheki</p>
                    <p className="text-xs">{formatDateTime(item.createdAt)}</p>
                    <p className="text-xs">Savdo kodi: {item.saleCode || item.id}</p>
                  </div>

                  <div className="my-4 border-t border-dashed border-black" />

                  <div className="space-y-3">
                    {(item.items || []).map((row) => (
                      <div key={row.id}>
                        <p className="font-semibold">
                          {row.productVariant?.product?.name || '-'}
                        </p>
                        <p className="text-xs">
                          Razmer: {row.productVariant?.size?.name || '-'}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span>
                            {row.quantity} x {formatMoneyWithCurrency(row.unitPrice, row.currency)}
                          </span>
                          <span>{formatMoneyWithCurrency(row.totalPrice, row.currency)}</span>
                        </div>
                        {Number(row.discountAmount || 0) > 0 ? (
                          <div className="flex items-center justify-between text-xs">
                            <span>Chegirma</span>
                            <span>- {formatMoneyWithCurrency(row.discountAmount, row.currency)}</span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="my-4 border-t border-dashed border-black" />

                  <div className="space-y-1 text-sm">
                    {itemTotals.map((row, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>Jami</span>
                        <span>{formatMoneyWithCurrency(row.amount, row.currency)}</span>
                      </div>
                    ))}

                    {Number(item.discountAmount || 0) > 0 ? (
                      <div className="flex items-center justify-between">
                        <span>Chegirma</span>
                        <span>- {money(item.discountAmount)}</span>
                      </div>
                    ) : null}

                    {paymentTotals.map((row, index) => (
                      <div key={index} className="flex items-center justify-between font-bold">
                        <span>To'lov</span>
                        <span>{formatMoneyWithCurrency(row.amount, row.currency)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="my-4 border-t border-dashed border-black" />

                  <div className="text-center text-xs">
                    Xaridingiz uchun rahmat
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 print:hidden">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Savdo kodi</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {item.saleCode || item.id}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Sana</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Sotuvchi</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {item.seller?.fullName || '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Turi</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {getTypeLabel(item.type)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Asosiy kassa</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {item.cashbox?.name || '-'} {item.cashbox?.currency ? `• ${item.cashbox.currency.code}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 print:hidden">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">Itemlar bo‘yicha jami</p>
                  <div className="mt-1 space-y-1">
                    {itemTotals.length > 0 ? (
                      itemTotals.map((row, index) => (
                        <p key={index} className="text-sm font-bold text-slate-900">
                          {formatMoneyWithCurrency(row.amount, row.currency)}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-slate-900">0</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">Chegirma</p>
                  <p className="mt-1 text-sm font-bold text-rose-600">
                    {money(item.discountAmount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">To‘lovlar bo‘yicha jami</p>
                  <div className="mt-1 space-y-1">
                    {paymentTotals.length > 0 ? (
                      paymentTotals.map((row, index) => (
                        <p key={index} className="text-sm font-bold text-emerald-600">
                          {formatMoneyWithCurrency(row.amount, row.currency)}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-slate-900">0</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 print:hidden">
                <h4 className="mb-3 text-lg font-black text-slate-900">Tovarlar</h4>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-500">
                        <th className="pb-3 font-semibold">Tovar</th>
                        <th className="pb-3 font-semibold">Razmer</th>
                        <th className="pb-3 font-semibold">Ombor</th>
                        <th className="pb-3 font-semibold">Soni</th>
                        <th className="pb-3 font-semibold">Valyuta</th>
                        <th className="pb-3 font-semibold">Narxi</th>
                        <th className="pb-3 font-semibold">Chegirma</th>
                        <th className="pb-3 font-semibold">Jami</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(item.items || []).map((row) => (
                        <tr key={row.id} className="border-b border-slate-50">
                          <td className="py-3 font-semibold text-slate-900">
                            {row.productVariant?.product?.name || '-'}
                          </td>
                          <td className="py-3 text-slate-700">
                            {row.productVariant?.size?.name || '-'}
                          </td>
                          <td className="py-3 text-slate-700">
                            {row.batch?.warehouse?.name || '-'}
                          </td>
                          <td className="py-3 text-slate-700">{row.quantity}</td>
                          <td className="py-3 text-slate-700">
                            {row.currency?.code || '-'}
                          </td>
                          <td className="py-3 text-slate-700">
                            {formatMoneyWithCurrency(row.unitPrice, row.currency)}
                          </td>
                          <td className="py-3 text-rose-600">
                            {formatMoneyWithCurrency(row.discountAmount, row.currency)}
                          </td>
                          <td className="py-3 font-semibold text-slate-900">
                            {formatMoneyWithCurrency(row.totalPrice, row.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 print:hidden">
                <h4 className="mb-3 text-lg font-black text-slate-900">To‘lovlar</h4>

                {(item.CashTransaction || []).length > 0 ? (
                  <div className="space-y-2">
                    {item.CashTransaction.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {payment.cashbox?.name || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {payment.cashbox?.currency?.code || ''}
                          </p>
                        </div>

                        <p className="text-sm font-bold text-emerald-600">
                          {formatMoneyWithCurrency(payment.amount, payment.cashbox?.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">To‘lovlar topilmadi</p>
                )}
              </div>

              {item.note ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 print:hidden">
                  <span className="font-semibold text-slate-900">Izoh:</span> {item.note}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-slate-500">
              Ma’lumot topilmadi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SalesHistoryPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [q, setQ] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [loading, setLoading] = useState(true);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const loadData = async (page = 1, custom = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '10');

      const nextQ = custom.q ?? q;
      const nextType = custom.type ?? type;
      const nextDateFrom = custom.dateFrom ?? dateFrom;
      const nextDateTo = custom.dateTo ?? dateTo;

      if (nextQ) params.set('q', nextQ);
      if (nextType) params.set('type', nextType);
      if (nextDateFrom) params.set('dateFrom', nextDateFrom);
      if (nextDateTo) params.set('dateTo', nextDateTo);

      const res = await apiFetch(`/sales?${params.toString()}`);

      setItems(res.items || []);
      setPagination(
        res.pagination || {
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      toast.error(error.message || 'Savdolar tarixi yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  const handleSearch = () => {
    setQ(searchValue);
    loadData(1, { q: searchValue });
  };

  const handleReset = () => {
    setSearchValue('');
    setQ('');
    setType('');
    setDateFrom('');
    setDateTo('');
    loadData(1, {
      q: '',
      type: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const openDetails = async (saleIdOrCode) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setSelectedSale(null);

    try {
      const res = await apiFetch(`/sales/${saleIdOrCode}`);
      setSelectedSale(res);
    } catch (error) {
      toast.error(error.message || 'Savdo tafsiloti yuklanmadi');
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const summarizedRows = useMemo(() => {
    return items.map((sale) => ({
      ...sale,
      itemTotals: summarizeItemsByCurrency(sale.items || []),
      paymentTotals: summarizePaymentsByCurrency(sale.CashTransaction || []),
    }));
  }, [items]);

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Receipt size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Savdolar tarixi
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Naqd va nasiya savdolar ro‘yxati
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto_auto]">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Savdo kodi, sotuvchi yoki tovar nomi"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Barcha turlar</option>
              <option value="CASH">Naqd</option>
              <option value="CREDIT">Nasiya</option>
            </select>

            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Search size={16} />
              Qidirish
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              Tozalash
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Yuklanmoqda...
            </div>
          ) : summarizedRows.length ? (
            <>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-slate-500">
                      <th className="pb-3 font-semibold">Kod</th>
                      <th className="pb-3 font-semibold">Sana</th>
                      <th className="pb-3 font-semibold">Turi</th>
                      <th className="pb-3 font-semibold">Sotuvchi</th>
                      <th className="pb-3 font-semibold">Itemlar</th>
                      <th className="pb-3 font-semibold">Jami</th>
                      <th className="pb-3 font-semibold">To‘lov</th>
                      <th className="pb-3 text-right font-semibold">Amal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {summarizedRows.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="py-3 font-semibold text-slate-900">
                          {item.saleCode || item.id}
                        </td>
                        <td className="py-3 text-slate-700">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeClass(item.type)}`}
                          >
                            {getTypeLabel(item.type)}
                          </span>
                        </td>
                        <td className="py-3 text-slate-700">
                          {item.seller?.fullName || item.seller?.username || '-'}
                        </td>
                        <td className="py-3 text-slate-700">
                          {item._count?.items || 0} ta
                        </td>
                        <td className="py-3">
                          <div className="space-y-1">
                            {item.itemTotals.length > 0 ? (
                              item.itemTotals.map((row, index) => (
                                <div
                                  key={index}
                                  className="text-sm font-semibold text-slate-900"
                                >
                                  {formatMoneyWithCurrency(row.amount, row.currency)}
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="space-y-1">
                            {item.paymentTotals.length > 0 ? (
                              item.paymentTotals.map((row, index) => (
                                <div
                                  key={index}
                                  className="text-sm font-semibold text-emerald-600"
                                >
                                  {formatMoneyWithCurrency(row.amount, row.currency)}
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openDetails(item.saleCode || item.id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye size={16} />
                            Ko‘rish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-sm text-slate-500">
                  Jami: {pagination.totalItems} ta
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => loadData(pagination.page - 1)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Oldingi
                  </button>

                  <span className="px-2 text-sm font-semibold text-slate-700">
                    {pagination.page} / {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadData(pagination.page + 1)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Keyingi
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              Savdolar topilmadi
            </div>
          )}
        </div>
      </div>

      <SaleDetailsModal
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedSale(null);
        }}
        item={selectedSale}
        loading={detailsLoading}
      />
    </>
  );
}