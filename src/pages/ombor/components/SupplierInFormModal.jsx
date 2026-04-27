import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL, apiFetch } from '../../../lib/api';
import ImagePreviewModal from '../../../components/ImagePreviewModal';

const createDraftItem = () => ({
  productId: '',
  productVariantId: '',
  quantity: '',
  costPrice: '',
  costCurrencyId: '',
  sellPrice: '',
  sellCurrencyId: '',
});

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function currencyLabel(currency) {
  if (!currency) return '-';
  return `${currency.code}${currency.symbol ? ` (${currency.symbol})` : ''}`;
}

function formatMoneyWithCurrency(value, currency) {
  if (!currency) return money(value);
  return `${money(value)} ${currency.code}`;
}

function summarizeTotalsByCurrency(items = [], currencies = []) {
  const map = new Map();

  for (const item of items) {
    const currencyId = item.costCurrencyId;
    if (!currencyId) continue;

    const amount = Number(item.quantity || 0) * Number(item.costPrice || 0);
    const prev = map.get(currencyId) || 0;
    map.set(currencyId, prev + amount);
  }

  return Array.from(map.entries()).map(([currencyId, amount]) => {
    const currency = currencies.find((c) => c.id === currencyId);
    return {
      currencyId,
      currency,
      amount,
    };
  });
}

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

function getPrimaryImage(product) {
  if (product?.imageUrl) return product.imageUrl;
  const images = Array.isArray(product?.images) ? product.images : [];
  if (!images.length) return '';
  const primary = images.find((img) => img.isPrimary);
  return (primary || images[0])?.imageUrl || '';
}

