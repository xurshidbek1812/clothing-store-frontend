import { Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StoreSwitcher() {
  const { user, activeStoreId, setActiveStoreId } = useAuth();

  if (!user?.stores?.length) return null;

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <Store size={16} className="text-slate-500" />
      <select
        value={activeStoreId || ''}
        onChange={(e) => setActiveStoreId(e.target.value)}
        className="min-w-[180px] bg-transparent text-sm font-medium text-slate-700 outline-none"
      >
        {user.stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}