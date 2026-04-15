import { useAuth } from '../context/AuthContext';

export default function StoreSwitcher() {
  const { user, activeStoreId, setActiveStoreId } = useAuth();

  if (!user?.stores?.length) return null;

  return (
    <select
      value={activeStoreId || ''}
      onChange={(e) => setActiveStoreId(e.target.value)}
    >
      {user.stores.map((store) => (
        <option key={store.id} value={store.id}>
          {store.name}
        </option>
      ))}
    </select>
  );
}