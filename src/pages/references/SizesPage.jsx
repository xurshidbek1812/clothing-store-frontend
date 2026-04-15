import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../lib/api';
import SimpleReferenceModal from './components/SimpleReferenceModal';
import SimpleReferenceTable from './components/SimpleReferenceTable';

export default function SizesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '' });

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/reference/sizes');
      setItems(res || []);
    } catch (error) {
      toast.error(error.message || 'Razmerlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ name: '' });
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ name: item.name || '' });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
    setForm({ name: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { name: String(form.name || '').trim() };

    if (!payload.name) {
      toast.error('Razmer nomi majburiy');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await apiFetch(`/reference/sizes/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Razmer yangilandi');
      } else {
        await apiFetch('/reference/sizes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Razmer yaratildi');
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
        title="Razmerlar"
        subtitle="Global razmerlar ro‘yxati"
        buttonText="Razmer qo‘shish"
        onAdd={openCreate}
        loading={loading}
        columns={[
          { key: 'name', title: 'Razmer' },
          {
            key: 'createdAt',
            title: 'Sana',
            render: (row) => new Date(row.createdAt).toLocaleDateString('uz-UZ'),
          },
        ]}
        rows={items}
        onEdit={openEdit}
      />

      <SimpleReferenceModal
        open={open}
        title={editingItem ? 'Razmerni tahrirlash' : 'Yangi razmer'}
        fields={[{ name: 'name', label: 'Razmer', placeholder: 'Masalan: XL' }]}
        values={form}
        setValues={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </>
  );
}