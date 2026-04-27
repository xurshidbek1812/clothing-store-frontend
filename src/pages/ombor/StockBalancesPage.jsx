import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Boxes,
  ChevronDown,
  ChevronUp,
  PackageSearch,
  Search,
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../lib/api';
import ImagePreviewModal from '../../components/ImagePreviewModal';

function formatQty(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('uz-UZ');
}

function resolveImageUrl(url) {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  return `${API_BASE_URL}/${url}`;
}

export default function StockBalancesPage() {
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  const [filters, setFilters] = useState({
    warehouseId: '',
    search: '',
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewImages, setPreviewImages] = useState([]);

  const loadWarehouses = async () => {
    try {
      const res = await apiFetch('/warehouses');
      setWarehouses((res || []).filter((item) => item.isActive));
    } catch (error) {
      toast.error(error.message || "Omborlar yuklanmadi");
    }
  };

  const loadBalances = async ({
    warehouseId = filters.warehouseId,
    search = filters.search,
  } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (warehouseId) params.set('warehouseId', warehouseId);
      if (search?.trim()) params.set('search', search.trim());

      const res = await apiFetch(`/stock/balances?${params.toString()}`);
      setItems(res || []);
    } catch (error) {
      toast.error(error.message || "Qoldiqlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadWarehouses();
      await loadBalances({ warehouseId: '', search: '' });
    };

    init();
  }, []);

  const totalQty = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0);
  }, [items]);

  const totalVariants = items.length;

  const openPreview = (imageUrl, title) => {
    const resolved = resolveImageUrl(imageUrl);
    if (!resolved) return;

    setPreviewImages([{ imageUrl: resolved }]);
    setPreviewTitle(title || 'Rasm');
    setPreviewOpen(true);
  };

  const toggleExpand = (productVariantId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [productVariantId]: !prev[productVariantId],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Boxes size={22} />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Tovar qoldig‘i
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Ombor va batchlar bo‘yicha qoldiq ma’lumotlari
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">Variantlar:</span>{' '}
              <span className="font-bold text-slate-900">{formatQty(totalVariants)}</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">Jami qoldiq:</span>{' '}
              <span className="font-bold text-slate-900">{formatQty(totalQty)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-[220px_1fr_auto]">
          <select
            value={filters.warehouseId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, warehouseId: e.target.value }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Barcha omborlar</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Tovar yoki brand qidiring"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => loadBalances({ warehouseId: filters.warehouseId, search: filters.search })}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Filtrlash
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Yuklanmoqda...</div>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((item) => {
              const isOpen = Boolean(expandedRows[item.productVariantId]);

              return (
                <div
                  key={item.productVariantId}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.productVariantId)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="shrink-0">
                        {item.imageUrl ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPreview(item.imageUrl, item.productName);
                            }}
                            className="block"
                          >
                            <img
                              src={resolveImageUrl(item.imageUrl)}
                              alt={item.productName}
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                          </button>
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            <PackageSearch size={18} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {item.productName}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {item.brand ? <span>{item.brand}</span> : null}
                          {item.size ? (
                            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                              {item.size}
                            </span>
                          ) : null}
                          {item.barcode ? <span>Barcode: {item.barcode}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Jami qoldiq</div>
                        <div className="text-lg font-black text-slate-900">
                          {formatQty(item.totalQuantity)}
                        </div>
                      </div>

                      <div className="text-slate-400">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500">
                              <th className="pb-3 font-semibold">Batch sanasi</th>
                              <th className="pb-3 font-semibold">Ombor</th>
                              <th className="pb-3 font-semibold">Taminotchi</th>
                              <th className="pb-3 font-semibold">Qoldiq</th>
                              <th className="pb-3 font-semibold">Tannarx</th>
                              <th className="pb-3 font-semibold">Sotuv narxi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(item.batches || []).map((batch) => (
                              <tr key={batch.batchId} className="border-b border-slate-100">
                                <td className="py-3">{formatDate(batch.createdAt)}</td>
                                <td className="py-3">{batch.warehouseName || '-'}</td>
                                <td className="py-3">{batch.supplierName || '-'}</td>
                                <td className="py-3 font-semibold text-slate-900">
                                  {formatQty(batch.remainingQuantity)}
                                </td>
                                <td className="py-3">
                                  {formatMoney(batch.costPrice)} {batch.costCurrencyCode || ''}
                                </td>
                                <td className="py-3">
                                  {formatMoney(batch.sellPrice)} {batch.sellCurrencyCode || ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            Qoldiq mavjud emas
          </div>
        )}
      </div>

      <ImagePreviewModal
        open={previewOpen}
        images={previewImages}
        title={previewTitle}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewImages([]);
          setPreviewTitle('');
        }}
      />
    </div>
  );
}