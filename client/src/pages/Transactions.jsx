import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Card, Input, Select, Modal, Badge, Spinner } from '../components/ui/index.jsx';
import { formatMoney, formatDate, todayISO } from '../utils/format.js';
import {
  CURRENCIES, PAYMENT_LABELS, TX_TYPE_LABELS, can,
} from '../utils/constants.js';

const emptyForm = {
  type: 'EXPENSE', amount: '', currency: 'UAH', date: todayISO(),
  description: '', paymentMethod: 'CASH', accountId: '', categoryId: '', rateToBase: '',
};

export default function Transactions() {
  const { user } = useAuth();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 25 });
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', type: '', categoryId: '' });
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const [history, setHistory] = useState(null);

  const canEdit = can(user?.role, 'tx:update');
  const canDelete = can(user?.role, 'tx:delete');

  const load = useCallback(async () => {
    setLoading(true);
    const params = { page, pageSize: 25 };
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
    const { data } = await api.get('/transactions', { params });
    setData(data);
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/accounts').then((r) => setAccounts(r.data));
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, accountId: accounts[0]?.id ?? '', categoryId: '' });
    setError('');
    setModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      type: t.type, amount: t.amount, currency: t.currency,
      date: t.date.slice(0, 10), description: t.description ?? '',
      paymentMethod: t.paymentMethod, accountId: t.account.id,
      categoryId: t.category.id, rateToBase: '',
    });
    setError('');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form };
    if (!payload.rateToBase) delete payload.rateToBase;
    try {
      if (editing) await api.patch(`/transactions/${editing.id}`, payload);
      else await api.post('/transactions', payload);
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка збереження');
    }
  };

  const remove = async (t) => {
    if (!confirm('Видалити транзакцію?')) return;
    await api.delete(`/transactions/${t.id}`);
    load();
  };

  const showHistory = async (t) => {
    const { data } = await api.get(`/transactions/${t.id}/history`);
    setHistory({ tx: t, logs: data });
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);
  const totalPages = Math.ceil(data.total / data.pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Транзакції</h1>
        <Button onClick={openCreate}>+ Додати</Button>
      </div>

      {/* Фільтри */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input label="Від" type="date" value={filters.from}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, from: e.target.value })); }} />
          <Input label="До" type="date" value={filters.to}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, to: e.target.value })); }} />
          <Select label="Тип" value={filters.type}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, type: e.target.value })); }}>
            <option value="">Усі</option>
            <option value="INCOME">Доходи</option>
            <option value="EXPENSE">Витрати</option>
          </Select>
          <Select label="Категорія" value={filters.categoryId}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, categoryId: e.target.value })); }}>
            <option value="">Усі</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="flex items-end">
            <Button variant="secondary" className="w-full"
              onClick={() => { setPage(1); setFilters({ from: '', to: '', type: '', categoryId: '' }); }}>
              Скинути
            </Button>
          </div>
        </div>
      </Card>

      {/* Таблиця */}
      <Card>
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2">Дата</th>
                  <th>Тип</th>
                  <th>Категорія</th>
                  <th>Рахунок</th>
                  <th>Оплата</th>
                  <th>Хто вніс</th>
                  <th className="text-right">Сума</th>
                  <th className="text-right">UAH</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="py-2 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td><Badge color={t.type === 'INCOME' ? 'green' : 'red'}>{TX_TYPE_LABELS[t.type]}</Badge></td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: t.category?.color }} />
                        {t.category?.name}
                      </span>
                    </td>
                    <td>{t.account?.name}</td>
                    <td className="text-slate-500">{PAYMENT_LABELS[t.paymentMethod]}</td>
                    <td className="text-slate-500">{t.createdBy?.name}</td>
                    <td className={`text-right font-medium ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMoney(t.amount, t.currency)}
                    </td>
                    <td className="text-right text-slate-500">{formatMoney(t.amountBase)}</td>
                    <td className="whitespace-nowrap text-right">
                      <button onClick={() => showHistory(t)} title="Історія" className="px-1.5 hover:opacity-70">🕘</button>
                      {canEdit && <button onClick={() => openEdit(t)} title="Редагувати" className="px-1.5 hover:opacity-70">✏️</button>}
                      {canDelete && <button onClick={() => remove(t)} title="Видалити" className="px-1.5 hover:opacity-70">🗑️</button>}
                    </td>
                  </tr>
                ))}
                {!data.items.length && (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-500">Транзакцій не знайдено</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Пагінація */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Усього: {data.total}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</Button>
            <span>{page} / {totalPages}</span>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</Button>
          </div>
        </div>
      </Card>

      {/* Модалка створення/редагування */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Редагувати транзакцію' : 'Нова транзакція'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Скасувати</Button>
            <Button onClick={save}>Зберегти</Button>
          </>
        }
      >
        <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Тип" value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, categoryId: '' }))}>
            <option value="EXPENSE">Витрата</option>
            <option value="INCOME">Дохід</option>
          </Select>
          <Input label="Дата" type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          <Input label="Сума" type="number" step="0.01" min="0" value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
          <Select label="Валюта" value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Рахунок" value={form.accountId}
            onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))} required>
            <option value="">— оберіть —</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
          </Select>
          <Select label="Категорія" value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} required>
            <option value="">— оберіть —</option>
            {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Спосіб оплати" value={form.paymentMethod}
            onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
            <option value="CASH">Готівка</option>
            <option value="CARD">Картка</option>
            <option value="ACCOUNT">Рахунок</option>
          </Select>
          {form.currency !== 'UAH' && (
            <Input label="Курс до UAH (опц., інакше авто)" type="number" step="0.0001" value={form.rateToBase}
              onChange={(e) => setForm((f) => ({ ...f, rateToBase: e.target.value }))}
              placeholder="напр. 41.5" />
          )}
          <div className="sm:col-span-2">
            <Input label="Опис" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
        </form>
      </Modal>

      {/* Історія змін */}
      <Modal open={!!history} onClose={() => setHistory(null)} title="Історія змін">
        {history && (
          <div className="space-y-3 text-sm">
            {history.logs.length === 0 && <p className="text-slate-500">Записів немає</p>}
            {history.logs.map((l) => (
              <div key={l.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <Badge color={l.action === 'CREATE' ? 'green' : l.action === 'DELETE' ? 'red' : 'blue'}>
                    {l.action}
                  </Badge>
                  <span className="text-xs text-slate-500">{formatDate(l.createdAt)}</span>
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Користувач: {l.user?.name}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
