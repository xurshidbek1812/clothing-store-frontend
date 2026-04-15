import { motion, AnimatePresence } from 'framer-motion';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

export default function SupplierInDetailsModal({
  open,
  onClose,
  item,
  onApprove,
  onReject,
  approving,
  rejecting,
  canApprove,
}) {
  const totalAmount = (item?.items || []).reduce(
    (sum, row) => sum + Number(row.quantity || 0) * Number(row.costPrice || 0),
    0
  );

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  Kirim hujjati tafsiloti
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {item.supplier?.name || '-'} • {item.warehouse?.name || '-'}
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[calc(90vh-73px)] overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{item.status}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Jo‘natgan</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {item.submittedBy?.fullName || '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Sana</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {new Date(item.createdAt).toLocaleString('uz-UZ')}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Jami summa</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {money(totalAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-lg font-black text-slate-900">Qatorlar</h4>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-500">
                        <th className="pb-3 font-semibold">Tovar</th>
                        <th className="pb-3 font-semibold">Razmer</th>
                        <th className="pb-3 font-semibold">Barcode</th>
                        <th className="pb-3 font-semibold">Miqdor</th>
                        <th className="pb-3 font-semibold">Kirim narxi</th>
                        <th className="pb-3 font-semibold">Sotuv narxi</th>
                        <th className="pb-3 font-semibold">Jami</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(item.items || []).map((row) => (
                        <tr key={row.id} className="border-b border-slate-50">
                          <td className="py-3 font-semibold text-slate-900">
                            {row.productVariant?.product?.name || '-'}
                          </td>
                          <td className="py-3 text-slate-700">
                            {row.productVariant?.size?.name || '-'}
                          </td>
                          <td className="py-3 text-slate-700">
                            {row.productVariant?.barcode || '-'}
                          </td>
                          <td className="py-3 text-slate-700">{row.quantity}</td>
                          <td className="py-3 text-slate-700">{money(row.costPrice)}</td>
                          <td className="py-3 text-slate-700">{money(row.sellPrice)}</td>
                          <td className="py-3 font-semibold text-slate-900">
                            {money(Number(row.quantity || 0) * Number(row.costPrice || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {item.note ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Izoh:</span> {item.note}
                  </div>
                ) : null}
              </div>

              {canApprove && item.status === 'PENDING' ? (
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={onReject}
                    disabled={approving || rejecting}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-70"
                  >
                    {rejecting ? 'Rad etilmoqda...' : 'Rad etish'}
                  </button>

                  <button
                    onClick={onApprove}
                    disabled={approving || rejecting}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                  >
                    {approving ? 'Tasdiqlanmoqda...' : 'Tasdiqlash'}
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}