import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Plus } from 'lucide-react';

import { apiFetch } from '../../lib/api';
import SimpleReferenceModal from './components/SimpleReferenceModal';

function SortableSizeRow({ item, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-100 ${
        isDragging ? 'bg-blue-50' : 'bg-white'
      }`}
    >
      <td className="py-3 pr-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:cursor-grabbing"
          title="Bosib turib joyini almashtiring"
        >
          <GripVertical size={14} />
        </button>
      </td>

      <td className="py-3 font-semibold text-slate-900">{item.name}</td>

      <td className="py-3 text-slate-600">
        {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
      </td>

      <td className="py-3 text-right">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Pencil size={14} />
          Tahrirlash
        </button>
      </td>
    </tr>
  );
}

export default function SizesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

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
      await loadItems();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);

    setItems(reordered);

    try {
      await apiFetch('/reference/sizes/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          sizeIds: reordered.map((item) => item.id),
        }),
      });

      toast.success('Razmerlar tartibi yangilandi');
      await loadItems();
    } catch (error) {
      toast.error(error.message || 'Razmer tartibini saqlashda xatolik');
      await loadItems();
    }
  };

  const rows = useMemo(() => items, [items]);

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Razmerlar
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Global razmerlar ro‘yxati
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Razmer qo‘shish
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Yuklanmoqda...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="w-[56px] pb-3 font-semibold"></th>
                    <th className="pb-3 font-semibold">Razmer</th>
                    <th className="pb-3 font-semibold">Sana</th>
                    <th className="pb-3 text-right font-semibold">Amal</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={rows.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {rows.map((item) => (
                          <SortableSizeRow
                            key={item.id}
                            item={item}
                            onEdit={openEdit}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-12 text-center text-sm text-slate-500"
                      >
                        Hozircha razmerlar yo‘q
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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