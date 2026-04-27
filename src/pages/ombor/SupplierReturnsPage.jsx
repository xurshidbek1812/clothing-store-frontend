import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Loader2,
  PackageSearch,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../lib/api';
import ImagePreviewModal from '../../components/ImagePreviewModal';

const initialForm = {
  warehouseId: '',
  supplierId: '',
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

export default function SupplierReturnsPage() {
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
  const [suppliers, setSuppliers] = useState([]);

  const [filters, setFilters] = useState({
    q: '',
    status: '',
    warehouseId: '',
    supplierId: '',
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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
  const isDirector = userRole === 'DIRECTOR' || userRole === 'OWNER';

  const loadWarehouses = async () => {
    try {
      const res = await apiFetch('/warehouses');
      const activeWarehouses = (res || []).filter((item) => item.isActive);
      setWarehouses(activeWarehouses);
    } catch (error) {
      toast.error(error.message || "Omborlar yuklanmadi");
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await apiFetch('/suppliers');
      const activeSuppliers = (res || []).filter((item) => item.isActive);
      setSuppliers(activeSuppliers);
    } catch (error) {
      toast.error(error.message || "Taminotchilar yuklanmadi");
    }
  };

  const loadReturns = async ({
    page = pagination.page,
    pageSize = pagination.pageSize,
    q = filters.q,
    status = filters.status,
    warehouseId = filters.warehouseId,
    supplierId = filters.supplierId,
  } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      if (q?.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      if (warehouseId) params.set('warehouseId', warehouseId);
      if (supplierId) params.set('supplierId', supplierId);

      const res = await apiFetch(`/stock/supplier-returns?${params.toString()}`);

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
      toast.error(error.message || "Qaytarishlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadWarehouses(), loadSuppliers()]);
      await loadReturns({ page: 1 });
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
    return groupedAllProducts.find((item) => item.productId === selector.selectedProductId) || null;
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
    return availableBatches.find((batch) => batch.batchId === selector.selectedBatchId) || null;
  }, [availableBatches, selector.selectedBatchId]);

  const resetSelector = () => {
    setSelector(initialSelector);
  };

  const loadSupplierReturnOptions = async (warehouseId, supplierId) => {
    if (!warehouseId || !supplierId) {
      setAllOptions([]);
      return [];
    }

    setOptionsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('warehouseId', warehouseId);
      params.set('supplierId', supplierId);

      const res = await apiFetch(`/stock/supplier-return-options?${params.toString()}`);
      const rows = res || [];
      setAllOptions(rows);
      return rows;
    } catch (error) {
      toast.error(error.message || "Tovarlar yuklanmadi");
      setAllOptions([]);
      return [];
    } finally {
      setOptionsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setCreateOpen(true);
    setForm(initialForm);
    setCartItems([]);
    setSearchText('');
    setAllOptions([]);
    resetSelector();
  };

  const closeCreateModal = () => {
    setEditingItem(null);
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

    if (!form.warehouseId) {
      toast.error("Avval omborni tanlang");
      return;
    }

    if (!form.supplierId) {
      toast.error("Avval taminotchini tanlang");
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

    if (quantity > batchRemaining) {
      toast.error(`Bu batchda yetarli qoldiq yo‘q. Mavjud: ${batchRemaining}`);
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
        toast.error("Umumiy miqdor batch qoldig‘idan oshib ketdi");
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

  const openEditModal = async (item) => {
    if (item.status !== 'PENDING') {
      toast.error('Faqat jarayondagi qaytarishni tahrirlash mumkin');
      return;
    }

    setEditingItem(item);
    setCreateOpen(true);

    setForm({
      warehouseId: item.warehouseId || '',
      supplierId: item.supplierId || '',
      note: item.note || '',
    });

    await loadSupplierReturnOptions(item.warehouseId, item.supplierId);

    setCartItems(
      (item.items || []).map((row) => ({
        productId: row.productVariant?.product?.id || '',
        productName: row.productVariant?.product?.name || '',
        brand: row.productVariant?.product?.brand || '',
        imageUrl: row.productVariant?.product?.images?.[0]?.imageUrl
          ? resolveImageUrl(row.productVariant.product.images[0].imageUrl)
          : '',
        images: (row.productVariant?.product?.images || []).map((image) => ({
          ...image,
          imageUrl: resolveImageUrl(image.imageUrl),
        })),
        productVariantId: row.productVariantId,
        sizeName: row.productVariant?.size?.name || '',
        sourceBatchId: row.sourceBatchId,
        sourceBatchDate: row.sourceBatch?.createdAt,
        supplierName: item.supplier?.name || '',
        quantity: Number(row.quantity || 0),
      }))
    );

    setSearchText('');
    resetSelector();
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();

    if (!form.warehouseId) {
      toast.error("Omborni tanlang");
      return;
    }

    if (!form.supplierId) {
      toast.error("Taminotchini tanlang");
      return;
    }

    if (!cartItems.length) {
      toast.error("Kamida bitta tovar qo'shing");
      return;
    }

    const payload = {
      warehouseId: form.warehouseId,
      supplierId: form.supplierId,
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
        await apiFetch(`/stock/supplier-returns/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Qaytarish yangilandi');
      } else {
        await apiFetch('/stock/supplier-returns', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Qaytarish yaratildi');
      }

      closeCreateModal();
      await loadReturns({ page: 1 });
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const approveReturn = async (supplierReturnId) => {
    setDecisionLoadingId(supplierReturnId);
    try {
      await apiFetch(`/stock/supplier-returns/${supplierReturnId}/approve`, {
        method: 'POST',
      });
      toast.success('Qaytarish tasdiqlandi');
      await loadReturns();
    } catch (error) {
      toast.error(error.message || 'Tasdiqlashda xatolik');
    } finally {
      setDecisionLoadingId('');
    }
  };

  const rejectReturn = async (supplierReturnId) => {
    setDecisionLoadingId(supplierReturnId);
    try {
      await apiFetch(`/stock/supplier-returns/${supplierReturnId}/reject`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success('Qaytarish rad etildi');
      await loadReturns();
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
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <RotateCcw size={22} />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Taminotchiga qaytarish
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Taminotchiga qaytarilgan tovarlar tarixi
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
        <div className="mb-4 grid gap-3 lg:grid-cols-5">
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

          <select
            value={filters.supplierId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, supplierId: e.target.value }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Barcha taminotchilar</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadReturns({ page: 1 })}
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
                          {item.warehouse?.name || '-'}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="font-semibold text-slate-900">
                          {item.supplier?.name || '-'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500">
                        Yaratgan:{' '}
                        <span className="font-semibold text-slate-700">
                          {item.submittedBy?.fullName || item.submittedBy?.username || '-'}
                        </span>
                      </div>

                      {item.note ? (
                        <div className="text-sm text-slate-600">Izoh: {item.note}</div>
                      ) : null}
                    </div>

                    {isDirector && item.status === 'PENDING' ? (
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
                          disabled={decisionLoadingId === item.id}
                          onClick={() => approveReturn(item.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-70"
                        >
                          <CheckCircle2 size={16} />
                          Tasdiqlash
                        </button>

                        <button
                          type="button"
                          disabled={decisionLoadingId === item.id}
                          onClick={() => rejectReturn(item.id)}
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
                  onClick={() => loadReturns({ page: pagination.page - 1 })}
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
                  onClick={() => loadReturns({ page: pagination.page + 1 })}
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
                  {editingItem ? 'Qaytarishni tahrirlash' : 'Yangi qaytarish yaratish'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Avval ombor va taminotchi tanlanadi, keyin o‘sha supplier batchlari qidiriladi
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
              onSubmit={handleSubmitReturn}
              className="max-h-[calc(92vh-80px)] overflow-y-auto px-6 py-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Ombor
                  </label>
                  <select
                    value={form.warehouseId}
                    onChange={async (e) => {
                      const nextWarehouseId = e.target.value;

                      setForm((prev) => ({
                        ...prev,
                        warehouseId: nextWarehouseId,
                      }));

                      setSearchText('');
                      setAllOptions([]);
                      resetSelector();
                      setCartItems([]);

                      if (nextWarehouseId && form.supplierId) {
                        await loadSupplierReturnOptions(nextWarehouseId, form.supplierId);
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
                    Taminotchi
                  </label>
                  <select
                    value={form.supplierId}
                    onChange={async (e) => {
                      const nextSupplierId = e.target.value;

                      setForm((prev) => ({
                        ...prev,
                        supplierId: nextSupplierId,
                      }));

                      setSearchText('');
                      setAllOptions([]);
                      resetSelector();
                      setCartItems([]);

                      if (form.warehouseId && nextSupplierId) {
                        await loadSupplierReturnOptions(form.warehouseId, nextSupplierId);
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Taminotchi tanlang</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
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
                          form.warehouseId && form.supplierId
                            ? 'Tovar nomi yoki brand yozing'
                            : 'Avval ombor va taminotchini tanlang'
                        }
                        disabled={!form.warehouseId || !form.supplierId || optionsLoading}
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
                      disabled={!form.warehouseId || !form.supplierId || !selector.selectedProductId}
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
                      Batch
                    </label>
                    <select
                      value={selector.selectedBatchId}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      disabled={!form.warehouseId || !form.supplierId || !selector.selectedVariantId}
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
                      disabled={!form.warehouseId || !form.supplierId}
                      className="inline-flex h-[50px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={16} />
                      Qo‘shish
                    </button>
                  </div>
                </div>

                {form.warehouseId && form.supplierId ? (
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
                                      openPreview([{ imageUrl: product.imageUrl }], product.productName)
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
                        Bu ombor va taminotchi bo‘yicha qidiruvga mos tovar topilmadi
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
                            {item.images?.length ? (
                              <button
                                type="button"
                                onClick={() => openPreview(item.images, item.productName)}
                                className="shrink-0"
                              >
                                <img
                                  src={item.images[0].imageUrl}
                                  alt={item.productName}
                                  className="h-14 w-14 rounded-xl object-cover"
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
                                  className="h-14 w-14 rounded-xl object-cover"
                                />
                              </button>
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                <PackageSearch size={18} />
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
                                  Batch: {formatDate(item.sourceBatchDate)}
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
        title={previewTitle}
        images={previewImages}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewTitle('');
          setPreviewImages([]);
        }}
      />
    </div>
  );
}