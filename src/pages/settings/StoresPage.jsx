import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Loader2, Pencil, Plus, Search, X } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const initialForm = {
  name: '',
  address: '',
  isActive: true,
};

function StoreModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  saving,
  editingStore,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {editingStore ? "Do'konni tahrirlash" : "Yangi do'kon"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {editingStore
                ? "Do'kon ma'lumotlarini yangilang"
                : "Yangi do'kon ma'lumotlarini kiriting"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Do'kon nomi
            </label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Masalan: Chilonzor filiali"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Manzil
            </label>
            <textarea
              rows={4}
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Do'kon manzili"
            />
          </div>

          {editingStore ? (
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={Boolean(form.isActive)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm font-semibold text-slate-700">
                Faol do'kon
              </span>
            </label>
          ) : null}

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
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving
                ? 'Saqlanmoqda...'
                : editingStore
                ? 'Yangilash'
                : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StoresPage() {
  const { refreshStores } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/stores');
      setStores(res || []);
    } catch (error) {
      toast.error(error.message || "Do'konlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const filteredStores = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return stores;

    return stores.filter((store) => {
      const name = String(store.name || '').toLowerCase();
      const address = String(store.address || '').toLowerCase();
      return name.includes(q) || address.includes(q);
    });
  }, [stores, search]);

  const openCreate = () => {
    setEditingStore(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (store) => {
    setEditingStore(store);
    setForm({
      name: store.name || '',
      address: store.address || '',
      isActive: Boolean(store.isActive),
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingStore(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: String(form.name || '').trim(),
      address: String(form.address || '').trim() || null,
      ...(editingStore ? { isActive: Boolean(form.isActive) } : {}),
    };

    if (!payload.name) {
      toast.error("Do'kon nomi majburiy");
      return;
    }

    setSaving(true);
    try {
      if (editingStore) {
        await apiFetch(`/stores/${editingStore.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success("Do'kon yangilandi");
      } else {
        await apiFetch('/stores', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success("Do'kon yaratildi");
      }

      closeModal();
      await loadStores();
      await refreshStores();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <Building2 size={22} />
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  Do'konlar
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Do'konlarni yaratish va tahrirlash
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Yangi do'kon
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Do'kon nomi yoki manzil bo'yicha qidirish"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Yuklanmoqda...
            </div>
          ) : filteredStores.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredStores.map((store) => (
                <div
                  key={store.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-black text-slate-900">
                        {store.name}
                      </div>

                      <div className="mt-2">
                        {store.isActive ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Faol
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            Faol emas
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEdit(store)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      <Pencil size={14} />
                      Tahrirlash
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold text-slate-400">Manzil</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {store.address || 'Kiritilmagan'}
                    </p>
                  </div>

                  <div className="mt-3 text-xs text-slate-400">
                    Yaratilgan: {new Date(store.createdAt).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              Do'konlar topilmadi
            </div>
          )}
        </div>
      </div>

      <StoreModal
        open={open}
        onClose={closeModal}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        saving={saving}
        editingStore={editingStore}
      />
    </>
  );
}