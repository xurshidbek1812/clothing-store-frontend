function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ');
}

export default function SaleReceiptModal({ open, sale, onClose, storeName = "Do'kon" }) {
  if (!open || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 print:bg-white">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl print:max-w-full print:rounded-none print:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 print:hidden">
          <div>
            <h3 className="text-base font-bold text-black">Mijoz cheki</h3>
            <p className="text-xs text-slate-500">Ko‘rish va chop etish</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="rounded-xl border border-black px-3 py-2 text-sm font-semibold text-black transition hover:bg-slate-100"
            >
              Chop etish
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Yopish
            </button>
          </div>
        </div>

        <div className="px-5 py-5 text-black print:px-0 print:py-0">
          <div className="mx-auto max-w-[320px] font-mono text-sm print:max-w-full">
            <div className="text-center">
              <h2 className="text-lg font-bold uppercase">{storeName}</h2>
              <p className="mt-1 text-xs">Savdo cheki</p>
              <p className="text-xs">{formatDateTime(sale.createdAt)}</p>
            </div>

            <div className="my-4 border-t border-dashed border-black" />

            <div className="space-y-3">
              {(sale.items || []).map((item) => (
                <div key={item.id}>
                  <p className="font-semibold">
                    {item.productVariant?.product?.name || '-'}
                  </p>
                  <p className="text-xs">
                    Razmer: {item.productVariant?.size?.name || '-'}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span>
                      {item.quantity} x {money(item.unitPrice)}
                    </span>
                    <span>{money(item.totalPrice)}</span>
                  </div>
                  {Number(item.discountAmount || 0) > 0 ? (
                    <div className="flex items-center justify-between text-xs">
                      <span>Chegirma</span>
                      <span>- {money(item.discountAmount)}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="my-4 border-t border-dashed border-black" />

            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>Jami</span>
                <span>{money(sale.subtotalAmount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Chegirma</span>
                <span>- {money(sale.discountAmount)}</span>
              </div>

              <div className="flex items-center justify-between font-bold">
                <span>To'lov</span>
                <span>{money(sale.totalAmount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>To'langan</span>
                <span>{money(sale.paidAmount)}</span>
              </div>
            </div>

            <div className="my-4 border-t border-dashed border-black" />

            <div className="text-center text-xs">
              Xaridingiz uchun rahmat
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}