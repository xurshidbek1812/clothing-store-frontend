import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Loader2,
  Plus,
  Trash2,
  ShoppingCart,
  ScanLine,
  Warehouse,
  Wallet,
  Receipt,
  BadgePercent,
  CreditCard,
} from 'lucide-react';
import { API_BASE_URL, apiFetch } from '../../lib/api';
import ImagePreviewModal from '../../components/ImagePreviewModal';
import SaleReceiptModal from '../../components/SaleReceiptModal';

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

function createPaymentRow(defaultCashboxId = '') {
  return {
    id: crypto.randomUUID(),
    cashboxId: defaultCashboxId,
    amount: '',
  };
}

function getCurrencyLabel(currency) {
  if (!currency) return '-';
  return `${currency.code}${currency.symbol ? ` (${currency.symbol})` : ''}`;
}

function formatMoneyWithCurrency(value, currency) {
  if (!currency) return money(value);
  return `${money(value)} ${currency.code}`;
}

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

export default function CashSalePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');

  const [cashboxes, setCashboxes] = useState([]);
  const [note, setNote] = useState('');
  const [totalDiscount, setTotalDiscount] = useState('');

  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [itemDiscount, setItemDiscount] = useState('');

  const [cart, setCart] = useState([]);
  const [payments, setPayments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [searchTouched, setSearchTouched] = useState(false);
  const [isScannerSearch, setIsScannerSearch] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    const loadInitial = async () => {
      setLoadingInitial(true);
      try {
        const [warehousesRes, cashboxesRes] = await Promise.all([
          apiFetch('/warehouses'),
          apiFetch('/cashboxes'),
        ]);

        const nextWarehouses = warehousesRes || [];
        const nextCashboxes = cashboxesRes || [];

        setWarehouses(nextWarehouses);
        setCashboxes(nextCashboxes);

        if (nextWarehouses.length) {
          setWarehouseId(nextWarehouses[0].id);
        }

        setPayments([createPaymentRow(nextCashboxes[0]?.id || '')]);
      } catch (error) {
        toast.error(error.message || 'Boshlang‘ich ma’lumotlar yuklanmadi');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitial();
  }, []);

  useEffect(() => {
    const q = search.trim();

    if (!q || !warehouseId) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');

      try {
        const res = await apiFetch(
          `/sales/search-products?q=${encodeURIComponent(q)}&warehouseId=${encodeURIComponent(
            warehouseId
          )}&limit=20`
        );

        const results = Array.isArray(res) ? res : [];
        setSearchResults(results);

        if (results.length === 0 && isScannerSearch) {
          toast.error('Skaner bo‘yicha tovar topilmadi');
        }
      } catch (error) {
        setSearchResults([]);
        setSearchError(error.message || 'Qidiruvda xatolik');

        if (isScannerSearch) {
          toast.error(error.message || 'Skaner bo‘yicha qidiruvda xatolik');
        }
      } finally {
        setSearchLoading(false);
        setIsScannerSearch(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, warehouseId, isScannerSearch]);

  useEffect(() => {
    if (!selectedVariant) {
      setSelectedBatchId('');
      return;
    }

    const batches = (selectedVariant.stockBatches || []).filter(
      (batch) => batch.remainingQuantity > 0
    );

    if (batches.length === 1) {
      setSelectedBatchId(batches[0].id);
      setUnitPrice(String(batches[0].sellPrice ?? ''));
    } else {
      setSelectedBatchId('');
    }
  }, [selectedVariant]);

  const availableBatches = useMemo(() => {
    if (!selectedVariant) return [];
    return (selectedVariant.stockBatches || []).filter((batch) => batch.remainingQuantity > 0);
  }, [selectedVariant]);

  const selectedBatch = useMemo(() => {
    return availableBatches.find((batch) => batch.id === selectedBatchId) || null;
  }, [availableBatches, selectedBatchId]);

  const saleCurrency = useMemo(() => {
    return cart[0]?.sellCurrency || null;
  }, [cart]);

  const saleCurrencyId = useMemo(() => {
    return cart[0]?.sellCurrencyId || '';
  }, [cart]);

  const filteredCashboxes = useMemo(() => {
    if (!saleCurrencyId) return cashboxes;
    return cashboxes.filter((cashbox) => cashbox.currencyId === saleCurrencyId);
  }, [cashboxes, saleCurrencyId]);

  const resetSelector = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setSelectedBatchId('');
    setQuantity('');
    setUnitPrice('');
    setItemDiscount('');
  };

  const addToCart = () => {
    if (!warehouseId) {
      toast.error('Ombor tanlang');
      return;
    }

    if (!selectedProduct) {
      toast.error('Tovar tanlang');
      return;
    }

    if (!selectedVariant) {
      toast.error('Razmer tanlang');
      return;
    }

    if (!selectedBatch) {
      toast.error('Batch tanlang');
      return;
    }

    if (!selectedBatch.sellCurrencyId) {
      toast.error('Batchning sotuv valyutasi topilmadi');
      return;
    }

    if (saleCurrencyId && saleCurrencyId !== selectedBatch.sellCurrencyId) {
      toast.error(
        `Bu savatda faqat ${saleCurrency?.code || 'bir xil'} valyutadagi tovarlar bo‘lishi mumkin`
      );
      return;
    }

    const qty = toNumber(quantity);
    const price = toNumber(unitPrice);
    const discount = toNumber(itemDiscount);

    if (qty <= 0) {
      toast.error('Soni to‘g‘ri bo‘lishi kerak');
      return;
    }

    if (price < 0) {
      toast.error('Narx to‘g‘ri bo‘lishi kerak');
      return;
    }

    if (qty > selectedBatch.remainingQuantity) {
      toast.error('Batchdagi qoldiq yetarli emas');
      return;
    }

    const lineSubtotal = roundMoney(qty * price);

    if (discount < 0 || discount > lineSubtotal) {
      toast.error('Chegirma noto‘g‘ri');
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        warehouseId,
        warehouseName: selectedBatch.warehouse?.name || '',
        productVariantId: selectedVariant.id,
        batchId: selectedBatch.id,
        productName: selectedProduct.name,
        imageUrl: selectedProduct.imageUrl || '',
        brand: selectedProduct.brand || '',
        sizeName: selectedVariant.size?.name || '',
        quantity: qty,
        unitPrice: price,
        discountAmount: discount,
        maxQuantity: selectedBatch.remainingQuantity,
        batchCreatedAt: selectedBatch.createdAt,
        sellCurrencyId: selectedBatch.sellCurrencyId,
        sellCurrency: selectedBatch.sellCurrency || null,
      },
    ]);

    resetSelector();
    setSearch('');
    setSearchResults([]);
  };

  const updateCartItem = (tempId, field, value) => {
    setCart((prev) =>
      prev.map((item) =>
        item.tempId === tempId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const removeCartItem = (tempId) => {
    setCart((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const addPaymentRow = () => {
    const defaultCashboxId = filteredCashboxes[0]?.id || '';
    setPayments((prev) => [...prev, createPaymentRow(defaultCashboxId)]);
  };

  const updatePaymentRow = (id, field, value) => {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              [field]: value,
            }
          : payment
      )
    );
  };

  const removePaymentRow = (id) => {
    setPayments((prev) => {
      const defaultCashboxId = filteredCashboxes[0]?.id || '';
      if (prev.length === 1) {
        return [createPaymentRow(defaultCashboxId)];
      }
      return prev.filter((payment) => payment.id !== id);
    });
  };

  useEffect(() => {
    const defaultCashboxId = filteredCashboxes[0]?.id || '';

    setPayments((prev) => {
      if (!prev.length) {
        return [createPaymentRow(defaultCashboxId)];
      }

      return prev.map((payment, index) => {
        const exists = filteredCashboxes.some((cashbox) => cashbox.id === payment.cashboxId);

        if (exists) return payment;

        if (index === 0) {
          return {
            ...payment,
            cashboxId: defaultCashboxId,
          };
        }

        return {
          ...payment,
          cashboxId: '',
        };
      });
    });
  }, [saleCurrencyId, filteredCashboxes]);

  const subtotalAmount = useMemo(() => {
    return roundMoney(
      cart.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice), 0)
    );
  }, [cart]);

  const itemDiscountTotal = useMemo(() => {
    return roundMoney(cart.reduce((sum, item) => sum + toNumber(item.discountAmount), 0));
  }, [cart]);

  const generalDiscount = useMemo(() => toNumber(totalDiscount), [totalDiscount]);

  const grandTotal = useMemo(() => {
    const remainingBase = Math.max(subtotalAmount - itemDiscountTotal, 0);
    const safeGeneralDiscount = Math.min(Math.max(generalDiscount, 0), remainingBase);
    return roundMoney(subtotalAmount - itemDiscountTotal - safeGeneralDiscount);
  }, [subtotalAmount, itemDiscountTotal, generalDiscount]);

  const paidAmount = useMemo(() => {
    return roundMoney(payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0));
  }, [payments]);

  const remainingAmount = useMemo(() => {
    return roundMoney(Math.max(grandTotal - paidAmount, 0));
  }, [grandTotal, paidAmount]);

  const isFullyPaid = useMemo(() => {
    return roundMoney(grandTotal) === roundMoney(paidAmount) && grandTotal >= 0;
  }, [grandTotal, paidAmount]);

  const submitSale = async () => {
    if (!cart.length) {
      toast.error('Savat bo‘sh');
      return;
    }

    if (!saleCurrencyId) {
      toast.error('Savdo valyutasi aniqlanmadi');
      return;
    }

    const parsedTotalDiscount = toNumber(totalDiscount);
    const remainingBase = Math.max(subtotalAmount - itemDiscountTotal, 0);

    if (parsedTotalDiscount < 0 || parsedTotalDiscount > remainingBase) {
      toast.error('Umumiy chegirma noto‘g‘ri');
      return;
    }

    const normalizedPayments = payments
      .map((payment) => ({
        cashboxId: payment.cashboxId,
        amount: toNumber(payment.amount),
      }))
      .filter((payment) => payment.amount > 0);

    if (!normalizedPayments.length) {
      toast.error('Kamida bitta to‘lov kiriting');
      return;
    }

    for (const payment of normalizedPayments) {
      const cashbox = filteredCashboxes.find((item) => item.id === payment.cashboxId);

      if (!payment.cashboxId || payment.amount <= 0) {
        toast.error("To'lov ma'lumotlari noto‘g‘ri");
        return;
      }

      if (!cashbox) {
        toast.error("Tanlangan kassa savdo valyutasiga mos emas");
        return;
      }
    }

    if (!isFullyPaid) {
      toast.error("Savdoni yakunlashdan oldin to‘lov to‘liq kiritilishi kerak");
      return;
    }

    const items = cart.map((item) => ({
      productVariantId: item.productVariantId,
      batchId: item.batchId,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      discountAmount: toNumber(item.discountAmount),
    }));

    for (const item of items) {
      const lineSubtotal = roundMoney(item.quantity * item.unitPrice);

      if (
        !item.productVariantId ||
        !item.batchId ||
        item.quantity <= 0 ||
        item.unitPrice < 0 ||
        item.discountAmount < 0 ||
        item.discountAmount > lineSubtotal
      ) {
        toast.error('Savatda noto‘g‘ri ma’lumot bor');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await apiFetch('/sales/cash', {
        method: 'POST',
        body: JSON.stringify({
          note: note.trim() || undefined,
          totalDiscount: parsedTotalDiscount,
          payments: normalizedPayments,
          items,
        }),
      });

      toast.success(
        res.sale?.saleCode
          ? `Savdo yaratildi • ${res.sale.saleCode}`
          : res.message || 'Savdo bajarildi'
      );

      setLastSale(res.sale || null);
      setReceiptOpen(true);

      setCart([]);
      setNote('');
      setTotalDiscount('');
      setPayments([createPaymentRow(cashboxes[0]?.id || '')]);
      resetSelector();
      setSearch('');
      setSearchResults([]);
    } catch (error) {
      toast.error(error.message || 'Savdoda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <ShoppingCart size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Naqd savdo
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Ombor bo‘yicha tovar tanlash, savat va ko‘p kassa orqali to‘lov
              </p>
            </div>
          </div>
        </div>

        {lastSale?.saleCode ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Oxirgi savdo kodi: {lastSale.saleCode}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {loadingInitial ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Yuklanmoqda...
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <Warehouse size={18} className="text-slate-500" />
                    <h2 className="text-lg font-black text-slate-900">Tovar qo‘shish</h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Ombor
                      </label>
                      <select
                        value={warehouseId}
                        onChange={(e) => {
                          setWarehouseId(e.target.value);
                          setSearch('');
                          setSearchResults([]);
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
                        Tovar qidirish
                      </label>
                      <div className="relative">
                        <Search
                          size={16}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={search}
                          onChange={(e) => {
                            setSearchTouched(true);
                            setIsScannerSearch(false);
                            setSearch(e.target.value.replace(/\s+/g, ' '));
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-blue-500"
                          placeholder="Nom, brend, razmer yoki barcode"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const q = search.trim();
                            if (!q) return;
                            setSearchTouched(true);
                            setIsScannerSearch(true);
                            setSearch(q);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                          title="Skaner qidiruvi"
                        >
                          <ScanLine size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    {!warehouseId ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        Avval ombor tanlang
                      </div>
                    ) : !search.trim() ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        Tovar qidirish uchun yozing
                      </div>
                    ) : searchLoading ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Qidirilmoqda...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(product);
                              setSelectedVariant(null);
                              setSelectedBatchId('');
                              setUnitPrice('');
                              setQuantity('');
                              setItemDiscount('');
                            }}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                              selectedProduct?.id === product.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <img
                                  src={resolveImageUrl(product.imageUrl)}
                                  alt={product.name}
                                  className="h-12 w-12 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                  <ShoppingCart size={16} />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="truncate font-semibold text-slate-900">
                                  {product.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {product.brand || 'Brend yo‘q'}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <p className="text-sm text-slate-500">
                          {searchError || 'Hech narsa topilmadi'}
                        </p>
                        {searchTouched ? (
                          <p className="mt-1 text-xs text-slate-400">
                            So‘zni boshqacha yozib ko‘ring
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {selectedProduct ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Razmer
                        </label>
                        <select
                          value={selectedVariant?.id || ''}
                          onChange={(e) => {
                            const variant =
                              selectedProduct.variants?.find((item) => item.id === e.target.value) || null;
                            setSelectedVariant(variant);
                            setSelectedBatchId('');
                            setUnitPrice('');
                            setQuantity('');
                            setItemDiscount('');
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">Razmer tanlang</option>
                          {(selectedProduct.variants || []).map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.size?.name || '-'} {variant.barcode ? `• ${variant.barcode}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Batch
                        </label>
                        <select
                          value={selectedBatchId}
                          onChange={(e) => {
                            const batchId = e.target.value;
                            setSelectedBatchId(batchId);
                            const batch =
                              availableBatches.find((item) => item.id === batchId) || null;
                            setUnitPrice(batch ? String(batch.sellPrice ?? '') : '');
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">Batch tanlang</option>
                          {availableBatches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {new Date(batch.createdAt).toLocaleDateString('uz-UZ')} • Qoldiq:{' '}
                              {batch.remainingQuantity}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Soni
                        </label>
                        <input
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          type="number"
                          min="1"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Narx
                        </label>
                        <input
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          type="number"
                          min="0"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Chegirma
                        </label>
                        <input
                          value={itemDiscount}
                          onChange={(e) => setItemDiscount(e.target.value)}
                          type="number"
                          min="0"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>

                      <div className="lg:col-span-3 flex items-end">
                        <button
                          type="button"
                          onClick={addToCart}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Plus size={16} />
                          Savatga qo‘shish
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShoppingCart size={18} className="text-slate-500" />
                <h2 className="text-lg font-black text-slate-900">Savat</h2>
              </div>

              {cart.length ? (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const lineSubtotal = roundMoney(toNumber(item.quantity) * toNumber(item.unitPrice));
                    const lineTotal = roundMoney(lineSubtotal - toNumber(item.discountAmount));

                    return (
                      <div
                        key={item.tempId}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900">
                              {item.productName}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                              <span>{item.brand || 'Brend yo‘q'}</span>
                              <span>{item.sizeName}</span>
                              <span>{item.warehouseName}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item.tempId)}
                            className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-4">
                          <input
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartItem(item.tempId, 'quantity', e.target.value)
                            }
                            type="number"
                            min="1"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          />

                          <input
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateCartItem(item.tempId, 'unitPrice', e.target.value)
                            }
                            type="number"
                            min="0"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          />

                          <input
                            value={item.discountAmount}
                            onChange={(e) =>
                              updateCartItem(item.tempId, 'discountAmount', e.target.value)
                            }
                            type="number"
                            min="0"
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          />

                          <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                            {item.sellCurrency
                              ? formatMoneyWithCurrency(lineTotal, item.sellCurrency)
                              : money(lineTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">
                  Savat bo‘sh
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Wallet size={18} className="text-slate-500" />
                <h2 className="text-lg font-black text-slate-900">To‘lov</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Izoh
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    placeholder="Ixtiyoriy"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BadgePercent size={16} />
                    Umumiy chegirma
                  </label>
                  <input
                    value={totalDiscount}
                    onChange={(e) => setTotalDiscount(e.target.value)}
                    type="number"
                    min="0"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <CreditCard size={16} />
                      To‘lovlar
                    </label>

                    <button
                      type="button"
                      onClick={addPaymentRow}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Plus size={14} />
                      Qator qo‘shish
                    </button>
                  </div>

                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <select
                          value={payment.cashboxId}
                          onChange={(e) =>
                            updatePaymentRow(payment.id, 'cashboxId', e.target.value)
                          }
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">Kassa tanlang</option>
                          {filteredCashboxes.map((cashbox) => (
                            <option key={cashbox.id} value={cashbox.id}>
                              {cashbox.name} • {getCurrencyLabel(cashbox.currency)}
                            </option>
                          ))}
                        </select>

                        <input
                          value={payment.amount}
                          onChange={(e) =>
                            updatePaymentRow(payment.id, 'amount', e.target.value)
                          }
                          type="number"
                          min="0"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          placeholder="0"
                        />

                        <button
                          type="button"
                          onClick={() => removePaymentRow(payment.id)}
                          className="inline-flex items-center justify-center rounded-2xl border border-rose-200 px-4 py-3 text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Jami summa</span>
                      <span className="font-semibold text-slate-900">
                        {saleCurrency
                          ? formatMoneyWithCurrency(subtotalAmount, saleCurrency)
                          : money(subtotalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Item chegirma</span>
                      <span className="font-semibold text-rose-600">
                        {saleCurrency
                          ? formatMoneyWithCurrency(itemDiscountTotal, saleCurrency)
                          : money(itemDiscountTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Umumiy chegirma</span>
                      <span className="font-semibold text-rose-600">
                        {saleCurrency
                          ? formatMoneyWithCurrency(generalDiscount, saleCurrency)
                          : money(generalDiscount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">To‘langan</span>
                      <span className="font-semibold text-emerald-600">
                        {saleCurrency
                          ? formatMoneyWithCurrency(paidAmount, saleCurrency)
                          : money(paidAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Qolgan</span>
                      <span className="font-semibold text-amber-600">
                        {saleCurrency
                          ? formatMoneyWithCurrency(remainingAmount, saleCurrency)
                          : money(remainingAmount)}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Yakuniy summa</span>
                        <span className="text-lg font-black text-slate-900">
                          {saleCurrency
                            ? formatMoneyWithCurrency(grandTotal, saleCurrency)
                            : money(grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submitSale}
                  disabled={saving || !cart.length}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
                  {saving ? 'Saqlanmoqda...' : 'Savdoni yakunlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
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

      <SaleReceiptModal
        open={receiptOpen}
        sale={lastSale}
        onClose={() => setReceiptOpen(false)}
      />
    </>
  );
}