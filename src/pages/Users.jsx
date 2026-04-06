import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

export default function Users() {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const data = await apiFetch('/users');
      setUsers(data);
    } catch (error) {
      toast.error(error.message || 'Xodimlar yuklanmadi');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold">Xodimlar</h3>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="pb-3">Ism</th>
              <th className="pb-3">Username</th>
              <th className="pb-3">Rol</th>
              <th className="pb-3">Storelar</th>
              <th className="pb-3">Holati</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="py-3">{user.fullName}</td>
                <td className="py-3">{user.username}</td>
                <td className="py-3">{user.role}</td>
                <td className="py-3">
                  {(user.userStores || []).map((x) => x.store?.name).filter(Boolean).join(', ')}
                </td>
                <td className="py-3">{user.isActive ? 'Faol' : 'Nofaol'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}