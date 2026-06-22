import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Card, Input, Select, Badge, Spinner } from '../components/ui/index.jsx';
import { formatDate, todayISO } from '../utils/format.js';
import { can } from '../utils/constants.js';

export default function Rates() {
  const { user } = useAuth();
  const [rates, setRates] = useState(null);
  const [nbuEnabled, setNbuEnabled] = useState(false);
  const [form, setForm] = useState({ currency: 'USD', date: todayISO(), rate: '' });
  const [nbuDate, setNbuDate] = useState(todayISO());
  const [msg, setMsg] = useState('');
  const canWrite = can(user?.role, 'rate:write');

  const load = () => api.get('/rates').then((r) => setRates(r.data));
  useEffect(() => {
    load();
    api.get('/rates/nbu/status').then((r) => setNbuEnabled(r.data.enabled));
  }, []);

  const saveManual = async (e) => {
    e.preventDefault();
    setMsg('');
    await api.post('/rates', form);
    setMsg('Курс збережено');
    load();
  };

  const importNbu = async () => {
    setMsg('Завантаження з НБУ…');
    try {
      const { data } = await api.post('/rates/nbu/import', { date: nbuDate });
      setMsg(`Імпортовано ${data.saved.length} курс(ів) з НБУ`);
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Помилка імпорту');
    }
  };

  if (!rates) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Курси валют (до UAH)</h1>

      {canWrite && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Ручне введення курсу">
            <form onSubmit={saveManual} className="grid grid-cols-2 gap-3">
              <Select label="Валюта" value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
              <Input label="Дата" type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              <Input label="Курс (UAH за 1)" type="number" step="0.0001" value={form.rate}
                onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} required />
              <div className="flex items-end">
                <Button type="submit" className="w-full">Зберегти</Button>
              </div>
            </form>
          </Card>

          <Card title="Імпорт з НБУ (опційний модуль)">
            {nbuEnabled ? (
              <div className="space-y-3">
                <Input label="Дата" type="date" value={nbuDate} onChange={(e) => setNbuDate(e.target.value)} />
                <Button variant="secondary" onClick={importNbu}>Підтягнути курс НБУ</Button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Модуль НБУ вимкнено. Увімкніть <code>NBU_ENABLED=true</code> у <code>.env</code> сервера.
              </p>
            )}
          </Card>
        </div>
      )}

      {msg && <p className="text-sm text-slate-500">{msg}</p>}

      <Card title="Історія курсів">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-2">Дата</th><th>Валюта</th><th className="text-right">Курс</th><th>Джерело</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="py-2">{formatDate(r.date)}</td>
                  <td>{r.currency}</td>
                  <td className="text-right font-medium">{Number(r.rate).toFixed(4)}</td>
                  <td><Badge color={r.source === 'NBU' ? 'blue' : 'slate'}>{r.source}</Badge></td>
                </tr>
              ))}
              {!rates.length && <tr><td colSpan={4} className="py-8 text-center text-slate-500">Курсів ще немає</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
