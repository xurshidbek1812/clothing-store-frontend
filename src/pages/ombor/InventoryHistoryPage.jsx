import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  History,
  Image as ImageIcon,
  Loader2,
  Search,
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../lib/api';
import ImagePreviewModal from '../../components/ImagePreviewModal';

function formatQty(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('uz-UZ');
}

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

export default function InventoryHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    warehouseId: '',
  });

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [selectedCount, setSelectedCount] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const loadWarehouses = async () => {
    try {
      const res = await apiFetch('/warehouses');
      setWarehouses((res || []).filter((item) => item.isActive));
    } catch (error) {
      toast.error(error.message || "Omborlar yuklanmadi");
    }
  };

  const loadInventoryCounts = async ({
    page = pagination.page,
    pageSize = pagination.pageSize,
    q = filters.q,
    warehouseId = filters.warehouseId,
  } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (q.trim()) params.set('q', q.trim());
      if (warehouseId) params.set('warehouseId', warehouseId);

      const res = await apiFetch(`/inventory?${params.toString()}`);

      setItems(res?.items || []);
      setPagination(
        res?.pagination || {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      toast.error(error.message || 'Sanoq tarixi yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (inventoryCountId) => {
    setDetailLoading(true);
    try {
      const res = await apiFetch(`/inventory/${inventoryCountId}`);
      setSelectedCount(res);
    } catch (error) {
      toast.error(error.message || 'Sanoq tafsiloti yuklanmadi');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadWarehouses();
      await loadInventoryCounts({ page: 1 });
    };
    init();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <History size={22} />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Sanoq tarixi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Barcha saqlangan sanoqlar ro‘yxati
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-3">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Qidirish"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

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

          <button
            type="button"
            onClick={() => loadInventoryCounts({ page: 1 })}
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
              {items.map((item) => {
                const totalSystem = (item.items || []).reduce(
                  (sum, row) => sum + Number(row.systemQuantity || 0),
                  0
                );
                const totalCounted = (item.items || []).reduce(
                  (sum, row) => sum + Number(row.countedQuantity || 0),
                  0
                );
                const diff = totalCounted - totalSystem;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openDetail(item.id)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-2">
                        <div className="text-sm font-bold text-slate-900">
                          {item.warehouse?.name || '-'}
                        </div>

                        <div className="text-xs text-slate-500">
                          {formatDateTime(item.createdAt)}
                        </div>

                        <div className="text-xs text-slate-500">
                          Yaratgan:{' '}
                          <span className="font-semibold text-slate-700">
                            {item.createdBy?.fullName || item.createdBy?.username || '-'}
                          </span>
                        </div>

                        {item.note ? (
                          <div className="text-sm text-slate-600">Izoh: {item.note}</div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-2 font-semibold text-slate-700">
                          Variantlar: {(item.items || []).length} ta
                        </span>
                        <span className="rounded-full bg-white px-3 py-2 font-semibold text-slate-700">
                          Tizim: {formatQty(totalSystem)}
                        </span>
                        <span className="rounded-full bg-white px-3 py-2 font-semibold text-slate-700">
                          Sanoq: {formatQty(totalCounted)}
                        </span>
                        <span
                          className={`rounded-full px-3 py-2 font-semibold ${
                            diff === 0
                              ? 'bg-slate-100 text-slate-700'
                              : diff > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          Farq: {diff > 0 ? '+' : ''}
                          {formatQty(diff)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="text-sm text-slate-500">
                Jami: {pagination.totalItems} ta
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadInventoryCounts({ page: pagination.page - 1 })}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  Oldingi
                </button>

                <span className="px-2 text-sm font-semibold text-slate-700">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadInventoryCounts({ page: pagination.page + 1 })}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keyingi
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            Hozircha sanoq tarixi yo‘q
          </div>
        )}
      </div>

      {selectedCount ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  Sanoq tafsiloti
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedCount.warehouse?.name || '-'} • {formatDateTime(selectedCount.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCount(null)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[calc(92vh-80px)] overflow-y-auto px-6 py-5">
              {detailLoading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  Yuklanmoqda...
                </div>
              ) : (
                <>
                  <div className="mb-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-400">Ombor</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {selectedCount.warehouse?.name || '-'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-400">Yaratgan</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {selectedCount.createdBy?.fullName ||
                          selectedCount.createdBy?.username ||
                          '-'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-400">Izoh</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {selectedCount.note || '-'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(selectedCount.items || []).map((row) => {
                      const imageUrl = row.productVariant?.product?.images?.[0]?.imageUrl
                        ? resolveImageUrl(row.productVariant.product.images[0].imageUrl)
                        : '';
                      const diff =
                        Number(row.countedQuantity || 0) - Number(row.systemQuantity || 0);

                      return (
                        <div
                          key={row.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            {imageUrl ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewImage(imageUrl);
                                  setPreviewTitle(row.productVariant?.product?.name || '');
                                  setPreviewOpen(true);
                                }}
                                className="shrink-0"
                              >
                                <img
                                  src={imageUrl}
                                  alt={row.productVariant?.product?.name || ''}
                                  className="h-14 w-14 rounded-xl object-cover"
                                />
                              </button>
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                <ImageIcon size={18} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-bold text-slate-900">
                                {row.productVariant?.product?.name || '-'}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {row.productVariant?.product?.brand || 'Brend yo‘q'}
                              </div>

                              <div className="mt-3 grid gap-2 md:grid-cols-4">
                                <div className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                                  Razmer: {row.productVariant?.size?.name || '-'}
                                </div>
                                <div className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                                  Tizim: {formatQty(row.systemQuantity)}
                                </div>
                                <div className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                                  Sanoq: {formatQty(row.countedQuantity)}
                                </div>
                                <div
                                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                    diff === 0
                                      ? 'bg-slate-100 text-slate-700'
                                      : diff > 0
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  Farq: {diff > 0 ? '+' : ''}
                                  {formatQty(diff)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ImagePreviewModal
        open={previewOpen}
        imageUrl={previewImage}
        title={previewTitle}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewImage('');
          setPreviewTitle('');
        }}
      />
    </div>
  );
}