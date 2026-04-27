export default function CashboxModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  saving,
  editingItem,
  currencies = [],
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {editingItem ? 'Kassani tahrirlash' : 'Yangi kassa'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Kassa ma’lumotlarini kiriting
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Kassa nomi
            </label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Masalan: Asosiy kassa"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Valuta
            </label>
            <select
              value={form.currencyId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, currencyId: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Valuta tanlang</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.code} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>

          {!editingItem ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Boshlang‘ich balans
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.balance}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, balance: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="0"
              />
            </div>
          ) : null}

          {editingItem ? (
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                />
                Faol
              </label>
            </div>
          ) : null}

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
              {saving ? 'Saqlanmoqda...' : editingItem ? 'Yangilash' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}