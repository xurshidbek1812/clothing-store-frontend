import { API_BASE_URL } from '../../../lib/api';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

export default function ProductDetailsModal({
  open,
  onClose,
  product,
  warehouseName,
  onPreviewImage,
}) {
  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              {product.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {warehouseName || 'Ombor tanlanmagan'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 text-lg font-black text-slate-900">Rasmlar</h4>

                {(product.images || []).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {product.images.map((image) => (
                      <div
                        key={image.id}
                        className={`overflow-hidden rounded-2xl border bg-white p-2 ${
                          image.isPrimary ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={`${API_BASE_URL}${image.imageUrl}`}
                          alt={product.name}
                          className="h-48 w-full cursor-zoom-in rounded-xl object-cover transition hover:scale-[1.02]"
                          onClick={() =>
                            onPreviewImage?.(`${API_BASE_URL}${image.imageUrl}`, product.name)
                          }
                        />
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            {image.isPrimary ? 'Asosiy rasm' : 'Qo‘shimcha rasm'}
                          </span>
                          <span className="text-slate-400">
                            #{image.sortOrder || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                    Rasm yo‘q
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-lg font-black text-slate-900">Razmerlar va qoldiq</h4>

                {(product.variants || []).length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {product.variants.map((variant) => {
                      const totalVariantStock = (variant.stockBatches || []).reduce(
                        (sum, batch) => sum + Number(batch.remainingQuantity || 0),
                        0
                      );

                      return (
                        <div
                          key={variant.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                        >
                          <p className="text-base font-black text-slate-900">
                            {variant.size?.name || '-'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">Qoldiq</p>
                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {totalVariantStock.toLocaleString('uz-UZ')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                    Razmerlar yo‘q
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-lg font-black text-slate-900">Asosiy ma’lumotlar</h4>

                <div className="space-y-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Nomi</p>
                    <p className="mt-1 font-semibold text-slate-900">{product.name || '-'}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Kategoriya</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {product.category?.name || '-'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Brend</p>
                    <p className="mt-1 font-semibold text-slate-900">{product.brand || '-'}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Jinsi</p>
                    <p className="mt-1 font-semibold text-slate-900">{product.gender || '-'}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Mavsumi</p>
                    <p className="mt-1 font-semibold text-slate-900">{product.season || '-'}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Holati</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {product.isActive ? 'Faol' : 'Nofaol'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">Yaratilgan sana</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {new Date(product.createdAt).toLocaleString('uz-UZ')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-lg font-black text-slate-900">Qisqa statistika</h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-blue-50 px-4 py-4">
                    <p className="text-xs text-blue-600">Rasmlar soni</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {(product.images || []).length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                    <p className="text-xs text-emerald-600">Razmerlar soni</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {(product.variants || []).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}