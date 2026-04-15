import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Eye,
  PackagePlus,
  Plus,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import SupplierInFormModal from './components/SupplierInFormModal';
import SupplierInDetailsModal from './components/SupplierInDetailsModal';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function getStatusLabel(status) {
  switch (status) {
    case 'PENDING':
      return 'Jarayonda';
    case 'APPROVED':
      return 'Tasdiqlangan';
    case 'REJECTED':
      return 'Rad etilgan';
    default:
      return status || '-';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-600';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-600';
    case 'PENDING':
    default:
      return 'bg-amber-50 text-amber-600';
  }
}

const PAGE_SIZE = 10;

export default function SupplierInPage() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const canApprove = user?.role === 'DIRECTOR';

  const loadData = async (page = pagination.page, currentStatus = status) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));
      if (currentStatus) params.set('status', currentStatus);

      const res = await apiFetch(`/supplier-ins?${params.toString()}`);

      setItems(res.items || []);
      setPagination(
        res.pagination || {
          page: 1,
          pageSize: PAGE_SIZE,
          totalItems: 0,
          totalPages: 0,
        }
      );
    } catch (error) {
      toast.error(error.message || 'Kirim hujjatlari yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, status);
  }, [status]);

  const openDetails = async (itemId) => {
    setDetailsLoading(true);
    try {
      const res = await apiFetch(`/supplier-ins/${itemId}`);
      setSelectedItem(res);
      setDetailsOpen(true);
    } catch (error) {
      toast.error(error.message || 'Tafsilot yuklanmadi');
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshSelected = async () => {
    if (!selectedItem?.id) return;

    const res = await apiFetch(`/supplier-ins/${selectedItem.id}`);
    setSelectedItem(res);
    await loadData(pagination.page, status);
  };

  const handleApprove = async (itemId) => {
  setApprovingId(itemId);
  try {
    await apiFetch(`/supplier-ins/${itemId}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    toast.success('Kirim hujjati tasdiqlandi');

    // modal ochiq bo'lsa yopamiz
    if (selectedItem?.id === itemId) {
      setDetailsOpen(false);
      setSelectedItem(null);
    }

    await loadData(pagination.page, status);
  } catch (error) {
    toast.error(error.message || 'Tasdiqlashda xatolik');
  } finally {
    setApprovingId(null);
  }
};

const handleReject = async (itemId) => {
  setRejectingId(itemId);
  try {
    await apiFetch(`/supplier-ins/${itemId}/reject`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    toast.success('Kirim hujjati rad etildi');

    // modal ochiq bo'lsa yopamiz
    if (selectedItem?.id === itemId) {
      setDetailsOpen(false);
      setSelectedItem(null);
    }

    await loadData(pagination.page, status);
  } catch (error) {
    toast.error(error.message || 'Rad etishda xatolik');
  } finally {
    setRejectingId(null);
  }
};

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <PackagePlus size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Taminotchidan tovar kirimi
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Kirim hujjatlari, tasdiqlash va tarix
              </p>
            </div>
          </div>

          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Yangi kirim
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setStatus('')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                status === ''
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Barchasi
            </button>

            <button
              onClick={() => setStatus('PENDING')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                status === 'PENDING'
                  ? 'bg-amber-500 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Jarayonda
            </button>

            <button
              onClick={() => setStatus('APPROVED')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                status === 'APPROVED'
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Tasdiqlangan
            </button>

            <button
              onClick={() => setStatus('REJECTED')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                status === 'REJECTED'
                  ? 'bg-rose-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Rad etilgan
            </button>
          </div>

          <div className="text-sm text-slate-500">Jami: {pagination.totalItems || 0}</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Yuklanmoqda...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="pb-3 font-semibold">Sana</th>
                    <th className="pb-3 font-semibold">Taminotchi</th>
                    <th className="pb-3 font-semibold">Ombor</th>
                    <th className="pb-3 font-semibold">Jo‘natgan</th>
                    <th className="pb-3 font-semibold">Qatorlar</th>
                    <th className="pb-3 font-semibold">Jami</th>
                    <th className="pb-3 font-semibold">Holati</th>
                    <th className="pb-3 text-right font-semibold">Amallar</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length > 0 ? (
                    items.map((item) => {
                      const totalAmount = (item.items || []).reduce(
                        (sum, row) =>
                          sum + Number(row.quantity || 0) * Number(row.costPrice || 0),
                        0
                      );

                      const isApproving = approvingId === item.id;
                      const isRejecting = rejectingId === item.id;
                      const actionLoading = isApproving || isRejecting;

                      return (
                        <tr key={item.id} className="border-b border-slate-50">
                          <td className="py-3 text-slate-700">
                            {new Date(item.createdAt).toLocaleString('uz-UZ')}
                          </td>

                          <td className="py-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.supplier?.name || '-'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.supplier?.phone || '-'}
                              </p>
                            </div>
                          </td>

                          <td className="py-3 text-slate-700">{item.warehouse?.name || '-'}</td>

                          <td className="py-3 text-slate-700">
                            {item.submittedBy?.fullName || '-'}
                          </td>

                          <td className="py-3 text-slate-700">{item.items?.length || 0}</td>

                          <td className="py-3 font-semibold text-slate-900">
                            {money(totalAmount)}
                          </td>

                          <td className="py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                item.status
                              )}`}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </td>

                          <td className="py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openDetails(item.id)}
                                disabled={detailsLoading}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
                                title="Ko‘rish"
                              >
                                {detailsLoading ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>

                              {canApprove && item.status === 'PENDING' ? (
                                <>
                                  <button
                                    onClick={() => handleReject(item.id)}
                                    disabled={actionLoading}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                                    title="Rad etish"
                                  >
                                    {isRejecting ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <X size={16} />
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleApprove(item.id)}
                                    disabled={actionLoading}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                    title="Tasdiqlash"
                                  >
                                    {isApproving ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Check size={16} />
                                    )}
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-sm text-slate-500">
                        Hozircha kirim hujjatlari yo‘q
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Sahifa {pagination.page} / {pagination.totalPages || 1}
              </p>

              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadData(pagination.page - 1, status)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Oldingi
                </button>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadData(pagination.page + 1, status)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {detailsLoading ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px]">
          <div className="rounded-2xl bg-white px-5 py-4 shadow-xl">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <Loader2 size={18} className="animate-spin" />
              Tafsilot yuklanmoqda...
            </div>
          </div>
        </div>
      ) : null}

      <SupplierInFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => loadData(1, status)}
      />

      <SupplierInDetailsModal
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onApprove={() => handleApprove(selectedItem.id)}
        onReject={() => handleReject(selectedItem.id)}
        approving={approvingId === selectedItem?.id}
        rejecting={rejectingId === selectedItem?.id}
        canApprove={canApprove}
      />
    </div>
  );
}