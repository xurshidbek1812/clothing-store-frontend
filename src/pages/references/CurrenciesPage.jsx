import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Star, Coins } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import SimpleReferenceModal from './components/SimpleReferenceModal';

const initialForm = {
  name: '',
  code: '',
  symbol: '',
  rate: 1,
  isDefault: false,
};

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

export default function CurrenciesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);

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
    setForm(initialForm);
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
    setForm(initialForm);
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
      toast.error('Nomi, code va belgi majburiy');
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
      await loadItems();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (item) => {
    if (item.isDefault) return;

    try {
      await apiFetch(`/reference/currencies/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isDefault: true,
        }),
      });

      toast.success('Asosiy valyuta yangilandi');
      await loadItems();
    } catch (error) {
      toast.error(error.message || 'Asosiy valyutani o‘zgartirishda xatolik');
    }
  };

  const defaultCurrency = useMemo(
    () => items.find((item) => item.isDefault) || null,
    [items]
  );

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-2.5 text-amber-600">
                <Coins size={20} />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900">
                  Valyutalar
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Asosiy valyuta va kurslarni boshqarish
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Valyuta qo‘shish
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">Asosiy valyuta:</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
              {defaultCurrency
                ? `${defaultCurrency.code} • ${defaultCurrency.name}`
                : 'Tanlanmagan'}
            </span>
            <span className="text-slate-400">Jami: {items.length} ta</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Yuklanmoqda...
            </div>
          ) : items.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-3 ${
                    item.isDefault
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">
                          {item.code}
                        </h3>
                        {item.isDefault ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Asosiy
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-0.5 text-sm text-slate-500">
                        {item.name}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-700">
                      {item.symbol}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-xs text-slate-400">Kurs</span>
                    <span className="text-sm font-black text-slate-900">
                      {money(item.rate)}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {!item.isDefault ? (
                      <button
                        type="button"
                        onClick={() => makeDefault(item)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Star size={14} />
                        Asosiy qilish
                      </button>
                    ) : (
                      <div className="inline-flex flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                        Asosiy
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil size={14} />
                      Tahrirlash
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">
              Hozircha valyutalar yo‘q
            </div>
          )}
        </div>
      </div>

      <SimpleReferenceModal
        open={open}
        title={editingItem ? 'Valyutani tahrirlash' : 'Yangi valyuta'}
        fields={[
          { name: 'name', label: 'Nomi', placeholder: "Masalan: O'zbek so'mi" },
          { name: 'code', label: 'Code', placeholder: 'UZS' },
          { name: 'symbol', label: 'Belgi', placeholder: "so'm yoki $" },
          { name: 'rate', label: 'Kurs', type: 'number', placeholder: '1' },
          {
            name: 'isDefault',
            label: 'Asosiy valyuta',
            type: 'checkbox',
            checkboxLabel: 'Asosiy valyuta qilish',
          },
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