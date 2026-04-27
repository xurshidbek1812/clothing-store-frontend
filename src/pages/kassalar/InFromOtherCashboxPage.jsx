import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownToLine,
  CheckCircle2,
  Eye,
  Loader2,
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
  if (status === 'IN_TRANSIT') {
    return (
      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        Kutilmoqda
      </span>
    );
  }

  if (status === 'RECEIVED') {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Qabul qilingan
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

export default function InFromOtherCashboxPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    q: '',
    status: 'IN_TRANSIT',
  });

  const [viewItem, setViewItem] = useState(null);

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

    const res = await apiFetch(`/inter-store-cash-transfers/incoming?${params.toString()}`);

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
      await loadTransfers({ page: 1 });
    } catch (error) {
      toast.error(error.message || "Ma'lumotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const receiveTransfer = async (transferId) => {
    setActionLoadingId(transferId);
    try {
      await apiFetch(`/inter-store-cash-transfers/${transferId}/receive`, {
        method: 'POST',
      });
      toast.success("O'tkazma qabul qilindi");
      await loadTransfers();
    } catch (error) {
      toast.error(error.message || "Qabul qilishda xatolik");
    } finally {
      setActionLoadingId('');
    }
  };

  const rejectTransfer = async (transferId) => {
    setActionLoadingId(transferId);
    try {
      await apiFetch(`/inter-store-cash-transfers/${transferId}/reject`, {
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
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ArrowDownToLine size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Boshqa kassadan kirim
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Boshqa do‘kondan kelgan pul o'tkazmalarini qabul qilish
            </p>
          </div>
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
              <option value="IN_TRANSIT">Kutilmoqda</option>
              <option value="RECEIVED">Qabul qilingan</option>
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
                    <th className="border-b border-slate-200 px-4 py-3">Jo'natgan</th>
                    <th className="border-b border-slate-200 px-4 py-3">Qabul qiluvchi kassa</th>
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
                          {item.fromStore?.name || '-'} / {item.fromCashbox?.name || '-'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Yaratgan: {getUserLabel(item.createdBy)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Yuborgan: {getUserLabel(item.sentBy)}
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {item.toCashbox?.name || '-'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.currency?.code || '-'}
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

                          {item.status === 'IN_TRANSIT' ? (
                            <>
                              <button
                                type="button"
                                disabled={actionLoadingId === item.id}
                                onClick={() => receiveTransfer(item.id)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-70"
                                title="Qabul qilish"
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
            Hozircha kiruvchi o'tkazmalar yo'q
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
                    <div className="text-xs text-slate-400">Jo'natgan</div>
                    <div className="mt-1 text-base font-bold text-slate-900">
                      {viewItem.fromStore?.name || '-'} / {viewItem.fromCashbox?.name || '-'}
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
                    <div className="text-xs text-slate-400">Yuborgan</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {getUserLabel(viewItem.sentBy)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDateTime(viewItem.sentAt)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                    <div className="text-xs text-slate-400">Qabul qilgan</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {getUserLabel(viewItem.receivedBy)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDateTime(viewItem.receivedAt)}
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
    </div>
  );
}