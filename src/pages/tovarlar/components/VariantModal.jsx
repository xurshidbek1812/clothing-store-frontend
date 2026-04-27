export default function VariantModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  saving,
  sizes = [],
  product,
}) {
  if (!open) return null;

  const selectedSizeIds = form.sizeIds || [];
  const existingVariantSizeIds = (product?.variants || []).map((variant) => variant.sizeId);

  const toggleSize = (sizeId) => {
    setForm((prev) => {
      const current = prev.sizeIds || [];
      const exists = current.includes(sizeId);

      return {
        ...prev,
        sizeIds: exists
          ? current.filter((id) => id !== sizeId)
          : [...current, sizeId],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              Razmerlarni tanlash
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {product?.name || 'Tovar'} uchun kerakli razmerlarni belgilang
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              Razmerlar
            </label>

            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const selected = selectedSizeIds.includes(size.id);
                const alreadyExists = existingVariantSizeIds.includes(size.id);

                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => toggleSize(size.id)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      selected
                        ? alreadyExists
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {size.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p>Ko‘k — allaqachon mavjud razmer</p>
              <p>Qora — tanlangan razmer</p>
            </div>
          </div>

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