import { ImagePlus, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../../lib/api';

export default function ProductModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  saving,
  editingItem,
  categories = [],
  onUploadImage,
  onDeleteImage,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">
              {editingItem ? 'Tovarni tahrirlash' : 'Yangi tovar'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Tovarning asosiy ma’lumotlarini kiriting
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Tovar rasmi</p>

            <div className="flex items-start gap-4">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {editingItem?.imageUrl ? (
                  <img
                    src={`${API_BASE_URL}${editingItem.imageUrl}`}
                    alt={editingItem.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    Rasm yo‘q
                  </div>
                )}
              </div>

              {editingItem ? (
                <div className="flex flex-col gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <ImagePlus size={16} />
                    Rasm yuklash
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && onUploadImage) {
                          onUploadImage(editingItem.id, file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {editingItem.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onDeleteImage?.(editingItem.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 size={16} />
                      Rasmni o‘chirish
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Avval tovarni yarating, keyin rasm yuklaysiz
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nomi
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Masalan: Erkaklar kurtkasi"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Brend
              </label>
              <input
                value={form.brand}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, brand: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Masalan: Zara"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Kategoriya
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, categoryId: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Tanlanmagan</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Jinsi
              </label>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gender: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Tanlanmagan</option>
                <option value="ERKAK">Erkak</option>
                <option value="AYOL">Ayol</option>
                <option value="UNIVERSAL">Universal</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mavsumi
              </label>
              <select
                value={form.season}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, season: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Tanlanmagan</option>
                <option value="QISH">Qish</option>
                <option value="YOZ">Yoz</option>
                <option value="BAHOR">Bahor</option>
                <option value="KUZ">Kuz</option>
                <option value="UNIVERSAL">Universal</option>
              </select>
            </div>
          </div>

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