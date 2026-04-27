import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../lib/api';
import ImagePreviewModal from '../../components/ImagePreviewModal';

const initialForm = {
  fromWarehouseId: '',
  toStoreId: '',
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
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

function getStatusBadge(status) {
  if (status === 'IN_TRANSIT') {
    return (
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
        Kutilmoqda
      </span>
    );
  }

  if (status === 'RECEIVED') {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Qabul qilingan
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

export default function OutToOtherStorePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [warehouses, setWarehouses] = useState([]);
  const [targetStores, setTargetStores] = useState([]);
  const [targetWarehouses, setTargetWarehouses] = useState([]);

  const [filters, setFilters] = useState({
    q: '',
    status: '',
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [selector, setSelector] = useState(initialSelector);
  const [cartItems, setCartItems] = useState([]);

  const [searchText, setSearchText] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [sourceProducts, setSourceProducts] = useState([]);

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

  const loadOutgoingTransfers = async ({
    page = pagination.page,
    pageSize = pagination.pageSize,
    q = filters.q,
    status = filters.status,
  } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (q?.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);

      const res = await apiFetch(`/inter-store-transfers/outgoing?${params.toString()}`);

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
      toast.error(error.message || "Jo'natmalar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadWarehouses(), loadOutgoingTransfers({ page: 1 })]);
    };
    init();
  }, []);

  const resetSelector = () => {
    setSelector(initialSelector);
  };

  const loadTransferOptions = async (fromWarehouseId, q = '') => {
    if (!fromWarehouseId) {
      setTargetStores([]);
      setTargetWarehouses([]);
      setSourceProducts([]);
      return;
    }

    setOptionsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('fromWarehouseId', fromWarehouseId);
      if (q.trim()) params.set('q', q.trim());

      const res = await apiFetch(`/inter-store-transfers/options?${params.toString()}`);

      const warehousesFromApi = res?.targetWarehouses || [];
      const uniqueStoresMap = new Map();

      for (const warehouse of warehousesFromApi) {
        if (warehouse.store?.id && !uniqueStoresMap.has(warehouse.store.id)) {
          uniqueStoresMap.set(warehouse.store.id, warehouse.store);
        }
      }

      setTargetStores(Array.from(uniqueStoresMap.values()));
      setTargetWarehouses(warehousesFromApi);
      setSourceProducts(res?.sourceProducts || []);
    } catch (error) {
      toast.error(error.message || "Variantlar yuklanmadi");
      setTargetStores([]);
      setTargetWarehouses([]);
      setSourceProducts([]);
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    if (!createOpen) return;
    if (!form.fromWarehouseId) {
      setTargetStores([]);
      setTargetWarehouses([]);
      setSourceProducts([]);
      return;
    }

    const timer = setTimeout(() => {
      loadTransferOptions(form.fromWarehouseId, searchText);
    }, 250);

    return () => clearTimeout(timer);
  }, [createOpen, form.fromWarehouseId, searchText]);

  const groupedProducts = useMemo(() => {
    const map = new Map();

    for (const row of sourceProducts) {
      const productId = row.productId;
      if (!productId) continue;

      if (!map.has(productId)) {
        map.set(productId, {
          productId,
          productName: row.productName,
          brand: row.brand || '',
          imageUrl: resolveImageUrl(row.imageUrl || ''),
          variants: [],
          totalQuantity: 0,
        });
      }

      const current = map.get(productId);
      current.variants.push({
        ...row,
        imageUrl: resolveImageUrl(row.imageUrl || ''),
      });
      current.totalQuantity += Number(row.remainingQuantity || 0);
    }

    return Array.from(map.values());
  }, [sourceProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];

    return groupedProducts.filter((product) => {
      const name = String(product.productName || '').toLowerCase();
      const brand = String(product.brand || '').toLowerCase();
      const variantsText = (product.variants || [])
        .map((v) => `${v.size || ''} ${v.barcode || ''}`.toLowerCase())
        .join(' ');

      return name.includes(q) || brand.includes(q) || variantsText.includes(q);
    });
  }, [groupedProducts, searchText]);

  const selectedProduct = useMemo(() => {
    return groupedProducts.find((item) => item.productId === selector.selectedProductId) || null;
  }, [groupedProducts, selector.selectedProductId]);

  const selectedVariant = useMemo(() => {
    return (
      selectedProduct?.variants.find(
        (variant) => variant.productVariantId === selector.selectedVariantId
      ) || null
    );
  }, [selectedProduct, selector.selectedVariantId]);

  const availableBatches = useMemo(() => {
    return (selectedProduct?.variants || [])
      .filter((variant) => variant.productVariantId === selector.selectedVariantId)
      .filter((variant) => Number(variant.remainingQuantity || 0) > 0);
  }, [selectedProduct, selector.selectedVariantId]);

  const selectedBatch = useMemo(() => {
    return availableBatches.find((batch) => batch.batchId === selector.selectedBatchId) || null;
  }, [availableBatches, selector.selectedBatchId]);

  const filteredTargetWarehouses = useMemo(() => {
    if (!form.toStoreId) return [];
    return targetWarehouses.filter((warehouse) => warehouse.storeId === form.toStoreId);
  }, [targetWarehouses, form.toStoreId]);

  const openCreateModal = async () => {
    setEditingItem(null);
    setCreateOpen(true);
    setForm(initialForm);
    setCartItems([]);
    setSearchText('');
    setTargetStores([]);
    setTargetWarehouses([]);
    setSourceProducts([]);
    resetSelector();
  };

  const closeCreateModal = () => {
    setEditingItem(null);
    setCreateOpen(false);
    setForm(initialForm);
    setCartItems([]);
    setSearchText('');
    setTargetStores([]);
    setTargetWarehouses([]);
    setSourceProducts([]);
    resetSelector();
  };

  const openEditModal = async (item) => {
    if (item.status !== 'PENDING') {
      toast.error('Faqat jarayondagi jo‘natmani tahrirlash mumkin');
      return;
    }

    setEditingItem(item);
    setCreateOpen(true);
    setForm({
      fromWarehouseId: item.fromWarehouseId || '',
      toStoreId: item.toStoreId || '',
      toWarehouseId: item.toWarehouseId || '',
      note: item.note || '',
    });

    await loadTransferOptions(item.fromWarehouseId, '');

    setCartItems(
      (item.items || []).map((row) => ({
        productId: row.productVariant?.product?.id || '',
        productName: row.productVariant?.product?.name || '',
        brand: row.productVariant?.product?.brand || '',
        imageUrl: row.productVariant?.product?.images?.[0]?.imageUrl
          ? resolveImageUrl(row.productVariant.product.images[0].imageUrl)
          : '',
        productVariantId: row.productVariantId,
        sizeName: row.productVariant?.size?.name || '',
        sourceBatchId: row.sourceBatchId,
        batchDate: row.sourceBatch?.createdAt,
        quantity: Number(row.quantity || 0),
        remainingQuantity: Number(row.sourceBatch?.remainingQuantity || 0),
      }))
    );

    setSearchText('');
    resetSelector();
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
    const variantBatches = (selectedProduct?.variants || []).filter(
      (variant) =>
        variant.productVariantId === variantId && Number(variant.remainingQuantity || 0) > 0
    );

    setSelector((prev) => ({
      ...prev,
      selectedVariantId: variantId,
      selectedBatchId: variantBatches.length === 1 ? variantBatches[0].batchId : '',
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
      toast.error("Avval jo'natuvchi omborni tanlang");
      return;
    }

    if (!form.toStoreId) {
      toast.error("Avval qabul qiluvchi do'konni tanlang");
      return;
    }

    if (!form.toWarehouseId) {
      toast.error("Avval qabul qiluvchi omborni tanlang");
      return;
    }

    if (!selector.selectedProductId) {
      toast.error('Avval tovar tanlang');
      return;
    }

    if (!selector.selectedVariantId) {
      toast.error('Razmer tanlang');
      return;
    }

    if (!selector.selectedBatchId) {
      toast.error('Batch tanlang');
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

    const existingIndex = cartItems.findIndex(
      (item) =>
        item.productVariantId === selectedVariant.productVariantId &&
        item.sourceBatchId === selectedBatch.batchId
    );

    const existingQty = existingIndex >= 0 ? Number(cartItems[existingIndex].quantity || 0) : 0;

    if (existingQty + quantity > batchRemaining) {
      toast.error(`Batch qoldig'i yetarli emas. Mavjud: ${batchRemaining}`);
      return;
    }

    if (existingIndex >= 0) {
      const next = [...cartItems];
      next[existingIndex] = {
        ...next[existingIndex],
        quantity: existingQty + quantity,
      };
      setCartItems(next);
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          productId: selectedProduct.productId,
          productName: selectedProduct.productName,
          brand: selectedProduct.brand,
          imageUrl: selectedProduct.imageUrl || '',
          productVariantId: selectedVariant.productVariantId,
          sizeName: selectedVariant.size || '',
          sourceBatchId: selectedBatch.batchId,
          batchDate: selectedBatch.createdAt,
          quantity,
          remainingQuantity: batchRemaining,
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

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();

    if (!form.fromWarehouseId) {
      toast.error("Jo'natuvchi omborni tanlang");
      return;
    }

    if (!form.toStoreId) {
      toast.error("Qabul qiluvchi do'konni tanlang");
      return;
    }

    if (!form.toWarehouseId) {
      toast.error("Qabul qiluvchi omborni tanlang");
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
      if (editingItem?.id) {
        await apiFetch(`/inter-store-transfers/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success("Jo'natma yangilandi");
      } else {
        await apiFetch('/inter-store-transfers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success("Jo'natma yaratildi");
      }

      closeCreateModal();
      await loadOutgoingTransfers({ page: 1 });
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const sendTransfer = async (transferId) => {
    setActionLoadingId(transferId);
    try {
      await apiFetch(`/inter-store-transfers/${transferId}/send`, {
        method: 'POST',
      });
      toast.success("Jo'natma yuborildi");
      await loadOutgoingTransfers();
    } catch (error) {
      toast.error(error.message || 'Yuborishda xatolik');
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Send size={22} />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Boshqa omborga chiqim
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Boshqa do‘kon omboriga jo‘natmalar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Yangi jo‘natma
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-3">
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
            <option value="IN_TRANSIT">Kutilmoqda</option>
            <option value="RECEIVED">Qabul qilingan</option>
            <option value="REJECTED">Rad etilgan</option>
          </select>

          <button
            type="button"
            onClick={() => loadOutgoingTransfers({ page: 1 })}
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
                          {item.toStore?.name || '-'} / {item.toWarehouse?.name || '-'}
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

                    {item.status === 'PENDING' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          <Pencil size={16} />
                          Tahrirlash
                        </button>

                        <button
                          type="button"
                          disabled={actionLoadingId === item.id}
                          onClick={() => sendTransfer(item.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-70"
                        >
                          {actionLoadingId === item.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Yuborish
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
                          <th className="pb-2 font-semibold">Batch</th>
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
                  onClick={() =>
                    loadOutgoingTransfers({ page: pagination.page - 1 })
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
                    loadOutgoingTransfers({ page: pagination.page + 1 })
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
            Hozircha jo‘natmalar yo‘q
          </div>
        )}
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  {editingItem ? "Jo'natmani tahrirlash" : "Yangi jo'natma yaratish"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Avval jo‘natuvchi ombor, keyin qabul qiluvchi do‘kon va ombor tanlanadi
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
              onSubmit={handleSubmitTransfer}
              className="max-h-[calc(92vh-80px)] overflow-y-auto px-6 py-5"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Jo'natuvchi ombor
                  </label>
                  <select
                    value={form.fromWarehouseId}
                    onChange={(e) => {
                      const nextFromWarehouseId = e.target.value;

                      setForm((prev) => ({
                        ...prev,
                        fromWarehouseId: nextFromWarehouseId,
                        toStoreId: '',
                        toWarehouseId: '',
                      }));

                      setSearchText('');
                      setTargetStores([]);
                      setTargetWarehouses([]);
                      setSourceProducts([]);
                      setCartItems([]);
                      resetSelector();
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
                    Qabul qiluvchi do'kon
                  </label>
                  <select
                    value={form.toStoreId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        toStoreId: e.target.value,
                        toWarehouseId: '',
                      }))
                    }
                    disabled={!form.fromWarehouseId}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                  >
                    <option value="">Do'kon tanlang</option>
                    {targetStores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Qabul qiluvchi ombor
                  </label>
                  <select
                    value={form.toWarehouseId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        toWarehouseId: e.target.value,
                      }))
                    }
                    disabled={!form.toStoreId}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                  >
                    <option value="">Ombor tanlang</option>
                    {filteredTargetWarehouses.map((warehouse) => (
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
                            : "Avval jo'natuvchi omborni tanlang"
                        }
                        disabled={!form.fromWarehouseId || optionsLoading}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
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
                      disabled={!selector.selectedProductId}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="">Razmer tanlang</option>
                      {(selectedProduct?.variants || [])
                        .filter((item) => Number(item.remainingQuantity || 0) > 0)
                        .map((variant) => (
                          <option
                            key={`${variant.productVariantId}-${variant.batchId}`}
                            value={variant.productVariantId}
                          >
                            {variant.size} • Qoldiq: {formatQty(variant.remainingQuantity)}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Batch
                    </label>
                    <select
                      value={selector.selectedBatchId}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      disabled={!selector.selectedVariantId}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="">Batch tanlang</option>
                      {availableBatches.map((batch) => (
                        <option key={batch.batchId} value={batch.batchId}>
                          {formatDate(batch.createdAt)} • Qoldiq: {formatQty(batch.remainingQuantity)}
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
                      disabled={!form.fromWarehouseId || !form.toStoreId || !form.toWarehouseId}
                      className="inline-flex h-[50px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
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
                      {optionsLoading ? 'Tovarlar yuklanmoqda...' : 'Qidiruv natijalari'}
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
                    ) : filteredProducts.length ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {filteredProducts.map((product) => (
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
                                {product.imageUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreviewImage(product.imageUrl);
                                      setPreviewTitle(product.productName);
                                      setPreviewOpen(true);
                                    }}
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
                                    <ImageIcon size={18} />
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
                        Qidiruvga mos tovar topilmadi
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 text-sm font-bold text-slate-900">
                  Qo‘shilgan tovarlar
                </div>

                {cartItems.length ? (
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <div
                        key={`${item.productVariantId}-${item.sourceBatchId}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            {item.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewImage(item.imageUrl);
                                  setPreviewTitle(item.productName);
                                  setPreviewOpen(true);
                                }}
                                className="shrink-0"
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="h-14 w-14 rounded-xl object-cover"
                                />
                              </button>
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                <ImageIcon size={18} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900">
                                {item.productName}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {item.brand || 'Brend yo‘q'}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                <span className="rounded-full bg-white px-2 py-1">
                                  Razmer: {item.sizeName || '-'}
                                </span>
                                <span className="rounded-full bg-white px-2 py-1">
                                  Batch: {formatDate(item.batchDate)}
                                </span>
                                <span className="rounded-full bg-white px-2 py-1">
                                  Soni: {formatQty(item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartItem(index)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Hozircha tovar qo‘shilmagan
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-3">
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
                  {saving ? 'Saqlanmoqda...' : editingItem ? 'Yangilash' : 'Yaratish'}
                </button>
              </div>
            </form>
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