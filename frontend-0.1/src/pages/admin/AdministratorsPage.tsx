import React, { useEffect, useState, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ConfirmationModal } from '../../components/admin/modals/ConfirmationModal';
import { CreateAdminModal } from '../../components/admin/modals/CreateAdminModal';
import { EditAdminModal } from '../../components/admin/modals/EditAdminModal';

interface Administrator {
  ID: number;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: string;
  Status: string;
  CreatedAt?: string;
}

export const AdministratorsPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Administrator | null>(null);

  const [search, setSearch] = useState('');

  const fetchAdmins = async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/admin/administrators', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Не вдалося завантажити адміністраторів');
      const data = await r.json();
      setItems(data || []);
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (d:{
    Email:string; FirstName:string; LastName:string; Password:string; Role:string; Status:string;
  }) => {
    if (!token) return;
    setErr(null);
    const body = {
      Email: d.Email,
      FirstName: d.FirstName,
      LastName: d.LastName,
      Password: d.Password,
      Role: d.Role,
      Status: d.Status
    };
    const r = await fetch('/api/admin/administrators', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      let m = 'Не вдалося створити адміністратора';
      try { const j = await r.json(); m = j.message || m; } catch {}
      throw new Error(m);
    }
    await fetchAdmins();
    setCreateOpen(false);
  };

  const requestDelete = (id:number, role:string) => {
    if (role === 'master') {
      setErr('Неможливо видалити master адміністратора');
      return;
    }
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !deleteId) return;
    try {
      const r = await fetch(`/api/admin/administrators/${deleteId}`, {
        method:'DELETE',
        headers:{ Authorization:`Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Не вдалося видалити адміністратора');
      setItems(x => x.filter(a => a.ID !== deleteId));
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (e:any) {
      setErr(e.message);
    }
  };

  useEffect(() => { fetchAdmins(); }, [token]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter(a =>
      a.Email.toLowerCase().includes(q) ||
      a.FirstName.toLowerCase().includes(q) ||
      a.LastName.toLowerCase().includes(q) ||
      a.Role.toLowerCase().includes(q)
    );
  }, [items, search]);

  const roleBadge = (r:string) => {
    const map: Record<string,string> = {
      master: 'bg-purple-100 text-purple-800',
      admin: 'bg-green-100 text-green-800',
      moderator: 'bg-blue-100 text-blue-800'
    };
    return map[r] || 'bg-gray-100 text-gray-800';
  };

  const statusBadge = (s:string) => {
    const map: Record<string,string> = {
      Active:'bg-green-100 text-green-800',
      Disabled:'bg-yellow-100 text-yellow-800',
      Blocked:'bg-red-100 text-red-800'
    };
    return map[s] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (d?:string) =>
    d ? new Date(d).toLocaleDateString('uk-UA',{year:'numeric',month:'short',day:'numeric'}) : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Адміністратори</h1>
          <p className="mt-2 text-sm text-gray-600">Керування адміністративними користувачами</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Пошук..."
            className="border rounded px-3 py-2 text-sm"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <button
            onClick={()=>setCreateOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
          >+ Створити</button>
        </div>
      </div>

      {err && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded text-sm">
          {err}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"/>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">ID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Адміністратор</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Email</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Роль</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Статус</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Створено</th>
                  <th className="px-6 py-3"/>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.map(a=>(
                  <tr key={a.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap text-gray-500">{a.ID}</td>
                    <td className="px-6 py-3 whitespace-nowrap font-medium">{a.FirstName} {a.LastName}</td>
                    <td className="px-6 py-3 whitespace-nowrap">{a.Email}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge(a.Role)}`}>
                        {a.Role}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(a.Status)}`}>
                        {a.Status}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-500">{formatDate(a.CreatedAt)}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={()=>setEditing(a)}
                          className="text-indigo-600 hover:text-indigo-900 px-2 py-1 text-xs rounded hover:bg-indigo-50"
                          disabled={a.Role==='master'}
                        >Редагувати</button>
                        <button
                          onClick={()=>requestDelete(a.ID, a.Role)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 text-xs rounded hover:bg-red-50 disabled:opacity-40"
                          disabled={a.Role==='master'}
                        >Видалити</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length===0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                      Нічого не знайдено
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && items.length===0 && !err && (
          <div className="py-16 text-center text-gray-500 text-sm">
            Адміністраторів немає
          </div>
        )}
      </div>

      <CreateAdminModal
        isOpen={createOpen}
        onClose={()=>setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ConfirmationModal
        isOpen={deleteOpen}
        onClose={()=>{ setDeleteOpen(false); setDeleteId(null); }}
        onConfirm={confirmDelete}
        title="Підтвердження видалення"
        message="Видалити адміністратора? Цю дію неможливо скасувати."
      />

      <EditAdminModal
        isOpen={!!editing}
        onClose={()=>setEditing(null)}
        admin={editing}
        onSubmit={async (d)=>{
          if(!token) return;
          const res = await fetch(`/api/admin/administrators/${d.id}`,{
            method:'PUT',
            headers:{
              'Content-Type':'application/json',
              Authorization:`Bearer ${token}`
            },
            body: JSON.stringify({
              firstName: d.firstName,
              lastName: d.lastName,
              email: d.email,
              phone: d.phone,
              status: d.status,
              role: d.role
            })
          });
          if(!res.ok){
            let msg='Не вдалося оновити адміністратора';
            try { const j=await res.json(); msg=j.message||msg; } catch {}
            throw new Error(msg);
          }
          setEditing(null);
          await fetchAdmins();
        }}
      />
    </div>
  );
};