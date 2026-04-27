import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  KeyRound,
  Loader2,
  Pencil,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

function ActionModal({
  open,
  title,
  subtitle,
  children,
  onClose,
  onSubmit,
  saving,
  submitText = 'Saqlash',
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          {children}

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
              {saving ? 'Saqlanmoqda...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [savingName, setSavingName] = useState(false);
  const [savingLogin, setSavingLogin] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [nameForm, setNameForm] = useState({
    fullName: '',
  });

  const [loginForm, setLoginForm] = useState({
    username: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/settings/profile');
      setProfile(res || null);

      setNameForm({
        fullName: res?.fullName || '',
      });

      setLoginForm({
        username: res?.username || '',
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.message || "Profil ma'lumotlari yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateName = async (e) => {
    e.preventDefault();

    const fullName = String(nameForm.fullName || '').trim();

    if (!fullName) {
      toast.error('Ism majburiy');
      return;
    }

    setSavingName(true);
    try {
      const res = await apiFetch('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName }),
      });

      toast.success(res?.message || 'Ism yangilandi');
      setNameModalOpen(false);
      await loadProfile();
    } catch (error) {
      toast.error(error.message || 'Ismni yangilashda xatolik');
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdateLogin = async (e) => {
    e.preventDefault();

    const username = String(loginForm.username || '').trim();

    if (!username) {
      toast.error('Login majburiy');
      return;
    }

    setSavingLogin(true);
    try {
      const res = await apiFetch('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify({ username }),
      });

      toast.success(res?.message || 'Login yangilandi');
      setLoginModalOpen(false);
      await loadProfile();
    } catch (error) {
      toast.error(error.message || 'Loginni yangilashda xatolik');
    } finally {
      setSavingLogin(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    const currentPassword = String(passwordForm.currentPassword || '');
    const newPassword = String(passwordForm.newPassword || '');
    const confirmPassword = String(passwordForm.confirmPassword || '');

    if (!currentPassword.trim()) {
      toast.error('Hozirgi parolni kiriting');
      return;
    }

    if (!newPassword.trim()) {
      toast.error('Yangi parolni kiriting');
      return;
    }

    if (newPassword.length < 4) {
      toast.error("Yangi parol kamida 4 ta belgidan iborat bo'lsin");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Yangi parollar mos emas');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiFetch('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      toast.success(res?.message || 'Parol yangilandi');
      setPasswordModalOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.message || 'Parolni yangilashda xatolik');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <UserCircle2 size={22} />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Profil sozlamalari
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Ism, login va parolni alohida boshqarish
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Yuklanmoqda...
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <UserCircle2 size={18} className="text-slate-500" />
                <h2 className="text-lg font-black text-slate-900">
                  Profil ma'lumotlari
                </h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Ism</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {profile?.fullName || '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Login</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {profile?.username || '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Rol</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {profile?.role || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-slate-500" />
                <h2 className="text-lg font-black text-slate-900">
                  Amallar
                </h2>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setNameModalOpen(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <UserCircle2 size={18} className="text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Ismni almashtirish
                      </p>
                      <p className="text-xs text-slate-500">
                        Oldingi ismni kiritish shart emas
                      </p>
                    </div>
                  </div>
                  <Pencil size={16} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setLoginModalOpen(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <Pencil size={18} className="text-violet-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Loginni almashtirish
                      </p>
                      <p className="text-xs text-slate-500">
                        Oldingi loginni kiritish shart emas
                      </p>
                    </div>
                  </div>
                  <Pencil size={16} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <KeyRound size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Parolni almashtirish
                      </p>
                      <p className="text-xs text-slate-500">
                        Hozirgi parolni kiritish majburiy
                      </p>
                    </div>
                  </div>
                  <Pencil size={16} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ActionModal
        open={nameModalOpen}
        onClose={() => setNameModalOpen(false)}
        onSubmit={handleUpdateName}
        saving={savingName}
        title="Ismni almashtirish"
        subtitle="Yangi ismni kiriting"
        submitText="Yangilash"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Yangi ism
          </label>
          <input
            value={nameForm.fullName}
            onChange={(e) =>
              setNameForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            placeholder="Yangi ism"
          />
        </div>
      </ActionModal>

      <ActionModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSubmit={handleUpdateLogin}
        saving={savingLogin}
        title="Loginni almashtirish"
        subtitle="Yangi loginni kiriting"
        submitText="Yangilash"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Yangi login
          </label>
          <input
            value={loginForm.username}
            onChange={(e) =>
              setLoginForm((prev) => ({ ...prev, username: e.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            placeholder="Yangi login"
          />
        </div>
      </ActionModal>

      <ActionModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={handleUpdatePassword}
        saving={savingPassword}
        title="Parolni almashtirish"
        subtitle="Hozirgi va yangi parolni kiriting"
        submitText="Yangilash"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Hozirgi parol
          </label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            placeholder="Hozirgi parol"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Yangi parol
          </label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            placeholder="Yangi parol"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Yangi parolni tasdiqlang
          </label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            placeholder="Yangi parolni qayta kiriting"
          />
        </div>
      </ActionModal>
    </>
  );
}