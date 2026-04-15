import { Trash2 } from 'lucide-react';

export default function SupplierInItemRow({
  index,
  item,
  products,
  onChange,
  onRemove,
}) {
  const selectedVariant = products
    .flatMap((product) =>
      (product.variants || []).map((variant) => ({
        ...variant,
        productId: product.id,
        productName: product.name,
        brand: product.brand,
      }))
    )
    .find((variant) => variant.id === item.productVariantId);

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[2.2fr_1fr_1fr_1fr_auto]">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Tovar / Razmer
        </label>

        <select
          value={item.productVariantId}
          onChange={(e) => onChange(index, 'productVariantId', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Variant tanlang</option>

          {products.map((product) => (
            <optgroup
              key={product.id}
              label={`${product.name}${product.brand ? ` • ${product.brand}` : ''}`}
            >
              {(product.variants || []).map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.size?.name || '-'} {variant.barcode ? `• ${variant.barcode}` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {selectedVariant ? (
          <p className="mt-2 text-xs text-slate-500">
            {selectedVariant.productName}
            {selectedVariant.brand ? ` • ${selectedVariant.brand}` : ''}
            {selectedVariant.barcode ? ` • Barcode: ${selectedVariant.barcode}` : ''}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Miqdor
        </label>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onChange(index, 'quantity', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          placeholder="0"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Kirim narxi
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.costPrice}
          onChange={(e) => onChange(index, 'costPrice', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          placeholder="0"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Sotuv narxi
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.sellPrice}
          onChange={(e) => onChange(index, 'sellPrice', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          placeholder="0"
        />
      </div>

      <div className="flex items-end">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
          title="Qatorni o‘chirish"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}