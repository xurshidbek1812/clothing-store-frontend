import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRightLeft,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ');
}

function getUserLabel(user) {
  return user?.fullName || user?.username || '-';
}

function getStatusBadge(status) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Tasdiqlangan
      </span>
    );
  }

  if (status === 'REJECTED') {
    return (
      <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
        Rad etilgan
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      Jarayonda
    </span>
  );
}

const initialForm = {
  fromCashboxId: '',
  toCashboxId: '',
  amount: '',
  note: '',
};

export default function CashboxTransferPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');

  const [cashboxes, setCashboxes] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    q: '',
    status: '',
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadOptions = async () => {
    const res = await apiFetch('/cashbox-transfers/options');
    setCashboxes(Array.isArray(res) ? res : []);
  };

  const loadTransfers = async ({
    page = pagination.page,
    pageSize = pagination.pageSize,
    q = filters.q,
    status = filters.status,
  } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);

    const res = await apiFetch(`/cashbox-transfers?${params.toString()}`);
    setItems(res?.items || []);
    setPagination(
      res?.pagination || {
        page,
        pageSize,
        totalItems: 0,
        totalPages: 1,
      }
    );
  };

  const init = async () => {
    setLoading(true);
    try {
      await Promise.all([loadOptions(), loadTransfers({ page: 1 })]);
    } catch (error) {
      toast.error(error.message || "Ma'lumotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const fromCashbox = useMemo(
    () => cashboxes.find((item) => item.id === form.fromCashboxId) || null,
    [cashboxes, form.fromCashboxId]
  );

  const availableToCashboxes = useMemo(() => {
    if (!fromCashbox) return [];

    return cashboxes.filter(
      (item) =>
        item.id !== fromCashbox.id &&
        item.currencyId === fromCashbox.currencyId
    );
  }, [cashboxes, fromCashbox]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(initialForm);
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    setEditingItem(null);
    setForm(initialForm);
    setCreateOpen(false);
  };

  const openEditModal = (item) => {
    if (item.status !== 'PENDING') {
      toast.error("Faqat jarayondagi o'tkazmani tahrirlash mumkin");
      return;
    }

    setEditingItem(item);
    setForm({
      fromCashboxId: item.fromCashboxId || '',
      toCashboxId: item.toCashboxId || '',
      amount: item.amount != null ? String(item.amount) : '',
      note: item.note || '',
    });
    setCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fromCashboxId || !form.toCashboxId) {
      toast.error('Ikkala kassani ham tanlang');
      return;
    }

    const amount = Number(form.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Summa to'g'ri kiritilishi kerak");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fromCashboxId: form.fromCashboxId,
        toCashboxId: form.toCashboxId,
        amount,
        note: form.note.trim() || undefined,
      };

      if (editingItem?.id) {
        await apiFetch(`/cashbox-transfers/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success("O'tkazma yangilandi");
      } else {
        await apiFetch('/cashbox-transfers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success("O'tkazma yaratildi");
      }

      closeCreateModal();
      await Promise.all([loadOptions(), loadTransfers({ page: 1 })]);
    } catch (error) {
      toast.error(error.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const approveTransfer = async (transferId) => {
    setActionLoadingId(transferId);
    try {
      await apiFetch(`/cashbox-transfers/${transferId}/approve`, {
        method: 'POST',
      });
      toast.success("O'tkazma tasdiqlandi");
      await Promise.all([loadOptions(), loadTransfers()]);
    } catch (error) {
      toast.error(error.message || "Tasdiqlashda xatolik");
    } finally {
      setActionLoadingId('');
    }
  };

  const rejectTransfer = async (transferId) => {
    setActionLoadingId(transferId);
    try {
      await apiFetch(`/cashbox-transfers/${transferId}/reject`, {
        method: 'POST',
      });
      toast.success("O'tkazma rad etildi");
      await loadTransfers();
    } catch (error) {
      toast.error(error.message || "Rad etishda xatolik");
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ArrowRightLeft size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Kassa o'tkazmalari
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Bir xil valyutali kassalar orasida pul o'tkazish
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Yangi o'tkazma
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={filters.q}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    q: e.target.value,
                  }))
                }
                placeholder="Qidirish"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Barcha holatlar</option>
              <option value="PENDING">Jarayonda</option>
              <option value="APPROVED">Tasdiqlangan</option>
              <option value="REJECTED">Rad etilgan</option>
            </select>

            <button
              type="button"
              onClick={() => loadTransfers({ page: 1 })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Filtrlash
            </button>
          </div>

          <div className="text-sm text-slate-500">
            Jami: {pagination.totalItems}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Yuklanmoqda...
            </div>
          </div>
        ) : items.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-sm font-semibold text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3">Sana</th>
                    <th className="border-b border-slate-200 px-4 py-3">Jo'natuvchi kassa</th>
                    <th className="border-b border-slate-200 px-4 py-3">Qabul qiluvchi kassa</th>
                    <th className="border-b border-slate-200 px-4 py-3">Valyuta</th>
                    <th className="border-b border-slate-200 px-4 py-3">Summa</th>
                    <th className="border-b border-slate-200 px-4 py-3">Holati</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-right">Amallar</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="text-sm text-slate-700">
                      <td className="border-b border-slate-100 px-4 py-4 whitespace-nowrap">
                        {formatDateTime(item.createdAt)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {item.fromCashbox?.name || '-'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {money(item.fromCashbox?.balance)} {item.fromCashbox?.currency?.code || ''}
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {item.toCashbox?.name || '-'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {money(item.toCashbox?.balance)} {item.toCashbox?.currency?.code || ''}
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {item.currency?.code || '-'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.currency?.name || '-'}
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-900">
                        {money(item.amount)} {item.currency?.code || ''}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewItem(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                            title="Ko'rish"
                          >
                            <Eye size={18} />
                          </button>

                          {item.status === 'PENDING' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                title="Tahrirlash"
                              >
                                <Pencil size={18} />
                              </button>

                              <button
                                type="button"
                                disabled={actionLoadingId === item.id}
                                onClick={() => approveTransfer(item.id)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-70"
                                title="Tasdiqlash"
                              >
                                {actionLoadingId === item.id ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={18} />
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={actionLoadingId === item.id}
                                onClick={() => rejectTransfer(item.id)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:opacity-70"
                                title="Rad etish"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Sahifa {pagination.page} / {pagination.totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadTransfers({ page: pagination.page - 1 })}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Oldingi
                </button>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadTransfers({ page: pagination.page + 1 })}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
            Hozircha o'tkazmalar yo'q
          </div>
        )}
      </section>

      {viewItem ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  O'tkazma ma'lumotlari
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  To‘liq ma'lumotlar
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div>{getStatusBadge(viewItem.status)}</div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs text-slate-400">Jo'natuvchi kassa</div>
                    <div className="mt-1 text-base font-bold text-slate-900">
                      {viewItem.fromCashbox?.name || '-'}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs text-slate-400">Qabul qiluvchi kassa</div>
                    <div className="mt-1 text-base font-bold text-slate-900">
                      {viewItem.toCashbox?.name || '-'}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-400">Summa</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {money(viewItem.amount)} {viewItem.currency?.code || ''}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs text-slate-400">Yaratgan</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {getUserLabel(viewItem.createdBy)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDateTime(viewItem.createdAt)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs text-slate-400">Tasdiqlagan</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {getUserLabel(viewItem.approvedBy)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDateTime(viewItem.approvedAt)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                    <div className="text-xs text-slate-400">Rad etgan</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {getUserLabel(viewItem.rejectedBy)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDateTime(viewItem.rejectedAt)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-400">Izoh</div>
                  <div className="mt-1 text-sm text-slate-700">
                    {viewItem.note || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  {editingItem ? "O'tkazmani tahrirlash" : "Yangi o'tkazma"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Bir xil valyutali kassalar orasida o'tkazma
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

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Jo'natuvchi kassa
                </label>
                <select
                  value={form.fromCashboxId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      fromCashboxId: e.target.value,
                      toCashboxId: '',
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Kassa tanlang</option>
                  {cashboxes.map((cashbox) => (
                    <option key={cashbox.id} value={cashbox.id}>
                      {cashbox.name} — {money(cashbox.balance)} {cashbox.currency?.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Qabul qiluvchi kassa
                </label>
                <select
                  value={form.toCashboxId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      toCashboxId: e.target.value,
                    }))
                  }
                  disabled={!form.fromCashboxId}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                >
                  <option value="">Kassa tanlang</option>
                  {availableToCashboxes.map((cashbox) => (
                    <option key={cashbox.id} value={cashbox.id}>
                      {cashbox.name} — {money(cashbox.balance)} {cashbox.currency?.code}
                    </option>
                  ))}
                </select>
              </div>

              {fromCashbox ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">
                    Valyuta: {fromCashbox.currency?.code}
                  </div>
                  <div className="mt-1">
                    Mavjud balans: {money(fromCashbox.balance)} {fromCashbox.currency?.code}
                  </div>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Summa
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Izoh
                </label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Ixtiyoriy izoh"
                />
              </div>

              <div className="flex justify-end gap-3">
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                  {editingItem ? 'Yangilash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}