import { Pencil, Plus } from 'lucide-react';

export default function SimpleReferenceTable({
  title,
  subtitle,
  buttonText,
  onAdd,
  columns,
  rows,
  onEdit,
  loading,
}) {
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

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500">Yuklanmoqda...</div>
      ) : (
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
      )}
    </div>
  );
}