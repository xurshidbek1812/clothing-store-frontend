import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../lib/api';
import SimpleReferenceModal from './components/SimpleReferenceModal';
import SimpleReferenceTable from './components/SimpleReferenceTable';

export default function CurrenciesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    symbol: '',
    rate: 1,
    isDefault: false,
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/reference/currencies');
      setItems(res || []);
    } catch (error) {
      toast.error(error.message || 'Valyutalar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      name: '',
      code: '',
      symbol: '',
      rate: 1,
      isDefault: false,
    });
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      code: item.code || '',
      symbol: item.symbol || '',
      rate: item.rate ?? 1,
      isDefault: item.isDefault ?? false,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
    setForm({
      name: '',
      code: '',
      symbol: '',
      rate: 1,
      isDefault: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: String(form.name || '').trim(),
      code: String(form.code || '').trim().toUpperCase(),
      symbol: String(form.symbol || '').trim(),
      rate: Number(form.rate),
      isDefault: Boolean(form.isDefault),
    };

    if (!payload.name || !payload.code || !payload.symbol) {
      toast.error('name, code va symbol majburiy');
      return;
    }

    if (Number.isNaN(payload.rate) || payload.rate <= 0) {
      toast.error("Valyuta kursi to'g'ri bo'lishi kerak");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await apiFetch(`/reference/currencies/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Valyuta yangilandi');
      } else {
        await apiFetch('/reference/currencies', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Valyuta yaratildi');
      }

      closeModal();
      loadItems();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SimpleReferenceTable
        title="Valyutalar"
        subtitle="Kassa va hisob-kitob uchun valyutalar"
        buttonText="Valyuta qo‘shish"
        onAdd={openCreate}
        loading={loading}
        columns={[
          { key: 'name', title: 'Nomi' },
          { key: 'code', title: 'Code' },
          { key: 'symbol', title: 'Belgi' },
          { key: 'rate', title: 'Kurs' },
          {
            key: 'isDefault',
            title: 'Asosiy',
            render: (row) =>
              row.isDefault ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  Ha
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  Yo‘q
                </span>
              ),
          },
        ]}
        rows={items}
        onEdit={openEdit}
      />

      <SimpleReferenceModal
        open={open}
        title={editingItem ? 'Valyutani tahrirlash' : 'Yangi valyuta'}
        fields={[
          { name: 'name', label: 'Nomi', placeholder: "Masalan: O'zbek so'mi" },
          { name: 'code', label: 'Code', placeholder: 'UZS' },
          { name: 'symbol', label: 'Belgi', placeholder: "so'm yoki $" },
          { name: 'rate', label: 'Kurs', type: 'number', placeholder: '1' },
          { name: 'isDefault', label: 'Asosiy valyuta', type: 'checkbox', checkboxLabel: 'Asosiy valyuta' },
        ]}
        values={form}
        setValues={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </>
  );
}