import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Card, Input, Select, Modal, Badge, Spinner } from '../components/ui/index.jsx';
import { TX_TYPE_LABELS, can } from '../utils/constants.js';

const empty = { name: '', type: 'EXPENSE', color: '#64748b' };

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const canWrite = can(user?.role, 'category:write');

  const load = () => api.get('/categories').then((r) => setCategories(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, type: c.type, color: c.color ?? '#64748b' });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (editing) await api.patch(`/categories/${editing.id}`, form);
    else await api.post('/categories', form);
    setModal(false); load();
  };

  const remove = async (c) => {
    if (!confirm(`Архівувати категорію «${c.name}»?`)) return;
    await api.delete(`/categories/${c.id}`); load();
  };

  if (!categories) return <Spinner />;

  const income = categories.filter((c) => c.type === 'INCOME');
  const expense = categories.filter((c) => c.type === 'EXPENSE');

  const Group = ({ title, items }) => (
    <Card title={title}>
      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
              {c.name}
            </span>
            {canWrite && (
              <span className="flex gap-1">
                <button onClick={() => openEdit(c)} className="px-1.5 hover:opacity-70">✏️</button>
                <button onClick={() => remove(c)} className="px-1.5 hover:opacity-70">🗑️</button>
              </span>
            )}
          </div>
        ))}
        {!items.length && <p className="text-sm text-slate-500">Порожньо</p>}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Категорії</h1>
        {canWrite && <Button onClick={openCreate}>+ Додати категорію</Button>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Group title="Доходи" items={income} />
        <Group title="Витрати" items={expense} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Редагувати категорію' : 'Нова категорія'}
        footer={<>
          <Button variant="secondary" onClick={() => setModal(false)}>Скасувати</Button>
          <Button onClick={save}>Зберегти</Button>
        </>}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Назва" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Select label="Тип" value={form.type} disabled={!!editing}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="EXPENSE">{TX_TYPE_LABELS.EXPENSE}</option>
            <option value="INCOME">{TX_TYPE_LABELS.INCOME}</option>
          </Select>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Колір</span>
            <input type="color" value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="h-10 w-20 rounded border border-slate-300 dark:border-slate-700" />
          </label>
        </form>
      </Modal>
    </div>
  );
}
