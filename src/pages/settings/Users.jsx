import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, X, Users as UsersIcon, Crown } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const initialForm = {
  fullName: '',
  username: '',
  password: '',
  role: 'SELLER',
  isActive: true,
  storeIds: [],
};

function UserModal({
  open,
  onClose,
  onSubmit,
  stores,
  form,
  setForm,
  editingUser,
  saving,
  canAssignDirector,
}) {
  if (!open) return null;

  const toggleStore = (storeId) => {
    setForm((prev) => {
      const exists = prev.storeIds.includes(storeId);

      return {
        ...prev,
        storeIds: exists
          ? prev.storeIds.filter((id) => id !== storeId)
          : [...prev.storeIds, storeId],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {editingUser ? 'Xodimni tahrirlash' : 'Yangi xodim qo‘shish'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Faqat ruxsat doirasidagi xodimlarni boshqarasiz
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                To‘liq ism
              </label>
              <input
                value={form.fullName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Masalan: Ali Valiyev"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>
              <input
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Masalan: ali"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Parol {editingUser ? "(o‘zgartirmasangiz bo‘sh qoldiring)" : ''}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Rol
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="SELLER">SELLER</option>
                {canAssignDirector ? <option value="DIRECTOR">DIRECTOR</option> : null}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">
                Biriktirilgan do‘konlar
              </label>

              {editingUser ? (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                  Faol
                </label>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {stores.map((store) => {
                const checked = form.storeIds.includes(store.id);

                return (
                  <label
                    key={store.id}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
                      checked
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStore(store.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{store.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {store.address || "Manzil ko‘rsatilmagan"}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
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
              {saving
                ? 'Saqlanmoqda...'
                : editingUser
                ? 'Yangilash'
                : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const isOwner = currentUser?.role === 'OWNER';
  const isDirector = currentUser?.role === 'DIRECTOR';

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, storesRes] = await Promise.all([
        apiFetch('/users'),
        apiFetch('/stores'),
      ]);

      setUsers(usersRes || []);
      setStores(storesRes || []);
    } catch (error) {
      toast.error(error.message || 'Xodimlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({
      ...initialForm,
      role: isOwner ? 'SELLER' : 'SELLER',
    });
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      fullName: user.fullName || '',
      username: user.username || '',
      password: '',
      role: user.role || 'SELLER',
      isActive: user.isActive ?? true,
      storeIds: (user.userStores || [])
        .map((item) => item.storeId || item.store?.id)
        .filter(Boolean),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setForm(initialForm);
  };

  const submitForm = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("To‘liq ism majburiy");
      return;
    }

    if (!form.username.trim()) {
      toast.error('Username majburiy');
      return;
    }

    if (!editingUser && !form.password.trim()) {
      toast.error('Parol majburiy');
      return;
    }

    if (!form.storeIds.length) {
      toast.error("Kamida bitta do‘kon tanlang");
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        const payload = {
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          role: form.role,
          isActive: form.isActive,
          storeIds: form.storeIds,
        };

        if (form.password.trim()) {
          payload.password = form.password.trim();
        }

        await apiFetch(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        toast.success('Xodim yangilandi');
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            username: form.username.trim(),
            password: form.password.trim(),
            role: form.role,
            storeIds: form.storeIds,
          }),
        });

        toast.success('Yangi xodim yaratildi');
      }

      closeModal();
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const makeOwner = async (targetUser) => {
    if (!isOwner) return;

    try {
      await apiFetch(`/users/${targetUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          makeOwner: true,
        }),
      });

      toast.success('Ownerlik o‘tkazildi');
      await loadData();
    } catch (error) {
      toast.error(error.message || "Ownerlikni o'tkazib bo'lmadi");
    }
  };

  const rows = useMemo(() => {
    return users.map((user) => ({
      ...user,
      storesText: (user.userStores || [])
        .map((item) => item.store?.name)
        .filter(Boolean)
        .join(', '),
      isSelf: currentUser?.id === user.id,
    }));
  }, [users, currentUser?.id]);

  const visibleRows = useMemo(() => {
    if (isOwner) return rows;
    if (isDirector) return rows.filter((row) => row.role === 'SELLER');
    return [];
  }, [rows, isOwner, isDirector]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <UsersIcon size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Xodimlar boshqaruvi
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                OWNER hammani, DIRECTOR faqat sellerlarni boshqaradi
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Yangi xodim
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 font-semibold">F.I.Sh</th>
                  <th className="pb-3 font-semibold">Username</th>
                  <th className="pb-3 font-semibold">Rol</th>
                  <th className="pb-3 font-semibold">Do‘konlar</th>
                  <th className="pb-3 font-semibold">Holati</th>
                  <th className="pb-3 font-semibold text-right">Amal</th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.length > 0 ? (
                  visibleRows.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50">
                      <td className="py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{user.fullName}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 text-slate-700">{user.username}</td>

                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.role === 'OWNER'
                              ? 'bg-amber-50 text-amber-700'
                              : user.role === 'DIRECTOR'
                              ? 'bg-violet-50 text-violet-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3 text-slate-700">{user.storesText || '-'}</td>

                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {user.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {!user.isSelf ? (
                            <button
                              onClick={() => openEditModal(user)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              <Pencil size={14} />
                              Tahrirlash
                            </button>
                          ) : (
                            <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                              O'zingiz
                            </span>
                          )}

                          {isOwner && user.role === 'DIRECTOR' && !user.isSelf ? (
                            <button
                              onClick={() => makeOwner(user)}
                              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                            >
                              <Crown size={14} />
                              Owner qilish
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-slate-500">
                      Hozircha ko‘rsatadigan xodimlar yo‘q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={submitForm}
        stores={stores}
        form={form}
        setForm={setForm}
        editingUser={editingUser}
        saving={saving}
        canAssignDirector={isOwner}
      />
    </div>
  );
}