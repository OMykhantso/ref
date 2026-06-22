import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Card, Input, Select, Modal, Badge, Spinner } from '../components/ui/index.jsx';
import { formatMoney } from '../utils/format.js';
import { CURRENCIES, ACCOUNT_TYPE_LABELS, can } from '../utils/constants.js';

const empty = { name: '', type: 'CASH', currency: 'UAH', opening: 0 };

export default function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const canWrite = can(user?.role, 'account:write');

  const load = () => api.get('/accounts').then((r) => setAccounts(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({ name: a.name, type: a.type, currency: a.currency, opening: a.opening });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (editing) await api.patch(`/accounts/${editing.id}`, form);
    else await api.post('/accounts', form);
    setModal(false); load();
  };

  const remove = async (a) => {
    if (!confirm(`Архівувати рахунок «${a.name}»?`)) return;
    await api.delete(`/accounts/${a.id}`); load();
  };

  if (!accounts) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Рахунки / гаманці</h1>
        {canWrite && <Button onClick={openCreate}>+ Додати рахунок</Button>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{a.name}</span>
              <Badge>{ACCOUNT_TYPE_LABELS[a.type]}</Badge>
            </div>
            <div className="mt-3 text-2xl font-bold">{formatMoney(a.balance, a.currency)}</div>
            {a.currency !== 'UAH' && <div className="text-sm text-slate-500">≈ {formatMoney(a.balanceBase)} UAH</div>}
            <div className="mt-1 text-xs text-slate-400">Початковий: {formatMoney(a.opening, a.currency)}</div>
            {canWrite && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(a)}>Редагувати</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a)}>Архівувати</Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Редагувати рахунок' : 'Новий рахунок'}
        footer={<>
          <Button variant="secondary" onClick={() => setModal(false)}>Скасувати</Button>
          <Button onClick={save}>Зберегти</Button>
        </>}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Назва" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Select label="Тип" value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="CASH">Каса</option>
            <option value="BANK">Банк</option>
            <option value="CARD">Картка</option>
          </Select>
          <Select label="Валюта" value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} disabled={!!editing}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Початковий залишок" type="number" step="0.01" value={form.opening}
            onChange={(e) => setForm((f) => ({ ...f, opening: e.target.value }))} />
        </form>
      </Modal>
    </div>
  );
}
