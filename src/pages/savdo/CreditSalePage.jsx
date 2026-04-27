import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Loader2,
  Plus,
  Trash2,
  ScanLine,
  Warehouse,
  Wallet,
  Receipt,
  BadgePercent,
  Users,
} from 'lucide-react';
import { API_BASE_URL, apiFetch } from '../../lib/api';

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

function CustomerModal({ open, onClose, onSubmit, form, setForm, saving }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              Yangi mijoz
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Mijoz ma’lumotlarini kiriting
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              F.I.Sh
            </label>
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Masalan: Aliyev Aziz"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Telefon
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="+998901234567"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Manzil
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Masalan: Toshkent"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Izoh
            </label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Ixtiyoriy"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
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
  );
}

export default function CreditSalePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');

  const [cashboxes, setCashboxes] = useState([]);
  const [cashboxId, setCashboxId] = useState('');

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const [note, setNote] = useState('');
  const [totalDiscount, setTotalDiscount] = useState('');
  const [initialPayment, setInitialPayment] = useState('');

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
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    note: '',
  });

  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    const loadInitial = async () => {
      setLoadingInitial(true);
      try {
        const [warehousesRes, cashboxesRes, customersRes] = await Promise.all([
          apiFetch('/warehouses'),
          apiFetch('/cashboxes'),
          apiFetch('/customers'),
        ]);

        const nextWarehouses = warehousesRes || [];
        const nextCashboxes = cashboxesRes || [];
        const nextCustomers = customersRes || [];

        setWarehouses(nextWarehouses);
        setCashboxes(nextCashboxes);
        setCustomers(nextCustomers);

        if (nextWarehouses.length) {
          setWarehouseId(nextWarehouses[0].id);
        }

        if (nextCashboxes.length) {
          setCashboxId(nextCashboxes[0].id);
        }
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
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const res = await apiFetch(
          `/sales/search-products?q=${encodeURIComponent(q)}&warehouseId=${encodeURIComponent(
            warehouseId
          )}&limit=20`
        );

        setSearchResults(Array.isArray(res) ? res : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, warehouseId]);

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

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();

    if (!q) return [];

    return customers.filter((customer) => {
      const fullName = String(customer.fullName || '').toLowerCase();
      const phone = String(customer.phone || '').toLowerCase();
      return fullName.includes(q) || phone.includes(q);
    });
  }, [customers, customerSearch]);

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

  useEffect(() => {
    if (!saleCurrencyId) return;

    const exists = filteredCashboxes.some((cashbox) => cashbox.id === cashboxId);
    if (!exists) {
      setCashboxId(filteredCashboxes[0]?.id || '');
    }
  }, [saleCurrencyId, filteredCashboxes, cashboxId]);

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
    const amount = toNumber(initialPayment);
    return roundMoney(Math.min(Math.max(amount, 0), grandTotal));
  }, [initialPayment, grandTotal]);

  const debtAmount = useMemo(() => {
    return roundMoney(Math.max(grandTotal - paidAmount, 0));
  }, [grandTotal, paidAmount]);

  const submitCreditSale = async () => {
    if (!customerId) {
      toast.error('Mijoz tanlang');
      return;
    }

    if (!cart.length) {
      toast.error('Savat bo‘sh');
      return;
    }

    if (!saleCurrencyId) {
      toast.error('Savdo valyutasi aniqlanmadi');
      return;
    }

    const parsedTotalDiscount = toNumber(totalDiscount);
    const parsedInitialPayment = toNumber(initialPayment);
    const remainingBase = Math.max(subtotalAmount - itemDiscountTotal, 0);

    if (parsedTotalDiscount < 0 || parsedTotalDiscount > remainingBase) {
      toast.error('Umumiy chegirma noto‘g‘ri');
      return;
    }

    if (parsedInitialPayment < 0 || parsedInitialPayment > grandTotal) {
      toast.error("Boshlang'ich to'lov noto‘g‘ri");
      return;
    }

    if (parsedInitialPayment > 0) {
      const selectedCashbox = filteredCashboxes.find((item) => item.id === cashboxId);

      if (!cashboxId) {
        toast.error("Boshlang'ich to'lov uchun kassa tanlang");
        return;
      }

      if (!selectedCashbox) {
        toast.error("Tanlangan kassa savdo valyutasiga mos emas");
        return;
      }
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
      const res = await apiFetch('/sales/credit', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          note: note.trim() || undefined,
          totalDiscount: parsedTotalDiscount,
          initialPayment: parsedInitialPayment,
          cashboxId: parsedInitialPayment > 0 ? cashboxId : undefined,
          items,
        }),
      });

      toast.success(
        res.sale?.saleCode
          ? `Nasiya savdo yaratildi • ${res.sale.saleCode}`
          : res.message || 'Nasiya savdo yaratildi'
      );

      setLastSale(res.sale || null);
      setCart([]);
      setNote('');
      setTotalDiscount('');
      setInitialPayment('');
      setCashboxId(cashboxes[0]?.id || '');
      resetSelector();
      setSearch('');
      setSearchResults([]);
    } catch (error) {
      toast.error(error.message || 'Nasiya savdoda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const submitCustomer = async (e) => {
    e.preventDefault();

    if (!customerForm.fullName.trim()) {
      toast.error('Mijoz nomi majburiy');
      return;
    }

    setCustomerSaving(true);
    try {
      const res = await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({
          fullName: customerForm.fullName.trim(),
          phone: customerForm.phone.trim() || undefined,
          address: customerForm.address.trim() || undefined,
          note: customerForm.note.trim() || undefined,
        }),
      });

      toast.success(res.message || 'Mijoz yaratildi');

      const freshCustomers = await apiFetch('/customers');
      setCustomers(freshCustomers || []);

      if (res.customer?.id) {
        setCustomerId(res.customer.id);
        setCustomerSearch(res.customer.fullName || '');
      }

      setCustomerModalOpen(false);
      setCustomerForm({
        fullName: '',
        phone: '',
        address: '',
        note: '',
      });
    } catch (error) {
      toast.error(error.message || 'Mijoz yaratishda xatolik');
    } finally {
      setCustomerSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
            <Receipt size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Nasiya savdo
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Mijoz bilan nasiya savdo yaratish
            </p>
          </div>
        </div>
      </div>

      {lastSale?.saleCode ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
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
                  <Users size={18} className="text-slate-500" />
                  <h2 className="text-lg font-black text-slate-900">Mijoz va tovar</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Mijoz qidirish
                    </label>
                    <input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="F.I.Sh yoki telefon"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setCustomerModalOpen(true)}
                      className="inline-flex h-[48px] items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Plus size={16} />
                      Yangi mijoz
                    </button>
                  </div>
                </div>

                <div className="mt-3 h-40 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  {!customerSearch.trim() ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Mijoz qidirish uchun yozing
                    </div>
                  ) : filteredCustomers.length > 0 ? (
                    <div className="space-y-2">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setCustomerId(customer.id);
                            setCustomerSearch(customer.fullName || '');
                          }}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            customerId === customer.id
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-semibold text-slate-900">{customer.fullName}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {customer.phone || 'Telefon yo‘q'}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Mijoz topilmadi
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                        onChange={(e) => setSearch(e.target.value.replace(/\s+/g, ' '))}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-blue-500"
                        placeholder="Nom, brend, razmer yoki barcode"
                      />
                      <button
                        type="button"
                        onClick={() => setSearch((prev) => prev.trim())}
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
                              ? 'border-violet-500 bg-violet-50'
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
                                <Receipt size={16} />
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
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Hech narsa topilmadi
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
              <Receipt size={18} className="text-slate-500" />
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
                          onChange={(e) => updateCartItem(item.tempId, 'quantity', e.target.value)}
                          type="number"
                          min="1"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        />

                        <input
                          value={item.unitPrice}
                          onChange={(e) => updateCartItem(item.tempId, 'unitPrice', e.target.value)}
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
              <h2 className="text-lg font-black text-slate-900">Hisob-kitob</h2>
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
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Boshlang‘ich to‘lov
                </label>
                <input
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  type="number"
                  min="0"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Kassa
                </label>
                <select
                  value={cashboxId}
                  onChange={(e) => setCashboxId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Kassa tanlang</option>
                  {filteredCashboxes.map((cashbox) => (
                    <option key={cashbox.id} value={cashbox.id}>
                      {cashbox.name} • {getCurrencyLabel(cashbox.currency)}
                    </option>
                  ))}
                </select>
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
                    <span className="text-slate-500">Boshlang‘ich to‘lov</span>
                    <span className="font-semibold text-emerald-600">
                      {saleCurrency
                        ? formatMoneyWithCurrency(paidAmount, saleCurrency)
                        : money(paidAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Qolgan qarz</span>
                    <span className="font-semibold text-amber-600">
                      {saleCurrency
                        ? formatMoneyWithCurrency(debtAmount, saleCurrency)
                        : money(debtAmount)}
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
                onClick={submitCreditSale}
                disabled={saving || !cart.length || !customerId}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
                {saving ? 'Saqlanmoqda...' : 'Nasiya savdoni yaratish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSubmit={submitCustomer}
        form={customerForm}
        setForm={setCustomerForm}
        saving={customerSaving}
      />
    </div>
  );
}