import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Truck } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import SupplierModal from './components/SupplierModal';

const initialForm = {
  name: '',
  phone: '',
  address: '',
  isActive: true,
};

export default function SuppliersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/suppliers');
      setItems(res || []);
    } catch (error) {
      toast.error(error.message || 'Taminotchilar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      phone: item.phone || '',
      address: item.address || '',
      isActive: item.isActive ?? true,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: String(form.name || '').trim(),
      phone: form.phone ? String(form.phone).trim() : null,
      address: form.address ? String(form.address).trim() : null,
      isActive: Boolean(form.isActive),
    };

    if (!payload.name) {
      toast.error('Taminotchi nomi majburiy');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await apiFetch(`/suppliers/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Taminotchi yangilandi');
      } else {
        await apiFetch('/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Taminotchi yaratildi');
      }

      closeModal();
      loadItems();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(() => items, [items]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Truck size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Taminotchilar
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Taminotchilar ro‘yxati va boshqaruvi
              </p>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Yangi taminotchi
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
                  <th className="pb-3 font-semibold">Nomi</th>
                  <th className="pb-3 font-semibold">Telefon</th>
                  <th className="pb-3 font-semibold">Manzil</th>
                  <th className="pb-3 font-semibold">Holati</th>
                  <th className="pb-3 text-right font-semibold">Amal</th>
                </tr>
              </thead>

              <tbody>
                {rows.length > 0 ? (
                  rows.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 text-slate-700">{item.phone || '-'}</td>
                      <td className="py-3 text-slate-700">{item.address || '-'}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {item.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Tahrirlash
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-sm text-slate-500">
                      Hozircha taminotchilar yo‘q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SupplierModal
        open={open}
        onClose={closeModal}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        saving={saving}
        editingItem={editingItem}
      />
    </div>
  );
}