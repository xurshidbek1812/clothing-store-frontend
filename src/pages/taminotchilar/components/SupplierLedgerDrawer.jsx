import { useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import SupplierPaymentModal from './SupplierPaymentModal';

function money(value) {
  return Number(value || 0).toLocaleString('uz-UZ');
}

function formatMoneyWithCurrency(value, currency) {
  if (!currency) return money(value);
  return `${money(value)} ${currency.code}`;
}

export default function SupplierLedgerDrawer({
  open,
  onClose,
  data,
  onRefresh,
}) {
  const [paymentOpen, setPaymentOpen] = useState(false);

  const summaryRows = useMemo(() => data?.summary || [], [data]);

  if (!open || !data) return null;

  const { supplier, ledgerEntries, payments } = data;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-4xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              {supplier.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {supplier.phone || '-'} • {supplier.address || 'Manzil ko‘rsatilmagan'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-3 border-b border-slate-100 px-6 py-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Umumiy qarz</p>
            <div className="mt-1 space-y-1">
              {summaryRows.length > 0 ? (
                summaryRows.map((row, index) => (
                  <p key={index} className="text-lg font-black text-slate-900">
                    {formatMoneyWithCurrency(row.totalAmount, row.currency)}
                  </p>
                ))
              ) : (
                <p className="text-lg font-black text-slate-900">0</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">To‘langan</p>
            <div className="mt-1 space-y-1">
              {summaryRows.length > 0 ? (
                summaryRows.map((row, index) => (
                  <p key={index} className="text-lg font-black text-emerald-600">
                    {formatMoneyWithCurrency(row.paidAmount, row.currency)}
                  </p>
                ))
              ) : (
                <p className="text-lg font-black text-slate-900">0</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Qolgan qarz</p>
            <div className="mt-1 space-y-1">
              {summaryRows.length > 0 ? (
                summaryRows.map((row, index) => (
                  <p key={index} className="text-lg font-black text-rose-600">
                    {formatMoneyWithCurrency(row.dueAmount, row.currency)}
                  </p>
                ))
              ) : (
                <p className="text-lg font-black text-rose-600">0</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <h4 className="text-lg font-black text-slate-900">Hisob-kitob tafsiloti</h4>

          <button
            onClick={() => setPaymentOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Wallet size={16} />
            To‘lov qilish
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h5 className="mb-3 text-base font-black text-slate-900">Qarz yozuvlari</h5>

              <div className="space-y-3">
                {ledgerEntries.length > 0 ? (
                  ledgerEntries.map((entry) => {
                    const remaining = Number(entry.dueAmount ?? ((entry.totalAmount || 0) - (entry.paidAmount || 0)));

                    return (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {new Date(entry.createdAt).toLocaleString('uz-UZ')}
                            </p>
                            <p className="mt-1 text-xs font-medium text-blue-600">
                              {entry.currency?.code || '-'}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                            {entry.currency?.symbol || ''} {entry.currency?.code || ''}
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">{entry.note || '-'}</p>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-slate-400">Jami</p>
                            <p className="font-bold text-slate-900">
                              {formatMoneyWithCurrency(entry.totalAmount, entry.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">To‘langan</p>
                            <p className="font-bold text-emerald-600">
                              {formatMoneyWithCurrency(entry.paidAmount, entry.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Qolgan</p>
                            <p className="font-bold text-rose-600">
                              {formatMoneyWithCurrency(remaining, entry.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    Qarz yozuvlari yo‘q
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h5 className="mb-3 text-base font-black text-slate-900">To‘lovlar tarixi</h5>

              <div className="space-y-3">
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {new Date(payment.createdAt).toLocaleString('uz-UZ')}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {payment.source === 'CASHBOX'
                              ? `Kassadan: ${payment.cashbox?.name || '-'}`
                              : 'Boshqa manbadan'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {payment.createdBy?.fullName || '-'}
                          </p>
                          <p className="mt-1 text-xs font-medium text-blue-600">
                            {payment.currency?.code || payment.cashbox?.currency?.code || '-'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">
                            {formatMoneyWithCurrency(
                              payment.amount,
                              payment.currency || payment.cashbox?.currency
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {payment.ledgerEntryId ? 'Aniq qarz yozuvi' : 'Umumiy qarz'}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">{payment.note || '-'}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    To‘lovlar hali yo‘q
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SupplierPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => {
          setPaymentOpen(false);
          onRefresh?.();
        }}
        supplier={supplier}
        ledgerEntries={ledgerEntries.filter(
          (entry) => Number(entry.dueAmount ?? ((entry.totalAmount || 0) - (entry.paidAmount || 0))) > 0
        )}
      />
    </>
  );
}