export default function SupplierInFormModal({ open, onClose, onSuccess, editingItem = null }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [form, setForm] = useState({
    warehouseId: '',
    supplierId: '',
    note: '',
    items: [],
  });

  const [draftItem, setDraftItem] = useState(createDraftItem());
  const [search, setSearch] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const isEditMode = Boolean(editingItem?.id);

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [warehousesRes, suppliersRes, currenciesRes] = await Promise.all([
          apiFetch('/warehouses'),
          apiFetch('/suppliers'),
          apiFetch('/cashboxes/currencies'),
        ]);

        const nextCurrencies = currenciesRes || [];
        const defaultCurrencyId =
          nextCurrencies.find((c) => c.isDefault)?.id || nextCurrencies[0]?.id || '';

        setWarehouses(warehousesRes || []);
        setSuppliers(suppliersRes || []);
        setCurrencies(nextCurrencies);

        if (editingItem) {
          setForm({
            warehouseId: editingItem.warehouseId || '',
            supplierId: editingItem.supplierId || '',
            note: editingItem.note || '',
            items: (editingItem.items || []).map((item) => ({
              tempId: crypto.randomUUID(),
              productId: item.productVariant?.product?.id || '',
              productName: item.productVariant?.product?.name || '',
              brand: item.productVariant?.product?.brand || '',
              imageUrl: item.productVariant?.product?.imageUrl || '',
              productVariantId: item.productVariantId,
              sizeName: item.productVariant?.size?.name || '',
              quantity: Number(item.quantity || 0),
              costPrice: Number(item.costPrice || 0),
              costCurrencyId: item.costCurrencyId,
              costCurrency: item.costCurrency || null,
              sellPrice: Number(item.sellPrice || 0),
              sellCurrencyId: item.sellCurrencyId,
              sellCurrency: item.sellCurrency || null,
            })),
          });
        } else {
          setForm({
            warehouseId: '',
            supplierId: '',
            note: '',
            items: [],
          });
        }

        setDraftItem({
          ...createDraftItem(),
          costCurrencyId: defaultCurrencyId,
          sellCurrencyId: defaultCurrencyId,
        });
        setSearch('');
        setSearchResults([]);
      } catch (error) {
        toast.error(error.message || 'Forma ma’lumotlari yuklanmadi');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, editingItem]);

  useEffect(() => {
    if (!open) return;

    const q = search.trim();

    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiFetch(`/products/search?q=${encodeURIComponent(q)}&limit=20`);
        setSearchResults(Array.isArray(res) ? res : []);
      } catch (error) {
        toast.error(error.message || 'Tovar qidirishda xatolik');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search, open]);

  const selectedProduct = useMemo(
    () => searchResults.find((p) => p.id === draftItem.productId) || null,
    [searchResults, draftItem.productId]
  );

  const selectedVariant = useMemo(
    () => selectedProduct?.variants?.find((v) => v.id === draftItem.productVariantId) || null,
    [selectedProduct, draftItem.productVariantId]
  );

  const totalSummaries = useMemo(() => {
    return summarizeTotalsByCurrency(form.items, currencies);
  }, [form.items, currencies]);

  if (!open) return null;

  const addItemToList = () => {
    if (!draftItem.productId) {
      toast.error('Tovar tanlang');
      return;
    }

    if (!draftItem.productVariantId) {
      toast.error('Razmer tanlang');
      return;
    }

    if (!draftItem.costCurrencyId) {
      toast.error('Kirim valyutasini tanlang');
      return;
    }

    if (!draftItem.sellCurrencyId) {
      toast.error('Sotuv valyutasini tanlang');
      return;
    }

    const quantity = Number(draftItem.quantity);
    const costPrice = Number(draftItem.costPrice);
    const sellPrice = Number(draftItem.sellPrice);

    if (
      Number.isNaN(quantity) ||
      Number.isNaN(costPrice) ||
      Number.isNaN(sellPrice) ||
      quantity <= 0 ||
      costPrice < 0 ||
      sellPrice < 0
    ) {
      toast.error("Miqdor va narxlarni to‘g‘ri kiriting");
      return;
    }

    if (!selectedProduct || !selectedVariant) {
      toast.error('Variant topilmadi');
      return;
    }

    const duplicate = form.items.find(
      (item) => item.productVariantId === selectedVariant.id
    );

    if (duplicate) {
      toast.error("Bu razmer allaqachon qo‘shilgan");
      return;
    }

    const costCurrency = currencies.find((c) => c.id === draftItem.costCurrencyId);
    const sellCurrency = currencies.find((c) => c.id === draftItem.sellCurrencyId);

    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          tempId: crypto.randomUUID(),
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          brand: selectedProduct.brand || '',
          imageUrl: getPrimaryImage(selectedProduct),
          productVariantId: selectedVariant.id,
          sizeName: selectedVariant.size?.name || '',
          quantity,
          costPrice,
          costCurrencyId: draftItem.costCurrencyId,
          costCurrency,
          sellPrice,
          sellCurrencyId: draftItem.sellCurrencyId,
          sellCurrency,
        },
      ],
    }));

    const defaultCurrencyId =
      currencies.find((c) => c.isDefault)?.id || currencies[0]?.id || '';

    setDraftItem({
      ...createDraftItem(),
      costCurrencyId: defaultCurrencyId,
      sellCurrencyId: defaultCurrencyId,
    });
    setSearch('');
    setSearchResults([]);
  };

  const updateListItem = (tempId, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.tempId !== tempId) return item;

        const next = {
          ...item,
          [field]: value,
        };

        if (field === 'costCurrencyId') {
          next.costCurrency = currencies.find((c) => c.id === value) || null;
        }

        if (field === 'sellCurrencyId') {
          next.sellCurrency = currencies.find((c) => c.id === value) || null;
        }

        return next;
      }),
    }));
  };

  const removeListItem = (tempId) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.tempId !== tempId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.warehouseId) {
      toast.error('Ombor tanlang');
      return;
    }

    if (!form.supplierId) {
      toast.error('Taminotchi tanlang');
      return;
    }

    if (!form.items.length) {
      toast.error('Kamida bitta tovar qo‘shing');
      return;
    }

    const items = form.items.map((item) => ({
      productVariantId: item.productVariantId,
      quantity: Number(item.quantity),
      costPrice: Number(item.costPrice),
      costCurrencyId: item.costCurrencyId,
      sellPrice: Number(item.sellPrice),
      sellCurrencyId: item.sellCurrencyId,
    }));

    for (const item of items) {
      if (
        !item.productVariantId ||
        !item.costCurrencyId ||
        !item.sellCurrencyId ||
        Number.isNaN(item.quantity) ||
        Number.isNaN(item.costPrice) ||
        Number.isNaN(item.sellPrice) ||
        item.quantity <= 0 ||
        item.costPrice < 0 ||
        item.sellPrice < 0
      ) {
        toast.error("Qo‘shilgan ro‘yxatda noto‘g‘ri ma’lumot bor");
        return;
      }
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await apiFetch(`/supplier-ins/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            warehouseId: form.warehouseId,
            supplierId: form.supplierId,
            note: form.note.trim() || undefined,
            items,
          }),
        });

        toast.success('Kirim hujjati yangilandi');
      } else {
        await apiFetch('/supplier-ins', {
          method: 'POST',
          body: JSON.stringify({
            warehouseId: form.warehouseId,
            supplierId: form.supplierId,
            note: form.note.trim() || undefined,
            items,
          }),
        });

        toast.success('Kirim hujjati yaratildi');
      }

      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">
                    {isEditMode ? 'Kirim hujjatini tahrirlash' : 'Yangi kirim hujjati'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Tovarni qidiring, razmer tanlang va ro‘yxatga qo‘shing
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-73px)] flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  {loading ? (
                    <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Yuklanmoqda...
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Ombor
                          </label>
                          <select
                            value={form.warehouseId}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, warehouseId: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, supplierId: e.target.value }))
                            }
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

                        <div className="md:col-span-2 xl:col-span-1">
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Izoh
                          </label>
                          <input
                            value={form.note}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, note: e.target.value }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            placeholder="Masalan: Bahorgi kolleksiya"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-4">
                          <h4 className="text-lg font-black text-slate-900">Tovar qo‘shish</h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Har bir item uchun kirim va sotuv valyutasi alohida tanlanadi
                          </p>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr_0.6fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]">
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
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                                placeholder="Tovar nomi yoki brend"
                              />
                            </div>

                            <div className="mt-2 h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                              {!search.trim() ? (
                                <div className="flex h-full items-center justify-center px-3 text-center text-sm text-slate-500">
                                  Tovar qidirish uchun nom yozing
                                </div>
                              ) : searchLoading ? (
                                <div className="flex h-full items-center justify-center px-3 text-sm text-slate-500">
                                  <Loader2 size={16} className="mr-2 animate-spin" />
                                  Qidirilmoqda...
                                </div>
                              ) : searchResults.length > 0 ? (
                                <div className="space-y-2">
                                  {searchResults.map((product) => {
                                    const imageUrl = resolveImageUrl(getPrimaryImage(product));

                                    return (
                                      <button
                                        key={product.id}
                                        type="button"
                                        onClick={() =>
                                          setDraftItem((prev) => ({
                                            ...prev,
                                            productId: product.id,
                                            productVariantId: '',
                                          }))
                                        }
                                        className={`w-full rounded-xl px-3 py-2 text-left transition ${
                                          draftItem.productId === product.id
                                            ? 'bg-slate-900 text-white'
                                            : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          {imageUrl ? (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewImage(imageUrl);
                                                setPreviewTitle(product.name);
                                                setPreviewOpen(true);
                                              }}
                                              className="shrink-0"
                                            >
                                              <img
                                                src={imageUrl}
                                                alt={product.name}
                                                className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                                              />
                                            </button>
                                          ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
                                              <ImageIcon size={16} />
                                            </div>
                                          )}

                                          <div className="min-w-0 flex-1">
                                            <div className="truncate font-semibold">
                                              {product.name}
                                            </div>
                                            <div
                                              className={`text-xs ${
                                                draftItem.productId === product.id
                                                  ? 'text-slate-200'
                                                  : 'text-slate-500'
                                              }`}
                                            >
                                              {product.brand || 'Brend yo‘q'}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex h-full items-center justify-center px-3 text-center text-sm text-slate-500">
                                  Hech narsa topilmadi
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Razmer
                            </label>
                            <select
                              value={draftItem.productVariantId}
                              onChange={(e) =>
                                setDraftItem((prev) => ({
                                  ...prev,
                                  productVariantId: e.target.value,
                                }))
                              }
                              disabled={!selectedProduct}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
                            >
                              <option value="">Razmer tanlang</option>
                              {(selectedProduct?.variants || []).map((variant) => (
                                <option key={variant.id} value={variant.id}>
                                  {variant.size?.name || '-'}
                                </option>
                              ))}
                            </select>

                            {selectedProduct ? (
                              <p className="mt-2 text-xs text-slate-500">
                                {selectedProduct.name}
                                {selectedProduct.brand ? ` • ${selectedProduct.brand}` : ''}
                                {selectedVariant?.size?.name ? ` • ${selectedVariant.size.name}` : ''}
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Soni
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={draftItem.quantity}
                              onChange={(e) =>
                                setDraftItem((prev) => ({ ...prev, quantity: e.target.value }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Kirim narxi
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draftItem.costPrice}
                              onChange={(e) =>
                                setDraftItem((prev) => ({ ...prev, costPrice: e.target.value }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Kirim valyutasi
                            </label>
                            <select
                              value={draftItem.costCurrencyId}
                              onChange={(e) =>
                                setDraftItem((prev) => ({
                                  ...prev,
                                  costCurrencyId: e.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            >
                              <option value="">Valyuta tanlang</option>
                              {currencies.map((currency) => (
                                <option key={currency.id} value={currency.id}>
                                  {currencyLabel(currency)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Sotuv narxi
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draftItem.sellPrice}
                              onChange={(e) =>
                                setDraftItem((prev) => ({ ...prev, sellPrice: e.target.value }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Sotuv valyutasi
                            </label>
                            <select
                              value={draftItem.sellCurrencyId}
                              onChange={(e) =>
                                setDraftItem((prev) => ({
                                  ...prev,
                                  sellCurrencyId: e.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            >
                              <option value="">Valyuta tanlang</option>
                              {currencies.map((currency) => (
                                <option key={currency.id} value={currency.id}>
                                  {currencyLabel(currency)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={addItemToList}
                              className="inline-flex h-[48px] items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              <Plus size={16} />
                              Qo‘shish
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-slate-900">Qo‘shilgan tovarlar</h4>
                            <p className="mt-1 text-sm text-slate-500">
                              Bu yerda narx, son va valyutalarni o‘zgartirishingiz mumkin
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                            {totalSummaries.length > 0
                              ? totalSummaries
                                  .map((row) => formatMoneyWithCurrency(row.amount, row.currency))
                                  .join(' • ')
                              : 'Jami: 0'}
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 text-left text-slate-500">
                                <th className="pb-3 font-semibold">Tovar</th>
                                <th className="pb-3 font-semibold">Razmer</th>
                                <th className="pb-3 font-semibold">Soni</th>
                                <th className="pb-3 font-semibold">Kirim narxi</th>
                                <th className="pb-3 font-semibold">Kirim valyutasi</th>
                                <th className="pb-3 font-semibold">Sotuv narxi</th>
                                <th className="pb-3 font-semibold">Sotuv valyutasi</th>
                                <th className="pb-3 font-semibold">Jami</th>
                                <th className="pb-3 text-right font-semibold">Amal</th>
                              </tr>
                            </thead>

                            <tbody>
                              {form.items.length > 0 ? (
                                form.items.map((item) => (
                                  <tr key={item.tempId} className="border-b border-slate-50">
                                    <td className="py-3">
                                      <div className="flex items-center gap-3">
                                        {item.imageUrl ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPreviewImage(resolveImageUrl(item.imageUrl));
                                              setPreviewTitle(item.productName);
                                              setPreviewOpen(true);
                                            }}
                                            className="shrink-0"
                                          >
                                            <img
                                              src={resolveImageUrl(item.imageUrl)}
                                              alt={item.productName}
                                              className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                                            />
                                          </button>
                                        ) : (
                                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
                                            <ImageIcon size={16} />
                                          </div>
                                        )}

                                        <div>
                                          <p className="font-semibold text-slate-900">
                                            {item.productName}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            {item.brand || 'Brend yo‘q'}
                                          </p>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="py-3 text-slate-700">{item.sizeName}</td>

                                    <td className="py-3">
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateListItem(item.tempId, 'quantity', e.target.value)
                                        }
                                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                      />
                                    </td>

                                    <td className="py-3">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.costPrice}
                                        onChange={(e) =>
                                          updateListItem(item.tempId, 'costPrice', e.target.value)
                                        }
                                        className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                      />
                                    </td>

                                    <td className="py-3">
                                      <select
                                        value={item.costCurrencyId}
                                        onChange={(e) =>
                                          updateListItem(item.tempId, 'costCurrencyId', e.target.value)
                                        }
                                        className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                      >
                                        <option value="">Valyuta tanlang</option>
                                        {currencies.map((currency) => (
                                          <option key={currency.id} value={currency.id}>
                                            {currency.code}
                                          </option>
                                        ))}
                                      </select>
                                    </td>

                                    <td className="py-3">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.sellPrice}
                                        onChange={(e) =>
                                          updateListItem(item.tempId, 'sellPrice', e.target.value)
                                        }
                                        className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                      />
                                    </td>

                                    <td className="py-3">
                                      <select
                                        value={item.sellCurrencyId}
                                        onChange={(e) =>
                                          updateListItem(item.tempId, 'sellCurrencyId', e.target.value)
                                        }
                                        className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                      >
                                        <option value="">Valyuta tanlang</option>
                                        {currencies.map((currency) => (
                                          <option key={currency.id} value={currency.id}>
                                            {currency.code}
                                          </option>
                                        ))}
                                      </select>
                                    </td>

                                    <td className="py-3 font-semibold text-slate-900">
                                      {formatMoneyWithCurrency(
                                        Number(item.quantity || 0) * Number(item.costPrice || 0),
                                        item.costCurrency
                                      )}
                                    </td>

                                    <td className="py-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => removeListItem(item.tempId)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="9" className="py-10 text-center text-sm text-slate-500">
                                    Hozircha tovar qo‘shilmagan
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Bekor qilish
                  </button>

                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                  >
                    {saving
                      ? 'Saqlanmoqda...'
                      : isEditMode
                      ? 'Yangilash'
                      : 'Jo‘natish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </>
  );
}