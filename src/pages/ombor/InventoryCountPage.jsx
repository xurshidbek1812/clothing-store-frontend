import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Barcode,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Minus,
  PackageSearch,
  Plus,
  RotateCcw,
  Save,
  Search,
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../lib/api';
import ImagePreviewModal from '../../components/ImagePreviewModal';

function formatQty(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export default function InventoryCountPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [note, setNote] = useState('');
  const [searchText, setSearchText] = useState('');
  const [scanText, setScanText] = useState('');

  const [options, setOptions] = useState([]);

  const [selectedProducts, setSelectedProducts] = useState([]);

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

  const loadOptions = async (nextWarehouseId, q = '') => {
    if (!nextWarehouseId) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('warehouseId', nextWarehouseId);
      if (q.trim()) params.set('q', q.trim());

      const res = await apiFetch(`/inventory/options?${params.toString()}`);
      setOptions(Array.isArray(res) ? res : []);
    } catch (error) {
      setOptions([]);
      toast.error(error.message || 'Tovarlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (!warehouseId) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(() => {
      loadOptions(warehouseId, searchText);
    }, 250);

    return () => clearTimeout(timer);
  }, [warehouseId, searchText]);

  const groupedProducts = useMemo(() => {
    const map = new Map();

    for (const item of options) {
      const productId = item.productId;
      if (!productId) continue;

      if (!map.has(productId)) {
        map.set(productId, {
          productId,
          productName: item.productName,
          brand: item.brand || '',
          imageUrl: resolveImageUrl(item.imageUrl || ''),
          variants: [],
          totalSystemQuantity: 0,
        });
      }

      const current = map.get(productId);
      current.variants.push({
        productVariantId: item.productVariantId,
        barcode: item.barcode || '',
        size: item.size || '-',
        systemQuantity: Number(item.systemQuantity || 0),
      });
      current.totalSystemQuantity += Number(item.systemQuantity || 0);
    }

    return Array.from(map.values());
  }, [options]);

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];

    return groupedProducts.filter((product) => {
      const productName = String(product.productName || '').toLowerCase();
      const brand = String(product.brand || '').toLowerCase();
      const variantText = (product.variants || [])
        .map((variant) => `${variant.size || ''} ${variant.barcode || ''}`.toLowerCase())
        .join(' ');

      return (
        productName.includes(q) ||
        brand.includes(q) ||
        variantText.includes(q)
      );
    });
  }, [groupedProducts, searchText]);

  const selectedProductsMap = useMemo(() => {
    const map = new Map();
    for (const product of selectedProducts) {
      map.set(product.productId, product);
    }
    return map;
  }, [selectedProducts]);

  const totalVariants = useMemo(() => {
    return selectedProducts.reduce(
      (sum, product) => sum + (product.variants?.length || 0),
      0
    );
  }, [selectedProducts]);

  const totalDiff = useMemo(() => {
    return selectedProducts.reduce((sum, product) => {
      return (
        sum +
        (product.variants || []).reduce((variantSum, variant) => {
          return (
            variantSum +
            (Number(variant.countedQuantity || 0) - Number(variant.systemQuantity || 0))
          );
        }, 0)
      );
    }, 0);
  }, [selectedProducts]);

  const addProductToCount = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((item) => item.productId === product.productId);
      if (exists) return prev;

      return [
        ...prev,
        {
          productId: product.productId,
          productName: product.productName,
          brand: product.brand || '',
          imageUrl: product.imageUrl || '',
          variants: (product.variants || []).map((variant) => ({
            productVariantId: variant.productVariantId,
            barcode: variant.barcode || '',
            size: variant.size || '-',
            systemQuantity: Number(variant.systemQuantity || 0),
            countedQuantity: 0,
          })),
        },
      ];
    });

    toast.success("Tovar sanoqqa qo'shildi");
  };

  const removeProductFromCount = (productId) => {
    setSelectedProducts((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateVariantCount = (productId, variantId, value) => {
    const parsed = Math.max(0, toSafeNumber(value, 0));

    setSelectedProducts((prev) =>
      prev.map((product) => {
        if (product.productId !== productId) return product;

        return {
          ...product,
          variants: product.variants.map((variant) =>
            variant.productVariantId === variantId
              ? { ...variant, countedQuantity: parsed }
              : variant
          ),
        };
      })
    );
  };

  const incrementVariantCount = (productId, variantId, amount = 1) => {
    setSelectedProducts((prev) =>
      prev.map((product) => {
        if (product.productId !== productId) return product;

        return {
          ...product,
          variants: product.variants.map((variant) =>
            variant.productVariantId === variantId
              ? {
                  ...variant,
                  countedQuantity: Math.max(
                    0,
                    Number(variant.countedQuantity || 0) + Number(amount || 0)
                  ),
                }
              : variant
          ),
        };
      })
    );
  };

  const resetVariantCount = (productId, variantId) => {
    setSelectedProducts((prev) =>
      prev.map((product) => {
        if (product.productId !== productId) return product;

        return {
          ...product,
          variants: product.variants.map((variant) =>
            variant.productVariantId === variantId
              ? { ...variant, countedQuantity: 0 }
              : variant
          ),
        };
      })
    );
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();

    if (!warehouseId) {
      toast.error("Avval omborni tanlang");
      return;
    }

    const code = scanText.trim();
    if (!code) return;

    const foundProduct = groupedProducts.find((product) =>
      (product.variants || []).some(
        (variant) =>
          String(variant.barcode || '').trim().toLowerCase() === code.toLowerCase()
      )
    );

    if (!foundProduct) {
      toast.error('Barcode bo‘yicha tovar topilmadi');
      return;
    }

    const foundVariant = foundProduct.variants.find(
      (variant) =>
        String(variant.barcode || '').trim().toLowerCase() === code.toLowerCase()
    );

    if (!foundVariant) {
      toast.error('Barcode bo‘yicha razmer topilmadi');
      return;
    }

    setSelectedProducts((prev) => {
      const existingProduct = prev.find((item) => item.productId === foundProduct.productId);

      if (!existingProduct) {
        return [
          ...prev,
          {
            productId: foundProduct.productId,
            productName: foundProduct.productName,
            brand: foundProduct.brand || '',
            imageUrl: foundProduct.imageUrl || '',
            variants: foundProduct.variants.map((variant) => ({
              productVariantId: variant.productVariantId,
              barcode: variant.barcode || '',
              size: variant.size || '-',
              systemQuantity: Number(variant.systemQuantity || 0),
              countedQuantity:
                variant.productVariantId === foundVariant.productVariantId ? 1 : 0,
            })),
          },
        ];
      }

      return prev.map((product) => {
        if (product.productId !== foundProduct.productId) return product;

        return {
          ...product,
          variants: product.variants.map((variant) =>
            variant.productVariantId === foundVariant.productVariantId
              ? {
                  ...variant,
                  countedQuantity: Number(variant.countedQuantity || 0) + 1,
                }
              : variant
          ),
        };
      });
    });

    setScanText('');
  };

  const payloadItems = useMemo(() => {
    return selectedProducts.flatMap((product) =>
      (product.variants || []).map((variant) => ({
        productVariantId: variant.productVariantId,
        countedQuantity: Number(variant.countedQuantity || 0),
      }))
    );
  }, [selectedProducts]);

  const handleSave = async (applyChanges) => {
    if (!warehouseId) {
      toast.error("Omborni tanlang");
      return;
    }

    if (!selectedProducts.length) {
      toast.error("Kamida bitta tovar qo'shing");
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/inventory', {
        method: 'POST',
        body: JSON.stringify({
          warehouseId,
          note: note.trim() || undefined,
          applyChanges,
          items: payloadItems,
        }),
      });

      toast.success(
        applyChanges
          ? "Sanoq saqlandi va qoldiq yangilandi"
          : "Sanoq faqat tarix uchun saqlandi"
      );

      setNote('');
      setSearchText('');
      setScanText('');
      setSelectedProducts([]);
      await loadOptions(warehouseId, '');
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Sanoq
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Tovarni tanlang, razmerlarini sanang va yakunlang
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Ombor
            </label>
            <select
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setSelectedProducts([]);
                setSearchText('');
                setScanText('');
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
              Izoh
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ixtiyoriy izoh"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
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
                  warehouseId ? 'Tovar nomi, razmer yoki barcode yozing' : 'Avval ombor tanlang'
                }
                disabled={!warehouseId}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Barcode size={16} />
              Skaner
            </label>
            <form onSubmit={handleScanSubmit}>
              <input
                value={scanText}
                onChange={(e) => setScanText(e.target.value)}
                placeholder={
                  warehouseId ? 'Barcode skaner qiling' : 'Avval ombor tanlang'
                }
                disabled={!warehouseId}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
              />
            </form>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <PackageSearch size={16} />
            {loading ? 'Tovarlar yuklanmoqda...' : 'Qidiruv natijalari'}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Yuklanmoqda...
            </div>
          ) : !warehouseId ? (
            <div className="py-8 text-sm text-slate-400">Avval ombor tanlang</div>
          ) : !searchText.trim() ? (
            <div className="py-8 text-sm text-slate-400">
              Tovar qidirish uchun nom yoki barcode yozing
            </div>
          ) : filteredProducts.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const isSelected = selectedProductsMap.has(product.productId);

                return (
                  <div
                    key={product.productId}
                    className={`rounded-2xl border p-4 transition ${
                      isSelected
                        ? 'border-indigo-300 bg-indigo-50'
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

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {product.productName}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {product.brand || 'Brend yo‘q'}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Razmerlar: {product.variants.length}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">
                            Tizimda: {formatQty(product.totalSystemQuantity)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => addProductToCount(product)}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        <Plus size={14} />
                        {isSelected ? "Qo'shilgan" : "Sanoqqa qo'shish"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-sm text-slate-500">
              Qidiruvga mos tovar topilmadi
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-black text-slate-900">Sanoq ro‘yxati</div>
            <div className="mt-1 text-sm text-slate-500">
              Jami {selectedProducts.length} ta tovar, {totalVariants} ta razmer
            </div>
          </div>

          <div
            className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
              totalDiff === 0
                ? 'bg-slate-100 text-slate-700'
                : totalDiff > 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            Farq: {totalDiff > 0 ? '+' : ''}
            {formatQty(totalDiff)}
          </div>
        </div>

        {selectedProducts.length ? (
          <div className="space-y-4">
            {selectedProducts.map((product) => (
              <div
                key={product.productId}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {product.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(product.imageUrl);
                          setPreviewTitle(product.productName);
                          setPreviewOpen(true);
                        }}
                        className="shrink-0"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.productName}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <ImageIcon size={18} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-slate-900">
                        {product.productName}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {product.brand || 'Brend yo‘q'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProductFromCount(product.productId)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Tovarni olib tashlash
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {product.variants.map((variant) => {
                    const diff =
                      Number(variant.countedQuantity || 0) - Number(variant.systemQuantity || 0);

                    return (
                      <div
                        key={variant.productVariantId}
                        className="rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <div className="grid gap-3 xl:grid-cols-[0.8fr_0.9fr_1fr_1.2fr_auto] xl:items-center">
                          <div>
                            <div className="text-xs text-slate-400">Razmer</div>
                            <div className="mt-1 font-semibold text-slate-900">
                              {variant.size || '-'}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-slate-400">Tizim soni</div>
                            <div className="mt-1 font-semibold text-slate-900">
                              {formatQty(variant.systemQuantity)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-slate-400">Sanalgan son</div>
                            <input
                              type="number"
                              min="0"
                              value={variant.countedQuantity}
                              onChange={(e) =>
                                updateVariantCount(
                                  product.productId,
                                  variant.productVariantId,
                                  e.target.value
                                )
                              }
                              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <div className="text-xs text-slate-400">Farq</div>
                            <div
                              className={`mt-1 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                                diff === 0
                                  ? 'border-slate-200 bg-slate-50 text-slate-700'
                                  : diff > 0
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-rose-200 bg-rose-50 text-rose-700'
                              }`}
                            >
                              {diff > 0 ? '+' : ''}
                              {formatQty(diff)}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                incrementVariantCount(
                                  product.productId,
                                  variant.productVariantId,
                                  1
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              <Plus size={14} />
                              1
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                incrementVariantCount(
                                  product.productId,
                                  variant.productVariantId,
                                  5
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              <Plus size={14} />
                              5
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                incrementVariantCount(
                                  product.productId,
                                  variant.productVariantId,
                                  -1
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              <Minus size={14} />
                              1
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                resetVariantCount(product.productId, variant.productVariantId)
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                            >
                              <RotateCcw size={14} />
                              Tozalash
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
              >
                <Save size={16} />
                Faqat tarix uchun saqlash
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Ombor qoldig‘ini yangilash
              </button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-slate-500">
            Hozircha sanoq ro‘yxati bo‘sh
          </div>
        )}
      </div>

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