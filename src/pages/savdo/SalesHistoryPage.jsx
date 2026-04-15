import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Eye,
  Loader2,
  Receipt,
  Search,
  CalendarDays,
  RefreshCcw,
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

function SaleDetailsModal({ open, onClose, item, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              Savdo tafsiloti
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Batafsil ma’lumot
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[calc(90vh-73px)] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Yuklanmoqda...
            </div>
          ) : item ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  <p className="text-xs text-slate-400">Yakuniy summa</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {money(item.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">Jami summa</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {money(item.subtotalAmount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">Chegirma</p>
                  <p className="mt-1 text-sm font-bold text-rose-600">
                    {money(item.discountAmount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">To‘langan</p>
                  <p className="mt-1 text-sm font-bold text-emerald-600">
                    {money(item.paidAmount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">Asosiy kassa</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {item.cashbox?.name || '-'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-lg font-black text-slate-900">Tovarlar</h4>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-500">
                        <th className="pb-3 font-semibold">Tovar</th>
                        <th className="pb-3 font-semibold">Razmer</th>
                        <th className="pb-3 font-semibold">Ombor</th>
                        <th className="pb-3 font-semibold">Soni</th>
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
                          <td className="py-3 text-slate-700">{money(row.unitPrice)}</td>
                          <td className="py-3 text-rose-600">{money(row.discountAmount)}</td>
                          <td className="py-3 font-semibold text-slate-900">
                            {money(row.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
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
                          {money(payment.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">To‘lovlar topilmadi</p>
                )}
              </div>

              {item.note ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
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

  const openDetails = async (saleId) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setSelectedSale(null);

    try {
      const res = await apiFetch(`/sales/${saleId}`);
      setSelectedSale(res);
    } catch (error) {
      toast.error(error.message || 'Savdo tafsiloti yuklanmadi');
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
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
              Barcha savdolar, filter va tafsilotlar
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_auto_auto]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Qidiruv
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                placeholder="Tovar, sotuvchi yoki izoh"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Turi
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                loadData(1, { type: e.target.value });
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Barchasi</option>
              <option value="CASH">Naqd</option>
              <option value="CREDIT">Nasiya</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Dan
            </label>
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  loadData(1, { dateFrom: e.target.value });
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Gacha
            </label>
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  loadData(1, { dateTo: e.target.value });
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="mt-7 inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Search size={16} />
            Qidirish
          </button>

          <button
            onClick={handleReset}
            className="mt-7 inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Tozalash
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-14 text-sm text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Yuklanmoqda...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="pb-3 font-semibold">Sana</th>
                    <th className="pb-3 font-semibold">Sotuvchi</th>
                    <th className="pb-3 font-semibold">Turi</th>
                    <th className="pb-3 font-semibold">Jami</th>
                    <th className="pb-3 font-semibold">Chegirma</th>
                    <th className="pb-3 font-semibold">To‘langan</th>
                    <th className="pb-3 font-semibold">Items</th>
                    <th className="pb-3 text-right font-semibold">Amal</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length > 0 ? (
                    items.map((sale) => (
                      <tr key={sale.id} className="border-b border-slate-50">
                        <td className="py-3 text-slate-700">
                          {formatDateTime(sale.createdAt)}
                        </td>

                        <td className="py-3 text-slate-700">
                          {sale.seller?.fullName || '-'}
                        </td>

                        <td className="py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeClass(
                              sale.type
                            )}`}
                          >
                            {getTypeLabel(sale.type)}
                          </span>
                        </td>

                        <td className="py-3 font-semibold text-slate-900">
                          {money(sale.totalAmount)}
                        </td>

                        <td className="py-3 text-rose-600">
                          {money(sale.discountAmount)}
                        </td>

                        <td className="py-3 text-emerald-600">
                          {money(sale.paidAmount)}
                        </td>

                        <td className="py-3 text-slate-700">
                          {sale._count?.items || 0}
                        </td>

                        <td className="py-3">
                          <div className="flex justify-end">
                            <button
                              onClick={() => openDetails(sale.id)}
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
                      <td colSpan="8" className="py-12 text-center text-sm text-slate-500">
                        Hozircha savdolar yo‘q
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Sahifa {pagination.page} / {pagination.totalPages || 1}
              </p>

              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadData(pagination.page - 1)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Oldingi
                </button>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadData(pagination.page + 1)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </>
        )}
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
    </div>
  );
}