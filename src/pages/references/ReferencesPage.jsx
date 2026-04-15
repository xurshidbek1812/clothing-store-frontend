import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, X, BookOpen } from 'lucide-react';
import { apiFetch } from '../../lib/api';

function SimpleModal({
  open,
  title,
  fields,
  values,
  setValues,
  onClose,
  onSubmit,
  saving,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-xl font-black tracking-tight text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {field.label}
              </label>

              {field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(values[field.name])}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.name]: e.target.checked,
                      }))
                    }
                  />
                  {field.checkboxLabel || field.label}
                </label>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={values[field.name] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.name]: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder={field.placeholder || ''}
                />
              )}
            </div>
          ))}

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
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, buttonText, onAdd, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus size={16} />
          {buttonText}
        </button>
      </div>

      {children}
    </div>
  );
}

function SimpleTable({ columns, rows, onEdit }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className="pb-3 font-semibold">
                {col.title}
              </th>
            ))}
            <th className="pb-3 text-right font-semibold">Amal</th>
          </tr>
        </thead>

        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}

                <td className="py-3 text-right">
                  <button
                    onClick={() => onEdit(row)}
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
              <td
                colSpan={columns.length + 1}
                className="py-10 text-center text-sm text-slate-500"
              >
                Hozircha ma’lumot yo‘q
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ReferencesPage() {
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [categoriesRes, expenseRes, sizesRes, currenciesRes] = await Promise.all([
        apiFetch('/reference/categories'),
        apiFetch('/reference/expense-categories'),
        apiFetch('/reference/sizes'),
        apiFetch('/reference/currencies'),
      ]);

      setCategories(categoriesRes || []);
      setExpenseCategories(expenseRes || []);
      setSizes(sizesRes || []);
      setCurrencies(currenciesRes || []);
    } catch (error) {
      toast.error(error.message || "Ma'lumotnomalar yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);

    if (type === 'category') {
      setForm({ name: item?.name || '' });
    }

    if (type === 'expenseCategory') {
      setForm({ name: item?.name || '' });
    }

    if (type === 'size') {
      setForm({ name: item?.name || '' });
    }

    if (type === 'currency') {
      setForm({
        name: item?.name || '',
        code: item?.code || '',
        symbol: item?.symbol || '',
        rate: item?.rate ?? 1,
        isDefault: item?.isDefault ?? false,
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setForm({});
  };

  const currentModalConfig = (() => {
    if (modalType === 'category') {
      return {
        title: editingItem ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya',
        fields: [{ name: 'name', label: 'Nomi', placeholder: 'Masalan: Kurtkalar' }],
      };
    }

    if (modalType === 'expenseCategory') {
      return {
        title: editingItem ? "Xarajat moddasini tahrirlash" : "Yangi xarajat moddasi",
        fields: [{ name: 'name', label: 'Nomi', placeholder: 'Masalan: Ijara' }],
      };
    }

    if (modalType === 'size') {
      return {
        title: editingItem ? 'Razmerni tahrirlash' : 'Yangi razmer',
        fields: [{ name: 'name', label: 'Razmer', placeholder: 'Masalan: XL' }],
      };
    }

    if (modalType === 'currency') {
      return {
        title: editingItem ? 'Valyutani tahrirlash' : 'Yangi valyuta',
        fields: [
          { name: 'name', label: 'Nomi', placeholder: "Masalan: O'zbek so'mi" },
          { name: 'code', label: 'Code', placeholder: 'UZS' },
          { name: 'symbol', label: 'Belgi', placeholder: "so'm yoki $" },
          { name: 'rate', label: 'Kurs', type: 'number', placeholder: '1' },
          { name: 'isDefault', label: 'Default', type: 'checkbox', checkboxLabel: 'Asosiy valyuta' },
        ],
      };
    }

    return null;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modalType) return;

    setSaving(true);

    try {
      if (modalType === 'category') {
        const payload = { name: String(form.name || '').trim() };
        if (!payload.name) throw new Error('Kategoriya nomi majburiy');

        if (editingItem) {
          await apiFetch(`/reference/categories/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
          toast.success('Kategoriya yangilandi');
        } else {
          await apiFetch('/reference/categories', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          toast.success('Kategoriya yaratildi');
        }
      }

      if (modalType === 'expenseCategory') {
        const payload = { name: String(form.name || '').trim() };
        if (!payload.name) throw new Error('Xarajat moddasi nomi majburiy');

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
      }

      if (modalType === 'size') {
        const payload = { name: String(form.name || '').trim() };
        if (!payload.name) throw new Error('Razmer nomi majburiy');

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
      }

      if (modalType === 'currency') {
        const payload = {
          name: String(form.name || '').trim(),
          code: String(form.code || '').trim().toUpperCase(),
          symbol: String(form.symbol || '').trim(),
          rate: Number(form.rate),
          isDefault: Boolean(form.isDefault),
        };

        if (!payload.name || !payload.code || !payload.symbol) {
          throw new Error('Valyuta uchun name, code va symbol majburiy');
        }

        if (!payload.rate || Number.isNaN(payload.rate) || payload.rate <= 0) {
          throw new Error("Valyuta kursi to'g'ri bo'lishi kerak");
        }

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
      }

      closeModal();
      loadAll();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Ma’lumotnomalar
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Kategoriyalar, razmerlar, valyutalar va xarajat moddalari
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Yuklanmoqda...
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard
            title="Kategoriyalar"
            subtitle="Store bo‘yicha tovar kategoriyalari"
            buttonText="Kategoriya qo‘shish"
            onAdd={() => openModal('category')}
          >
            <SimpleTable
              columns={[
                { key: 'name', title: 'Nomi' },
                {
                  key: 'createdAt',
                  title: 'Sana',
                  render: (row) => new Date(row.createdAt).toLocaleDateString('uz-UZ'),
                },
              ]}
              rows={categories}
              onEdit={(item) => openModal('category', item)}
            />
          </SectionCard>

          <SectionCard
            title="Xarajat moddalari"
            subtitle="Kassa chiqimlari uchun moddalar"
            buttonText="Xarajat moddasi qo‘shish"
            onAdd={() => openModal('expenseCategory')}
          >
            <SimpleTable
              columns={[
                { key: 'name', title: 'Nomi' },
                {
                  key: 'createdAt',
                  title: 'Sana',
                  render: (row) => new Date(row.createdAt).toLocaleDateString('uz-UZ'),
                },
              ]}
              rows={expenseCategories}
              onEdit={(item) => openModal('expenseCategory', item)}
            />
          </SectionCard>

          <SectionCard
            title="Razmerlar"
            subtitle="Global razmerlar ro‘yxati"
            buttonText="Razmer qo‘shish"
            onAdd={() => openModal('size')}
          >
            <SimpleTable
              columns={[
                { key: 'name', title: 'Razmer' },
                {
                  key: 'createdAt',
                  title: 'Sana',
                  render: (row) => new Date(row.createdAt).toLocaleDateString('uz-UZ'),
                },
              ]}
              rows={sizes}
              onEdit={(item) => openModal('size', item)}
            />
          </SectionCard>

          <SectionCard
            title="Valyutalar"
            subtitle="Kassa va hisob-kitob uchun valyutalar"
            buttonText="Valyuta qo‘shish"
            onAdd={() => openModal('currency')}
          >
            <SimpleTable
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
              rows={currencies}
              onEdit={(item) => openModal('currency', item)}
            />
          </SectionCard>
        </div>
      )}

      <SimpleModal
        open={Boolean(modalType)}
        title={currentModalConfig?.title || ''}
        fields={currentModalConfig?.fields || []}
        values={form}
        setValues={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </div>
  );
}