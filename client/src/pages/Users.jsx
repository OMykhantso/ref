import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { Button, Card, Input, Select, Modal, Badge, Spinner } from '../components/ui/index.jsx';
import { ROLE_LABELS } from '../utils/constants.js';
import { formatDate } from '../utils/format.js';

const empty = { email: '', name: '', password: '', role: 'MANAGER' };

export default function Users() {
  const [users, setUsers] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = () => api.get('/users').then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setError(''); setModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ email: u.email, name: u.name, password: '', role: u.role });
    setError('');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        const patch = { name: form.name, role: form.role };
        if (form.password) patch.password = form.password;
        await api.patch(`/users/${editing.id}`, patch);
      } else {
        await api.post('/users', form);
      }
      setModal(false); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка збереження');
    }
  };

  const deactivate = async (u) => {
    if (!confirm(`Деактивувати «${u.name}»?`)) return;
    await api.delete(`/users/${u.id}`); load();
  };

  if (!users) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Користувачі</h1>
        <Button onClick={openCreate}>+ Додати користувача</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-2">Ім'я</th><th>Email</th><th>Роль</th><th>Статус</th><th>Створено</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="py-2 font-medium">{u.name}</td>
                  <td className="text-slate-500">{u.email}</td>
                  <td><Badge color="blue">{ROLE_LABELS[u.role]}</Badge></td>
                  <td>{u.isActive ? <Badge color="green">Активний</Badge> : <Badge color="red">Вимкнено</Badge>}</td>
                  <td className="text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="text-right whitespace-nowrap">
                    <button onClick={() => openEdit(u)} className="px-1.5 hover:opacity-70">✏️</button>
                    {u.isActive && <button onClick={() => deactivate(u)} className="px-1.5 hover:opacity-70">🚫</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Редагувати користувача' : 'Новий користувач'}
        footer={<>
          <Button variant="secondary" onClick={() => setModal(false)}>Скасувати</Button>
          <Button onClick={save}>Зберегти</Button>
        </>}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Ім'я" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Email" type="email" value={form.email} disabled={!!editing}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <Input label={editing ? 'Новий пароль (опц.)' : 'Пароль'} type="password" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required={!editing} />
          <Select label="Роль" value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="OWNER">Власник</option>
            <option value="ACCOUNTANT">Бухгалтер</option>
            <option value="MANAGER">Менеджер</option>
          </Select>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
