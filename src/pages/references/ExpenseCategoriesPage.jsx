import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../lib/api';
import SimpleReferenceModal from './components/SimpleReferenceModal';
import SimpleReferenceTable from './components/SimpleReferenceTable';

export default function ExpenseCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '' });

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/reference/expense-categories');
      setItems(res || []);
    } catch (error) {
      toast.error(error.message || 'Xarajat moddalari yuklanmadi');
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
      toast.error('Xarajat moddasi nomi majburiy');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await apiFetch(`/reference/expense-categories/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Xarajat moddasi yangilandi');
      } else {
        await apiFetch('/reference/expense-categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Xarajat moddasi yaratildi');
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
        title="Xarajat moddalari"
        subtitle="Kassa chiqimlari uchun moddalar"
        buttonText="Xarajat moddasi qo‘shish"
        onAdd={openCreate}
        loading={loading}
        columns={[
          { key: 'name', title: 'Nomi' },
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
        title={editingItem ? 'Xarajat moddasini tahrirlash' : 'Yangi xarajat moddasi'}
        fields={[{ name: 'name', label: 'Nomi', placeholder: 'Masalan: Ijara' }]}
        values={form}
        setValues={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </>
  );
}