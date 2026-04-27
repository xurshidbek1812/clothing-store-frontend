import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Loader2,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function toNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('uz-UZ');
}

function formatMoneyWithCurrency(value, currency) {
  if (!currency) return money(value);
  return `${money(value)} ${currency.code}`;
}

const initialFilters = {
  q: '',
};

const initialForm = {
  saleSearch: '',
  reason: '',
  cashboxId: '',
};

export default function SaleReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [saleSearchLoading, setSaleSearchLoading] = useState(false);
  const [saleSearchResults, setSaleSearchResults] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedSaleLoading, setSelectedSaleLoading] = useState(false);

  const [cashboxes, setCashboxes] = useState([]);
  const [returnRows, setReturnRows] = useState([]);

  const loadCashboxes = async () => {
    try {
      const res = await apiFetch('/cashboxes');
      setCashboxes((res || []).filter((item) => item.isActive));
    } catch (error) {
      toast.error(error.message || 'Kassalar yuklanmadi');
    }
  };

  const loadReturns = async ({
    page = 1,
    pageSize = pagination.pageSize,
    q = filters.q,
  } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (q?.trim()) params.set('q', q.trim());

      const res = await apiFetch(`/sales/returns?${params.toString()}`);

      setItems(res?.items || []);
      setPagination(
        res?.pagination || {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 1,
        }
      );
    } catch (_error) {
      setItems([]);
      setPagination({
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadReturns({ page: 1 }), loadCashboxes()]);
    };

    init();
  }, []);

  useEffect(() => {
    const q = form.saleSearch.trim();

    if (!createOpen || !q) {
      setSaleSearchResults([]);
      setSaleSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSaleSearchLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('pageSize', '20');
        params.set('q', q);

        const res = await apiFetch(`/sales?${params.toString()}`);
        setSaleSearchResults(res?.items || []);
      } catch (_error) {
        setSaleSearchResults([]);
      } finally {
        setSaleSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [form.saleSearch, createOpen]);

  const openCreateModal = () => {
    setCreateOpen(true);
    setForm(initialForm);
    setSaleSearchResults([]);
    setSelectedSale(null);
    setReturnRows([]);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setForm(initialForm);
    setSaleSearchResults([]);
    setSelectedSale(null);
    setReturnRows([]);
  };

  const loadSaleById = async (saleIdOrCode) => {
    setSelectedSaleLoading(true);
    try {
      const sale = await apiFetch(`/sales/${saleIdOrCode}`);
      setSelectedSale(sale);

      const rows = (sale?.items || []).map((item) => {
        const alreadyReturnedQty = (item.returnItems || []).reduce(
          (sum, row) => sum + Number(row.quantity || 0),
          0
        );
        const maxReturnableQty = Number(item.quantity || 0) - alreadyReturnedQty;

        return {
          saleItemId: item.id,
          productName: item.productVariant?.product?.name || '-',
          brand: item.productVariant?.product?.brand || '',
          sizeName: item.productVariant?.size?.name || '-',
          warehouseName: item.batch?.warehouse?.name || '-',
          soldQty: Number(item.quantity || 0),
          alreadyReturnedQty,
          maxReturnableQty,
          unitPrice: Number(item.unitPrice || 0),
          discountAmount: Number(item.discountAmount || 0),
          currency: item.currency || null,
          quantity: '',
          amount: '',
          selected: false,
        };
      });

      setReturnRows(rows);

      const currencyId = sale?.items?.[0]?.currencyId || '';
      const matchedCashbox = (cashboxes || []).find(
        (cashbox) => cashbox.currencyId === currencyId
      );

      setForm((prev) => ({
        ...prev,
        cashboxId: matchedCashbox?.id || '',
      }));
    } catch (_error) {
      setSelectedSale(null);
      setReturnRows([]);
    } finally {
      setSelectedSaleLoading(false);
    }
  };

  const saleCurrencyId = useMemo(() => {
    return selectedSale?.items?.[0]?.currencyId || '';
  }, [selectedSale]);

  const filteredCashboxes = useMemo(() => {
    if (!saleCurrencyId) return cashboxes;
    return cashboxes.filter((cashbox) => cashbox.currencyId === saleCurrencyId);
  }, [cashboxes, saleCurrencyId]);

  useEffect(() => {
    if (!createOpen) return;

    const exists = filteredCashboxes.some((cashbox) => cashbox.id === form.cashboxId);

    if (!exists) {
      setForm((prev) => ({
        ...prev,
        cashboxId: filteredCashboxes[0]?.id || '',
      }));
    }
  }, [filteredCashboxes, form.cashboxId, createOpen]);

  const selectedRows = useMemo(() => {
    return returnRows
      .filter((row) => row.selected && toNumber(row.quantity) > 0)
      .map((row) => ({
        ...row,
        quantity: toNumber(row.quantity),
        amount: toNumber(row.amount),
      }));
  }, [returnRows]);

  const totalReturnAmount = useMemo(() => {
    return roundMoney(
      selectedRows.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    );
  }, [selectedRows]);

  const updateReturnRow = (saleItemId, patch) => {
    setReturnRows((prev) =>
      prev.map((row) =>
        row.saleItemId === saleItemId
          ? {
              ...row,
              ...patch,
            }
          : row
      )
    );
  };

  const submitReturn = async (e) => {
    e.preventDefault();

    if (!selectedSale?.id) {
      toast.error('Avval savdo tanlang');
      return;
    }

    if (!selectedRows.length) {
      toast.error('Kamida bitta tovar tanlang');
      return;
    }

    for (const row of selectedRows) {
      if (row.quantity <= 0) {
        toast.error("Qaytarish soni to'g'ri bo'lishi kerak");
        return;
      }

      if (row.quantity > row.maxReturnableQty) {
        toast.error(`${row.productName} uchun qaytarish miqdori oshib ketdi`);
        return;
      }

      if (row.amount < 0) {
        toast.error(`${row.productName} uchun qaytarish summasi noto'g'ri`);
        return;
      }
    }

    const payload = {
      saleId: selectedSale.id,
      reason: form.reason.trim() || undefined,
      cashboxId: form.cashboxId || undefined,
      items: selectedRows.map((row) => ({
        saleItemId: row.saleItemId,
        quantity: Number(row.quantity),
        amount: Number(row.amount),
      })),
    };

    setSaving(true);
    try {
      await apiFetch('/sales/returns', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Qaytarish yaratildi');
      closeCreateModal();
      await loadReturns({ page: 1 });
    } catch (error) {
      toast.error(error.message || 'Qaytarishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <RotateCcw size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Savdodan qaytarish
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Savdo kodi orqali savdoni topib qaytarish
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Yangi qaytarish
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Savdo kodi yoki sabab bo‘yicha qidiring"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => loadReturns({ page: 1, q: filters.q })}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Filtrlash
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Yuklanmoqda...</div>
        ) : items.length ? (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Qaytarilgan
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>

                      <div className="text-sm text-slate-700">
                        Savdo kodi:{' '}
                        <span className="font-semibold text-slate-900">
                          {item.sale?.saleCode || item.saleId}
                        </span>
                      </div>

                      <div className="text-sm text-slate-700">
                        Summa:{' '}
                        <span className="font-semibold text-slate-900">
                          {item.cashbox?.currency
                            ? formatMoneyWithCurrency(item.amount, item.cashbox.currency)
                            : money(item.amount)}
                        </span>
                      </div>

                      {item.reason ? (
                        <div className="text-sm text-slate-600">Sabab: {item.reason}</div>
                      ) : null}
                    </div>

                    <div className="text-sm text-slate-500">
                      {item.cashbox ? (
                        <div>
                          Kassa:{' '}
                          <span className="font-semibold text-slate-700">
                            {item.cashbox.name}
                          </span>
                        </div>
                      ) : (
                        <div>Pul qaytarilmagan</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500">
                          <th className="pb-2 font-semibold">Tovar</th>
                          <th className="pb-2 font-semibold">Razmer</th>
                          <th className="pb-2 font-semibold">Miqdor</th>
                          <th className="pb-2 font-semibold">Summa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(item.items || []).map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="py-2">
                              {row.saleItem?.productVariant?.product?.name || '-'}
                            </td>
                            <td className="py-2">
                              {row.saleItem?.productVariant?.size?.name || '-'}
                            </td>
                            <td className="py-2">{row.quantity}</td>
                            <td className="py-2">
                              {row.saleItem?.currency
                                ? formatMoneyWithCurrency(row.amount, row.saleItem.currency)
                                : money(row.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="text-sm text-slate-500">
                Jami: {pagination.totalItems} ta
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    loadReturns({
                      page: pagination.page - 1,
                      q: filters.q,
                    })
                  }
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
                  onClick={() =>
                    loadReturns({
                      page: pagination.page + 1,
                      q: filters.q,
                    })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            Hozircha qaytarishlar yo‘q
          </div>
        )}
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  Yangi qaytarish
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Savdo kodini yozing, savdoni tanlang va qaytaring
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={submitReturn}
              className="max-h-[calc(92vh-80px)] overflow-y-auto px-6 py-5"
            >
              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Search size={16} className="text-slate-500" />
                      <div className="text-sm font-bold text-slate-900">Savdo qidirish</div>
                    </div>

                    <input
                      value={form.saleSearch}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, saleSearch: e.target.value }))
                      }
                      placeholder="Savdo kodi bo‘yicha qidiring"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                      {!form.saleSearch.trim() ? (
                        <div className="flex h-24 items-center justify-center text-sm text-slate-500">
                          Savdo kodini yozing
                        </div>
                      ) : saleSearchLoading ? (
                        <div className="flex h-24 items-center justify-center text-sm text-slate-500">
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Qidirilmoqda...
                        </div>
                      ) : saleSearchResults.length ? (
                        <div className="space-y-2">
                          {saleSearchResults.map((sale) => (
                            <button
                              key={sale.id}
                              type="button"
                              onClick={() => loadSaleById(sale.saleCode || sale.id)}
                              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                selectedSale?.id === sale.id
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate font-semibold">
                                    {sale.saleCode || sale.id}
                                  </div>
                                  <div
                                    className={`mt-1 text-xs ${
                                      selectedSale?.id === sale.id
                                        ? 'text-slate-200'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {sale.seller?.fullName || sale.seller?.username || 'Sotuvchi'} • {formatDateTime(sale.createdAt)}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="font-semibold">
                                    {sale.cashbox?.currency
                                      ? formatMoneyWithCurrency(sale.totalAmount, sale.cashbox.currency)
                                      : money(sale.totalAmount)}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      selectedSale?.id === sale.id
                                        ? 'text-slate-200'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {sale._count?.items || 0} ta item
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-24 items-center justify-center text-sm text-slate-500">
                          Savdo topilmadi
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Receipt size={16} className="text-slate-500" />
                      <div className="text-sm font-bold text-slate-900">
                        Qaytariladigan tovarlar
                      </div>
                    </div>

                    {selectedSaleLoading ? (
                      <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Savdo yuklanmoqda...
                      </div>
                    ) : selectedSale ? (
                      <div className="space-y-3">
                        {returnRows.map((row) => (
                          <div
                            key={row.saleItemId}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.55fr_0.55fr_0.7fr_0.8fr]">
                              <div>
                                <label className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={row.selected}
                                    disabled={row.maxReturnableQty <= 0}
                                    onChange={(e) =>
                                      updateReturnRow(row.saleItemId, {
                                        selected: e.target.checked,
                                        quantity: e.target.checked ? row.quantity || '1' : '',
                                        amount: e.target.checked ? row.amount || '0' : '',
                                      })
                                    }
                                    className="mt-1 h-4 w-4 rounded border-slate-300"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900">
                                      {row.productName}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                      {row.brand ? <span>{row.brand}</span> : null}
                                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                                        {row.sizeName}
                                      </span>
                                      <span>{row.warehouseName}</span>
                                    </div>
                                  </div>
                                </label>
                              </div>

                              <div>
                                <div className="text-xs text-slate-500">Sotilgan</div>
                                <div className="mt-1 font-semibold text-slate-900">
                                  {row.soldQty}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs text-slate-500">Qolgan qaytarish</div>
                                <div className="mt-1 font-semibold text-slate-900">
                                  {row.maxReturnableQty}
                                </div>
                              </div>

                              <div>
                                <label className="mb-2 block text-xs text-slate-500">
                                  Qaytarish soni
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max={row.maxReturnableQty}
                                  disabled={!row.selected || row.maxReturnableQty <= 0}
                                  value={row.quantity}
                                  onChange={(e) =>
                                    updateReturnRow(row.saleItemId, {
                                      quantity: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                                  placeholder="0"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-xs text-slate-500">
                                  Qaytarish summasi
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  disabled={!row.selected || row.maxReturnableQty <= 0}
                                  value={row.amount}
                                  onChange={(e) =>
                                    updateReturnRow(row.saleItemId, {
                                      amount: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                                  placeholder="0"
                                />
                              </div>
                            </div>

                            {row.maxReturnableQty <= 0 ? (
                              <div className="mt-3 text-xs font-semibold text-rose-600">
                                Bu item to‘liq qaytarilgan
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-sm text-slate-500">
                        Avval savdoni tanlang
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <Wallet size={16} className="text-slate-500" />
                      <div className="text-sm font-bold text-slate-900">
                        Qaytarish ma’lumotlari
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Sabab
                        </label>
                        <textarea
                          rows={4}
                          value={form.reason}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, reason: e.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          placeholder="Ixtiyoriy sabab"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Pul qaytariladigan kassa
                        </label>
                        <select
                          value={form.cashboxId}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, cashboxId: e.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">Pul qaytarilmasin</option>
                          {filteredCashboxes.map((cashbox) => (
                            <option key={cashbox.id} value={cashbox.id}>
                              {cashbox.name} {cashbox.currency ? `• ${cashbox.currency.code}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-bold text-slate-900">Hisob-kitob</div>

                    <div className="mt-4 space-y-3">
                      {selectedRows.length ? (
                        selectedRows.map((row) => (
                          <div
                            key={row.saleItemId}
                            className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {row.productName}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {row.sizeName} • {row.quantity} ta
                              </div>
                            </div>

                            <div className="text-right text-sm font-semibold text-slate-900">
                              {formatMoneyWithCurrency(row.amount, row.currency)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                          Hozircha item tanlanmagan
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between text-base font-black text-slate-900">
                          <span>Jami qaytarish</span>
                          <span>
                            {selectedRows[0]?.currency
                              ? formatMoneyWithCurrency(totalReturnAmount, selectedRows[0].currency)
                              : money(totalReturnAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Bekor qilish
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saqlanmoqda...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          Yaratish
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}