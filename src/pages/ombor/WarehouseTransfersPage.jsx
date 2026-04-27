import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  PackageSearch,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../lib/api';
import ImagePreviewModal from '../../components/ImagePreviewModal';

const initialForm = {
  fromWarehouseId: '',
  toWarehouseId: '',
  note: '',
};

const initialSelector = {
  selectedProductId: '',
  selectedVariantId: '',
  selectedBatchId: '',
  quantity: '',
};

function formatQty(value) {
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

function getStatusBadge(status) {
  if (status === 'APPROVED') {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Tasdiqlangan
      </span>
    );
  }

  if (status === 'REJECTED') {
    return (
      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
        Rad etilgan
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      Jarayonda
    </span>
  );
}

export default function WarehouseTransfersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [decisionLoadingId, setDecisionLoadingId] = useState('');

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [warehouses, setWarehouses] = useState([]);

  const [filters, setFilters] = useState({
    q: '',
    status: '',
    warehouseId: '',
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selector, setSelector] = useState(initialSelector);
  const [cartItems, setCartItems] = useState([]);

  const [searchText, setSearchText] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [allOptions, setAllOptions] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewImages, setPreviewImages] = useState([]);

  const authRaw = localStorage.getItem('clothing_shop_auth');
  const auth = authRaw ? JSON.parse(authRaw) : null;
  const userRole = auth?.user?.role || auth?.role || '';
  const isDirector = userRole === 'DIRECTOR';

  const loadWarehouses = async () => {
    try {
      const res = await apiFetch('/warehouses');
      const activeWarehouses = (res || []).filter((item) => item.isActive);
      setWarehouses(activeWarehouses);
    } catch (error) {
      toast.error(error.message || "Omborlar yuklanmadi");
    }
  };

  const loadTransfers = async ({
    page = pagination.page,
    pageSize = pagination.pageSize,
    q = filters.q,
    status = filters.status,
    warehouseId = filters.warehouseId,
  } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      if (q?.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      if (warehouseId) params.set('warehouseId', warehouseId);

      const res = await apiFetch(`/stock/warehouse-transfers?${params.toString()}`);

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
      toast.error(error.message || "O'tkazmalar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadWarehouses();
      await loadTransfers({ page: 1 });
    };

    init();
  }, []);

  const groupedAllProducts = useMemo(() => {
    const map = new Map();

    for (const row of allOptions) {
      const productId = row.productId;
      if (!productId) continue;

      const normalizedImages = (row.images || [])
        .map((image) => ({
          ...image,
          imageUrl: resolveImageUrl(image?.imageUrl || ''),
        }))
        .filter((image) => image.imageUrl);

      const normalizedImageUrl = resolveImageUrl(row.imageUrl || '');

      if (!map.has(productId)) {
        map.set(productId, {
          productId,
          productName: row.productName,
          brand: row.brand || '',
          imageUrl: normalizedImageUrl,
          images: normalizedImages,
          variants: [],
          totalQuantity: 0,
        });
      }

      const current = map.get(productId);
      current.variants.push(row);
      current.totalQuantity += Number(row.totalQuantity || 0);

      if ((!current.images || !current.images.length) && normalizedImages.length) {
        current.images = normalizedImages;
      }

      if (!current.imageUrl && normalizedImageUrl) {
        current.imageUrl = normalizedImageUrl;
      }
    }

    return Array.from(map.values());
  }, [allOptions]);

  const groupedSearchResults = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    if (!q) return [];

    return groupedAllProducts.filter((product) => {
      const name = (product.productName || '').toLowerCase();
      const brand = (product.brand || '').toLowerCase();
      const variantText = (product.variants || [])
        .map((v) => `${v.size || ''} ${v.barcode || ''}`.toLowerCase())
        .join(' ');

      return name.includes(q) || brand.includes(q) || variantText.includes(q);
    });
  }, [groupedAllProducts, searchText]);

  const selectedProduct = useMemo(() => {
    return (
      groupedAllProducts.find((item) => item.productId === selector.selectedProductId) || null
    );
  }, [groupedAllProducts, selector.selectedProductId]);

  const selectedVariant = useMemo(() => {
    return (
      selectedProduct?.variants.find(
        (variant) => variant.productVariantId === selector.selectedVariantId
      ) || null
    );
  }, [selectedProduct, selector.selectedVariantId]);

  const availableBatches = useMemo(() => {
    return (selectedVariant?.batches || []).filter(
      (batch) => Number(batch.remainingQuantity || 0) > 0
    );
  }, [selectedVariant]);

  const selectedBatch = useMemo(() => {
    return (
      availableBatches.find((batch) => batch.batchId === selector.selectedBatchId) || null
    );
  }, [availableBatches, selector.selectedBatchId]);

  const resetSelector = () => {
    setSelector(initialSelector);
  };

  const loadWarehouseOptions = async (warehouseId) => {
    if (!warehouseId) {
      setAllOptions([]);
      return;
    }

    setOptionsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('fromWarehouseId', warehouseId);

      const res = await apiFetch(`/stock/warehouse-transfer-options?${params.toString()}`);
      setAllOptions(res || []);
    } catch (error) {
      toast.error(error.message || "Tovarlar yuklanmadi");
      setAllOptions([]);
    } finally {
      setOptionsLoading(false);
    }
  };

  const openCreateModal = () => {
    setCreateOpen(true);
    setForm({
      fromWarehouseId: '',
      toWarehouseId: '',
      note: '',
    });
    setCartItems([]);
    setSearchText('');
    setAllOptions([]);
    resetSelector();
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setForm(initialForm);
    setCartItems([]);
    setSearchText('');
    setAllOptions([]);
    resetSelector();
  };

  const openPreview = (images = [], title = '') => {
    const safeImages = (images || [])
      .map((item) =>
        typeof item === 'string'
          ? { imageUrl: resolveImageUrl(item) }
          : {
              ...item,
              imageUrl: resolveImageUrl(item?.imageUrl || ''),
            }
      )
      .filter((item) => item.imageUrl);

    if (!safeImages.length) return;

    setPreviewImages(safeImages);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const handleSelectProduct = (productId) => {
    setSelector({
      selectedProductId: productId,
      selectedVariantId: '',
      selectedBatchId: '',
      quantity: '',
    });
  };

  const handleVariantChange = (variantId) => {
    const nextVariant =
      selectedProduct?.variants.find((variant) => variant.productVariantId === variantId) || null;

    const nextBatches = (nextVariant?.batches || []).filter(
      (batch) => Number(batch.remainingQuantity || 0) > 0
    );

    setSelector((prev) => ({
      ...prev,
      selectedVariantId: variantId,
      selectedBatchId: nextBatches.length === 1 ? nextBatches[0].batchId : '',
      quantity: '',
    }));
  };

  const handleBatchChange = (batchId) => {
    setSelector((prev) => ({
      ...prev,
      selectedBatchId: batchId,
      quantity: '',
    }));
  };

  const handleAddToCart = () => {
    const quantity = Number(selector.quantity);

    if (!form.fromWarehouseId) {
      toast.error("Avval chiqim bo'ladigan omborni tanlang");
      return;
    }

    if (!selector.selectedProductId) {
      toast.error('Avval qidiruv natijasidan tovar tanlang');
      return;
    }

    if (!selector.selectedVariantId) {
      toast.error('Razmer tanlang');
      return;
    }

    if (!selector.selectedBatchId) {
      toast.error('Kirim tanlang');
      return;
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      toast.error("Soni to'g'ri kiritilishi kerak");
      return;
    }

    if (!selectedProduct || !selectedVariant || !selectedBatch) {
      toast.error("Tanlangan ma'lumot topilmadi");
      return;
    }

    const batchRemaining = Number(selectedBatch.remainingQuantity || 0);

    if (quantity > batchRemaining) {
      toast.error(`Bu kirimda yetarli qoldiq yo‘q. Mavjud: ${batchRemaining}`);
      return;
    }

    const existingIndex = cartItems.findIndex(
      (item) =>
        item.productVariantId === selectedVariant.productVariantId &&
        item.sourceBatchId === selectedBatch.batchId
    );

    if (existingIndex >= 0) {
      const existing = cartItems[existingIndex];
      const nextQty = Number(existing.quantity) + quantity;

      if (nextQty > batchRemaining) {
        toast.error(`Umumiy miqdor batch qoldig‘idan oshib ketdi`);
        return;
      }

      const nextCart = [...cartItems];
      nextCart[existingIndex] = {
        ...existing,
        quantity: nextQty,
      };
      setCartItems(nextCart);
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          productId: selectedProduct.productId,
          productName: selectedProduct.productName,
          brand: selectedProduct.brand,
          imageUrl: selectedProduct.imageUrl || '',
          images: selectedProduct.images || [],
          productVariantId: selectedVariant.productVariantId,
          sizeName: selectedVariant.size,
          sourceBatchId: selectedBatch.batchId,
          sourceBatchDate: selectedBatch.createdAt,
          supplierName: selectedBatch.supplierName || '',
          quantity,
        },
      ]);
    }

    setSearchText('');
    resetSelector();
    toast.success("Tovar ro'yxatga qo'shildi");
  };

  const removeCartItem = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();

    if (!form.fromWarehouseId) {
      toast.error("Qaysi ombordan tanlang");
      return;
    }

    if (!form.toWarehouseId) {
      toast.error("Qaysi omborga tanlang");
      return;
    }

    if (form.fromWarehouseId === form.toWarehouseId) {
      toast.error("Jo'natuvchi va qabul qiluvchi ombor bir xil bo'lmasin");
      return;
    }

    if (!cartItems.length) {
      toast.error("Kamida bitta tovar qo'shing");
      return;
    }

    const payload = {
      fromWarehouseId: form.fromWarehouseId,
      toWarehouseId: form.toWarehouseId,
      note: form.note.trim() || undefined,
      items: cartItems.map((item) => ({
        productVariantId: item.productVariantId,
        sourceBatchId: item.sourceBatchId,
        quantity: Number(item.quantity),
      })),
    };

    setSaving(true);
    try {
      await apiFetch('/stock/warehouse-transfers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success("O'tkazma yaratildi");
      closeCreateModal();
      await loadTransfers({ page: 1 });
    } catch (error) {
      toast.error(error.message || "O'tkazma yaratishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const approveTransfer = async (transferId) => {
    setDecisionLoadingId(transferId);
    try {
      await apiFetch(`/stock/warehouse-transfers/${transferId}/approve`, {
        method: 'POST',
      });
      toast.success("O'tkazma tasdiqlandi");
      await loadTransfers();
    } catch (error) {
      toast.error(error.message || 'Tasdiqlashda xatolik');
    } finally {
      setDecisionLoadingId('');
    }
  };

  const rejectTransfer = async (transferId) => {
    setDecisionLoadingId(transferId);
    try {
      await apiFetch(`/stock/warehouse-transfers/${transferId}/reject`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success("O'tkazma rad etildi");
      await loadTransfers();
    } catch (error) {
      toast.error(error.message || 'Rad etishda xatolik');
    } finally {
      setDecisionLoadingId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <ArrowRightLeft size={22} />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Ombor o‘tkazmalari
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Omborlar orasida tovar o‘tkazish tarixi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Yangi o‘tkazma yaratish
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-4">
          <input
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Qidirish"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Barcha holatlar</option>
            <option value="PENDING">Jarayonda</option>
            <option value="APPROVED">Tasdiqlangan</option>
            <option value="REJECTED">Rad etilgan</option>
          </select>

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
            onClick={() => loadTransfers({ page: 1 })}
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
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(item.status)}
                        <span className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString('uz-UZ')}
                        </span>
                      </div>

                      <div className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">
                          {item.fromWarehouse?.name || '-'}
                        </span>
                        <span className="mx-2">→</span>
                        <span className="font-semibold text-slate-900">
                          {item.toWarehouse?.name || '-'}
                        </span>
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

                    {isDirector && item.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={decisionLoadingId === item.id}
                          onClick={() => approveTransfer(item.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-70"
                        >
                          <CheckCircle2 size={16} />
                          Tasdiqlash
                        </button>

                        <button
                          type="button"
                          disabled={decisionLoadingId === item.id}
                          onClick={() => rejectTransfer(item.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-70"
                        >
                          <XCircle size={16} />
                          Rad etish
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500">
                          <th className="pb-2 font-semibold">Tovar</th>
                          <th className="pb-2 font-semibold">Razmer</th>
                          <th className="pb-2 font-semibold">Kirim</th>
                          <th className="pb-2 font-semibold">Soni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(item.items || []).map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="py-2">
                              {row.productVariant?.product?.name || '-'}
                            </td>
                            <td className="py-2">
                              {row.productVariant?.size?.name || '-'}
                            </td>
                            <td className="py-2">
                              {formatDate(row.sourceBatch?.createdAt)}
                            </td>
                            <td className="py-2 font-semibold">
                              {formatQty(row.quantity)}
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
                  onClick={() => loadTransfers({ page: pagination.page - 1 })}
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
                  onClick={() => loadTransfers({ page: pagination.page + 1 })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            Hozircha o‘tkazmalar yo‘q
          </div>
        )}
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  Yangi o‘tkazma yaratish
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Avval ombor tanlanadi, keyin shu ombordagi tovarlar qidiriladi
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
              onSubmit={handleCreateTransfer}
              className="max-h-[calc(92vh-80px)] overflow-y-auto px-6 py-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Qaysi ombordan
                  </label>
                  <select
                    value={form.fromWarehouseId}
                    onChange={async (e) => {
                      const nextWarehouseId = e.target.value;

                      setForm((prev) => ({
                        ...prev,
                        fromWarehouseId: nextWarehouseId,
                      }));

                      setSearchText('');
                      setAllOptions([]);
                      resetSelector();
                      setCartItems([]);

                      if (nextWarehouseId) {
                        await loadWarehouseOptions(nextWarehouseId);
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Ombor tanlang</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Qaysi omborga
                  </label>
                  <select
                    value={form.toWarehouseId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, toWarehouseId: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Ombor tanlang</option>
                    {warehouses
                      .filter((warehouse) => warehouse.id !== form.fromWarehouseId)
                      .map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
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
                  placeholder="Ixtiyoriy izoh"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 text-sm font-bold text-slate-900">
                  Tovar qo‘shish
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr_1.2fr_0.7fr_auto]">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tovar qidirish
                    </label>
                    <div className="relative">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={
                          form.fromWarehouseId
                            ? 'Tovar nomi yoki brand yozing'
                            : "Avval chiqim bo'ladigan omborni tanlang"
                        }
                        disabled={!form.fromWarehouseId || optionsLoading}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Razmer
                    </label>
                    <select
                      value={selector.selectedVariantId}
                      onChange={(e) => handleVariantChange(e.target.value)}
                      disabled={!form.fromWarehouseId || !selector.selectedProductId}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="">Razmer tanlang</option>
                      {(selectedProduct?.variants || []).map((variant) => (
                        <option
                          key={variant.productVariantId}
                          value={variant.productVariantId}
                        >
                          {variant.size} • Qoldiq: {formatQty(variant.totalQuantity)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Kirim
                    </label>
                    <select
                      value={selector.selectedBatchId}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      disabled={!form.fromWarehouseId || !selector.selectedVariantId}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="">Kirim tanlang</option>
                      {availableBatches.map((batch) => (
                        <option key={batch.batchId} value={batch.batchId}>
                          {formatDate(batch.createdAt)} • Qoldiq: {formatQty(batch.remainingQuantity)}
                          {batch.supplierName ? ` • ${batch.supplierName}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Soni
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={selector.quantity}
                      onChange={(e) =>
                        setSelector((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!form.fromWarehouseId}
                      className="inline-flex h-[50px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={16} />
                      Qo‘shish
                    </button>
                  </div>
                </div>

                {form.fromWarehouseId ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <PackageSearch size={16} />
                      {optionsLoading ? "Tovarlar yuklanmoqda..." : 'Qidiruv natijalari'}
                    </div>

                    {optionsLoading ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                        <Loader2 size={16} className="animate-spin" />
                        Yuklanmoqda...
                      </div>
                    ) : !searchText.trim() ? (
                      <div className="py-6 text-sm text-slate-400">
                        Tovar qidirish uchun nom yozing
                      </div>
                    ) : groupedSearchResults.length ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {groupedSearchResults.map((product) => (
                          <div
                            key={product.productId}
                            className={`rounded-2xl border p-4 transition ${
                              selector.selectedProductId === product.productId
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0">
                                {product.images?.length ? (
                                  <button
                                    type="button"
                                    onClick={() => openPreview(product.images, product.productName)}
                                    className="block"
                                  >
                                    <img
                                      src={product.images[0].imageUrl}
                                      alt={product.productName}
                                      className="h-14 w-14 rounded-xl object-cover"
                                    />
                                  </button>
                                ) : product.imageUrl ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPreview(
                                        [{ imageUrl: product.imageUrl }],
                                        product.productName
                                      )
                                    }
                                    className="block"
                                  >
                                    <img
                                      src={product.imageUrl}
                                      alt={product.productName}
                                      className="h-14 w-14 rounded-xl object-cover"
                                    />
                                  </button>
                                ) : (
                                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                    <PackageSearch size={18} />
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSelectProduct(product.productId)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="truncate text-sm font-bold text-slate-900">
                                  {product.productName}
                                </div>

                                {product.brand ? (
                                  <div className="mt-1 text-xs text-slate-500">
                                    {product.brand}
                                  </div>
                                ) : null}

                                <div className="mt-2 text-xs text-slate-500">
                                  Razmerlar: {product.variants.length} ta
                                </div>

                                <div className="mt-1 text-xs font-semibold text-slate-700">
                                  Jami qoldiq: {formatQty(product.totalQuantity)}
                                </div>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-sm text-slate-500">
                        Bu omborda qidiruvga mos tovar topilmadi
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-bold text-slate-900">Qo‘shilgan tovarlar</div>

                {cartItems.length ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-slate-500">
                          <th className="pb-3 font-semibold">Tovar</th>
                          <th className="pb-3 font-semibold">Razmer</th>
                          <th className="pb-3 font-semibold">Kirim</th>
                          <th className="pb-3 font-semibold">Soni</th>
                          <th className="pb-3 text-right font-semibold">Amal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item, index) => (
                          <tr
                            key={`${item.productVariantId}-${item.sourceBatchId}-${index}`}
                            className="border-b border-slate-50"
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                {item.images?.length ? (
                                  <button
                                    type="button"
                                    onClick={() => openPreview(item.images, item.productName)}
                                    className="shrink-0"
                                  >
                                    <img
                                      src={item.images[0].imageUrl}
                                      alt={item.productName}
                                      className="h-11 w-11 rounded-lg object-cover"
                                    />
                                  </button>
                                ) : item.imageUrl ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPreview([{ imageUrl: item.imageUrl }], item.productName)
                                    }
                                    className="shrink-0"
                                  >
                                    <img
                                      src={item.imageUrl}
                                      alt={item.productName}
                                      className="h-11 w-11 rounded-lg object-cover"
                                    />
                                  </button>
                                ) : null}

                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {item.productName}
                                  </div>
                                  {item.brand ? (
                                    <div className="text-xs text-slate-500">{item.brand}</div>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="py-3">{item.sizeName}</td>
                            <td className="py-3">
                              {formatDate(item.sourceBatchDate)}
                              {item.supplierName ? ` • ${item.supplierName}` : ''}
                            </td>
                            <td className="py-3 font-semibold">
                              {formatQty(item.quantity)}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeCartItem(index)}
                                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                              >
                                <Trash2 size={14} />
                                O‘chirish
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                    Hozircha tovar qo‘shilmagan
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
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
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {saving ? 'Saqlanmoqda...' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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