import { useState, useEffect } from 'react';
import { Eye, Calendar, Printer, FileText } from 'lucide-react';
import Loader from '../components/Loader';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null); // Modal uchun
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchSales = async (p = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/sales?page=${p}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSales(data.sales);
        setTotalPages(data.totalPages);
        setPage(data.currentPage);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSales(page); }, [page]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Sotuvlar tarixi</h1>
        <p className="text-gray-500 mt-1">Barcha amalga oshirilgan savdo amaliyotlari</p>
      </div>

      {isLoading ? <Loader /> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Sana / Vaqt</th>
                <th className="p-4 font-bold">Kassa</th>
                <th className="p-4 font-bold">To'lov</th>
                <th className="p-4 font-bold">Tovarlar</th>
                <th className="p-4 font-bold text-right">Jami summa</th>
                <th className="p-4 text-center">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(sale.date).toLocaleString('uz-UZ')}
                  </td>
                  <td className="p-4 font-medium text-gray-700">{sale.cashbox?.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${sale.paymentType === 'NAQD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {sale.paymentType}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {sale.items.length} xil mahsulot
                  </td>
                  <td className="p-4 text-right font-black text-gray-900">
                    {Number(sale.totalAmount).toLocaleString()} so'm
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setSelectedSale(sale)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAL MODAL (Chek ko'rinishida) */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-black text-gray-800">Savdo tafsiloti</h3>
              <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {selectedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product.name} ({item.quantity} x {Number(item.price).toLocaleString()})</span>
                    <span className="font-bold">{(item.quantity * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed pt-4 flex justify-between items-center">
                <span className="text-lg font-bold">Jami:</span>
                <span className="text-2xl font-black text-blue-600">{Number(selectedSale.totalAmount).toLocaleString()} so'm</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex gap-2">
              <button className="flex-1 bg-white border py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100">
                <Printer size={16} /> Chek chiqarish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;