import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  PackageCheck,
  Search,
  XCircle,
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../lib/api';
import ImagePreviewModal from '../../components/ImagePreviewModal';

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

export default function InFromOtherStorePage() {
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const loadIncomingTransfers = async ({
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

      const res = await apiFetch(`/inter-store-transfers/incoming?${params.toString()}`);

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
      toast.error(error.message || 'Kiruvchi jo‘natmalar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomingTransfers({ page: 1 });
  }, []);

  const receiveTransfer = async (transferId) => {
    setActionLoadingId(transferId);
    try {
      await apiFetch(`/inter-store-transfers/${transferId}/receive`, {
        method: 'POST',
      });
      toast.success('Jo‘natma qabul qilindi');
      await loadIncomingTransfers();
    } catch (error) {
      toast.error(error.message || 'Qabul qilishda xatolik');
    } finally {
      setActionLoadingId('');
    }
  };

  const rejectTransfer = async (transferId) => {
    setActionLoadingId(transferId);
    try {
      await apiFetch(`/inter-store-transfers/${transferId}/reject`, {
        method: 'POST',
      });
      toast.success('Jo‘natma rad etildi');
      await loadIncomingTransfers();
    } catch (error) {
      toast.error(error.message || 'Rad etishda xatolik');
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <PackageCheck size={22} />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Boshqa ombordan kirim
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Boshqa do‘kondan kelgan jo‘natmalarni qabul qilish
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-3">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Qidirish"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Barcha holatlar</option>
            <option value="IN_TRANSIT">Kutilmoqda</option>
            <option value="RECEIVED">Qabul qilingan</option>
            <option value="REJECTED">Rad etilgan</option>
          </select>

          <button
            type="button"
            onClick={() => loadIncomingTransfers({ page: 1 })}
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
                          {item.fromStore?.name || '-'} / {item.fromWarehouse?.name || '-'}
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

                      {item.sentBy ? (
                        <div className="text-xs text-slate-500">
                          Yuborgan:{' '}
                          <span className="font-semibold text-slate-700">
                            {item.sentBy?.fullName || item.sentBy?.username || '-'}
                          </span>
                        </div>
                      ) : null}

                      {item.note ? (
                        <div className="text-sm text-slate-600">Izoh: {item.note}</div>
                      ) : null}
                    </div>

                    {item.status === 'IN_TRANSIT' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={actionLoadingId === item.id}
                          onClick={() => receiveTransfer(item.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-70"
                        >
                          {actionLoadingId === item.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Qabul qilish
                        </button>

                        <button
                          type="button"
                          disabled={actionLoadingId === item.id}
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
                          <th className="pb-2 font-semibold">Rasm</th>
                          <th className="pb-2 font-semibold">Tovar</th>
                          <th className="pb-2 font-semibold">Razmer</th>
                          <th className="pb-2 font-semibold">Batch</th>
                          <th className="pb-2 font-semibold">Soni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(item.items || []).map((row) => {
                          const imageUrl =
                            row.productVariant?.product?.images?.[0]?.imageUrl
                              ? resolveImageUrl(row.productVariant.product.images[0].imageUrl)
                              : '';

                          return (
                            <tr key={row.id} className="border-b border-slate-100">
                              <td className="py-2">
                                {imageUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreviewImage(imageUrl);
                                      setPreviewTitle(row.productVariant?.product?.name || '');
                                      setPreviewOpen(true);
                                    }}
                                    className="block"
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={row.productVariant?.product?.name || ''}
                                      className="h-12 w-12 rounded-xl object-cover"
                                    />
                                  </button>
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                    <ImageIcon size={16} />
                                  </div>
                                )}
                              </td>
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
                          );
                        })}
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
                  onClick={() => loadIncomingTransfers({ page: pagination.page - 1 })}
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
                  onClick={() => loadIncomingTransfers({ page: pagination.page + 1 })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            Hozircha kiruvchi jo‘natmalar yo‘q
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