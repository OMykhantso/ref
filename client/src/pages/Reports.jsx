import { useState } from 'react';
import api, { tokenStore } from '../lib/api.js';
import { Button, Card, Input, Select, Spinner } from '../components/ui/index.jsx';
import { formatMoney, todayISO } from '../utils/format.js';

const GROUP_OPTIONS = [
  { value: 'category', label: 'По категоріях' },
  { value: 'user', label: 'По користувачах' },
  { value: 'currency', label: 'По валютах' },
  { value: 'day', label: 'По днях' },
  { value: 'month', label: 'По місяцях' },
];

export default function Reports() {
  const firstDay = new Date();
  firstDay.setDate(1);
  const [params, setParams] = useState({
    from: firstDay.toISOString().slice(0, 10),
    to: todayISO(),
    groupBy: 'category',
    type: '',
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const build = async () => {
    setLoading(true);
    const q = { ...params };
    if (!q.type) delete q.type;
    const { data } = await api.get('/reports', { params: q });
    setReport(data);
    setLoading(false);
  };

  // Експорт: завантаження файлу з авторизацією
  const download = async (format) => {
    const q = { ...params };
    if (!q.type) delete q.type;
    const res = await api.get(`/reports/export/${format}`, { params: q, responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Звіти</h1>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input label="Від" type="date" value={params.from}
            onChange={(e) => setParams((p) => ({ ...p, from: e.target.value }))} />
          <Input label="До" type="date" value={params.to}
            onChange={(e) => setParams((p) => ({ ...p, to: e.target.value }))} />
          <Select label="Групування" value={params.groupBy}
            onChange={(e) => setParams((p) => ({ ...p, groupBy: e.target.value }))}>
            {GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select label="Тип" value={params.type}
            onChange={(e) => setParams((p) => ({ ...p, type: e.target.value }))}>
            <option value="">Усі</option>
            <option value="INCOME">Доходи</option>
            <option value="EXPENSE">Витрати</option>
          </Select>
          <div className="flex items-end">
            <Button className="w-full" onClick={build}>Сформувати</Button>
          </div>
        </div>
      </Card>

      {loading && <Spinner />}

      {report && !loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card><div className="text-sm text-slate-500">Доходи</div>
              <div className="mt-1 text-2xl font-bold text-green-600">{formatMoney(report.summary.income)}</div></Card>
            <Card><div className="text-sm text-slate-500">Витрати</div>
              <div className="mt-1 text-2xl font-bold text-red-600">{formatMoney(report.summary.expense)}</div></Card>
            <Card><div className="text-sm text-slate-500">Прибуток</div>
              <div className={`mt-1 text-2xl font-bold ${report.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(report.summary.profit)}</div></Card>
          </div>

          <Card
            title={`Деталізація (${report.summary.count} операцій)`}
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => download('excel')}>⬇ Excel</Button>
                <Button size="sm" variant="secondary" onClick={() => download('pdf')}>⬇ PDF</Button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2">Група</th>
                    <th className="text-right">Доходи</th>
                    <th className="text-right">Витрати</th>
                    <th className="text-right">Прибуток</th>
                    <th className="text-right">К-сть</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r) => (
                    <tr key={r.key} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-2">{r.label}</td>
                      <td className="text-right text-green-600">{formatMoney(r.income)}</td>
                      <td className="text-right text-red-600">{formatMoney(r.expense)}</td>
                      <td className={`text-right ${r.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(r.net)}</td>
                      <td className="text-right text-slate-500">{r.count}</td>
                    </tr>
                  ))}
                  {!report.rows.length && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Немає даних за період</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
