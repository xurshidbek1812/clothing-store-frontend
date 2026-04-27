import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Loader2,
  Package,
  Printer,
  QrCode,
  Search,
  Trash2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE_URL, apiFetch } from '../../lib/api';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

function buildQrValue(item) {
  return item.barcode || item.batchId || item.variantId || item.productId || item.name;
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

function LabelCard({ item, showPrice, showQr }) {
  return (
    <div className="flex h-[140px] w-[240px] flex-col justify-between rounded-xl border border-slate-300 bg-white p-3 text-black">
      <div className="space-y-1">
        <div className="line-clamp-2 text-sm font-bold leading-tight">
          {item.name}
          {item.sizeName ? ` / ${item.sizeName}` : ''}
        </div>

        {item.brand ? (
          <div className="text-[11px] text-slate-500">{item.brand}</div>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          {showPrice ? (
            <div className="text-lg font-black leading-none">
              {money(item.sellPrice)} {item.currency?.code || ''}
            </div>
          ) : (
            <div className="h-6" />
          )}
        </div>

        {showQr ? (
          <div className="shrink-0 rounded-md border border-slate-200 bg-white p-1">
            <QRCodeSVG value={buildQrValue(item)} size={58} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PrintLabelsPage() {
  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [batchesLoading, setBatchesLoading] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [selectedItems, setSelectedItems] = useState([]);
  const [showPrice, setShowPrice] = useState(true);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const q = query.trim();

    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      setSelectedProduct(null);
      setSelectedVariant(null);
      setSelectedBatchId('');
      setAvailableBatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiFetch(`/products/search?q=${encodeURIComponent(q)}&limit=20`);
        setSearchResults(Array.isArray(res) ? res : []);
      } catch (error) {
        setSearchResults([]);
        toast.error(error.message || 'Tovarlarni qidirishda xatolik');
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const loadBatches = async () => {
      if (!selectedVariant?.id) {
        setAvailableBatches([]);
        setSelectedBatchId('');
        return;
      }

      setBatchesLoading(true);
      try {
        const res = await apiFetch(
          `/products/available-batches?productVariantId=${encodeURIComponent(selectedVariant.id)}`
        );

        const batches = Array.isArray(res?.batches)
          ? res.batches.filter((batch) => Number(batch.remainingQuantity || 0) > 0)
          : [];

        setAvailableBatches(batches);

        if (batches.length === 1) {
          setSelectedBatchId(batches[0].batchId);
        } else {
          setSelectedBatchId('');
        }
      } catch (error) {
        setAvailableBatches([]);
        setSelectedBatchId('');
        toast.error(error.message || 'Kirimlarni yuklashda xatolik');
      } finally {
        setBatchesLoading(false);
      }
    };

    loadBatches();
  }, [selectedVariant]);

  const availableVariants = useMemo(() => {
    return selectedProduct?.variants || [];
  }, [selectedProduct]);

  const selectedBatch = useMemo(() => {
    return availableBatches.find((batch) => batch.batchId === selectedBatchId) || null;
  }, [availableBatches, selectedBatchId]);

  const addSelectedLabel = () => {
    if (!selectedProduct) {
      toast.error('Tovar tanlang');
      return;
    }

    if (!selectedVariant) {
      toast.error('Razmer tanlang');
      return;
    }

    if (!selectedBatch) {
      toast.error('Kirim tanlang');
      return;
    }

    const item = {
      key: `${selectedProduct.id}-${selectedVariant.id}-${selectedBatch.batchId}`,
      productId: selectedProduct.id,
      variantId: selectedVariant.id,
      batchId: selectedBatch.batchId,
      name: selectedProduct.name,
      brand: selectedProduct.brand || '',
      sizeName: selectedVariant.size?.name || '',
      barcode: selectedVariant.barcode || '',
      sellPrice: selectedBatch.sellPrice || 0,
      currency: selectedBatch.sellCurrency || null,
      copies: 1,
    };

    setSelectedItems((prev) => {
      const exists = prev.find((row) => row.key === item.key);

      if (exists) {
        return prev.map((row) =>
          row.key === item.key
            ? { ...row, copies: row.copies + 1 }
            : row
        );
      }

      return [...prev, item];
    });

    toast.success("Print ro'yxatiga qo'shildi");
  };

  const updateCopies = (key, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, copies: Math.max(1, toNumber(value, 1)) }
          : item
      )
    );
  };

  const removeItem = (key) => {
    setSelectedItems((prev) => prev.filter((item) => item.key !== key));
  };

  const printableLabels = useMemo(() => {
    const rows = [];

    for (const item of selectedItems) {
      for (let i = 0; i < item.copies; i += 1) {
        rows.push({
          ...item,
          printKey: `${item.key}-${i}`,
        });
      }
    }

    return rows;
  }, [selectedItems]);

  const handlePrint = () => {
    if (!selectedItems.length) {
      toast.error('Kamida bitta label tanlang');
      return;
    }

    window.print();
  };

  return (
    <div className="space-y-4">
      <style>
        {`
          @page {
            margin: 0;
          }

          @media print {
            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            body * {
              visibility: hidden;
            }

            #labels-print-area,
            #labels-print-area * {
              visibility: visible;
            }

            #labels-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
              background: white;
            }

            .print-grid {
              display: block;
              width: 100%;
            }

            .print-card {
              width: 100%;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              page-break-after: always;
              break-after: page;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .print-card:last-child {
              page-break-after: auto;
              break-after: auto;
            }
          }
        `}
      </style>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <Package size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Narx yorlig&apos;i chop etish
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Tovar qidiring, razmer va kirim tanlang, keyin print qiling
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Search size={18} className="text-slate-500" />
              <h2 className="text-lg font-black text-slate-900">Tovar qidirish</h2>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tovar nomini yozing"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {!query.trim() ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Tovar qidirish uchun nomini yozing
                </div>
              ) : searchLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Qidirilmoqda...
                </div>
              ) : searchResults.length ? (
                <div className="space-y-2">
                  {searchResults.map((product) => {
                    const imageUrl = resolveImageUrl(getPrimaryImage(product));

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product);
                          setSelectedVariant(null);
                          setSelectedBatchId('');
                          setAvailableBatches([]);
                        }}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          selectedProduct?.id === product.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
                              <Package size={18} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold text-slate-900">
                              {product.name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {product.brand || "Brend yo'q"}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-slate-500">
                  Tovar topilmadi
                </div>
              )}
            </div>

            {selectedProduct ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Razmer
                  </label>
                  <select
                    value={selectedVariant?.id || ''}
                    onChange={(e) => {
                      const variant =
                        availableVariants.find((item) => item.id === e.target.value) || null;
                      setSelectedVariant(variant);
                      setSelectedBatchId('');
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Razmer tanlang</option>
                    {availableVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.size?.name || '-'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Kirim
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    disabled={!selectedVariant || batchesLoading}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                  >
                    <option value="">
                      {batchesLoading ? 'Yuklanmoqda...' : 'Kirim tanlang'}
                    </option>
                    {availableBatches.map((batch) => (
                      <option key={batch.batchId} value={batch.batchId}>
                        {new Date(batch.createdAt).toLocaleDateString('uz-UZ')} •
                        Qoldiq: {batch.remainingQuantity} •
                        Narx: {money(batch.sellPrice)} {batch.sellCurrency?.code || ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              <button
                type="button"
                onClick={addSelectedLabel}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Print ro‘yxatiga qo‘shish
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 text-lg font-black text-slate-900">Print sozlamalari</div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Narxni chiqarish
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={showQr}
                  onChange={(e) => setShowQr(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <QrCode size={16} />
                  QR kodni chiqarish
                </span>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Tanlangan labelar</h2>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Printer size={16} />
                Print
              </button>
            </div>

            {selectedItems.length ? (
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">
                          {item.name}
                          {item.sizeName ? ` / ${item.sizeName}` : ''}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {money(item.sellPrice)} {item.currency?.code || ''}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-sm text-slate-600">Nusxa soni</span>
                      <input
                        type="number"
                        min="1"
                        value={item.copies}
                        onChange={(e) => updateCopies(item.key, e.target.value)}
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                Hozircha hech narsa tanlanmagan
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="labels-print-area" className="hidden print:block">
        <div className="print-grid">
          {printableLabels.map((item) => (
            <div key={item.printKey} className="print-card">
              <LabelCard item={item} showPrice={showPrice} showQr={showQr} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}