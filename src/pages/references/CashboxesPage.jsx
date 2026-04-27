import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Wallet, Search } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import CashboxModal from './components/CashboxModal';

const initialForm = {
  name: '',
  currencyId: '',
  balance: '',
  isActive: true,
};

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

export default function CashboxesPage() {
  const [items, setItems] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadData = async (customSearch = '') => {
    setLoading(true);
    try {
      const query = customSearch.trim()
        ? `?search=${encodeURIComponent(customSearch.trim())}`
        : '';

      const [cashboxesRes, currenciesRes] = await Promise.all([
        apiFetch(`/cashboxes${query}`),
        apiFetch('/cashboxes/currencies'),
      ]);

      setItems(cashboxesRes || []);
      setCurrencies(currenciesRes || []);
    } catch (error) {
      toast.error(error.message || 'Kassalar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData('');
  }, []);

  const rows = useMemo(() => items, [items]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      ...initialForm,
      currencyId: currencies.find((c) => c.isDefault)?.id || currencies[0]?.id || '',
    });
    setOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      currencyId: item.currencyId || '',
      balance: String(item.balance ?? ''),
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

    if (!form.name.trim()) {
      toast.error('Kassa nomi majburiy');
      return;
    }

    if (!form.currencyId) {
      toast.error('Valuta tanlang');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const res = await apiFetch(`/cashboxes/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name.trim(),
            currencyId: form.currencyId,
            isActive: Boolean(form.isActive),
          }),
        });

        toast.success(res.message || 'Kassa yangilandi');
      } else {
        const res = await apiFetch('/cashboxes', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            currencyId: form.currencyId,
            balance: Number(form.balance || 0),
          }),
        });

        toast.success(res.message || 'Kassa yaratildi');
      }

      closeModal();
      loadData(search);
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchValue);
    loadData(searchValue);
  };

  const handleReset = () => {
    setSearch('');
    setSearchValue('');
    loadData('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Kassalar
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Kassalar ro‘yxati va ularni boshqarish
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="min-w-[280px] rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                  placeholder="Kassa nomi bo‘yicha qidirish"
                />
              </div>

              <button
                type="submit"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Qidirish
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Tozalash
              </button>
            </form>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Yangi kassa
            </button>
          </div>
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
                  <th className="pb-3 font-semibold">Nomi</th>
                  <th className="pb-3 font-semibold">Valuta</th>
                  <th className="pb-3 font-semibold">Balans</th>
                  <th className="pb-3 font-semibold">Tranzaksiyalar</th>
                  <th className="pb-3 font-semibold">Holati</th>
                  <th className="pb-3 font-semibold">Yaratilgan sana</th>
                  <th className="pb-3 text-right font-semibold">Amal</th>
                </tr>
              </thead>

              <tbody>
                {rows.length > 0 ? (
                  rows.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-3 font-semibold text-slate-900">
                        {item.name}
                      </td>

                      <td className="py-3 text-slate-700">
                        {item.currency?.code || '-'}
                      </td>

                      <td className="py-3 font-semibold text-slate-900">
                        {money(item.balance)} {item.currency?.symbol || ''}
                      </td>

                      <td className="py-3 text-slate-700">
                        {item._count?.cashTransactions || 0}
                      </td>

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

                      <td className="py-3 text-slate-700">
                        {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
                      </td>

                      <td className="py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            title="Tahrirlash"
                          >
                            <Pencil size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-sm text-slate-500">
                      {search ? 'Mos kassa topilmadi' : 'Hozircha kassalar yo‘q'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CashboxModal
        open={open}
        onClose={closeModal}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        saving={saving}
        editingItem={editingItem}
        currencies={currencies}
      />
    </div>
  );
}