import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { Card, Spinner, Badge } from '../components/ui/index.jsx';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart.jsx';
import TopCategoriesChart from '../components/charts/TopCategoriesChart.jsx';
import { formatMoney, formatDate } from '../utils/format.js';
import { ACCOUNT_TYPE_LABELS } from '../utils/constants.js';

function Stat({ label, value, accent }) {
  return (
    <Card>
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>

      {/* Підсумки місяця */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Загальний баланс (UAH)" value={formatMoney(data.totalBalanceBase)} />
        <Stat label="Доходи за місяць" value={formatMoney(data.month.income)} accent="text-green-600" />
        <Stat label="Витрати за місяць" value={formatMoney(data.month.expense)} accent="text-red-600" />
        <Stat
          label="Прибуток за місяць"
          value={formatMoney(data.month.profit)}
          accent={data.month.profit >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Рахунки */}
      <Card title="Баланси по рахунках">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.accountBalances.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{a.name}</span>
                <Badge>{ACCOUNT_TYPE_LABELS[a.type]}</Badge>
              </div>
              <div className="mt-2 text-lg font-bold">{formatMoney(a.balance, a.currency)}</div>
              {a.currency !== 'UAH' && (
                <div className="text-xs text-slate-500">≈ {formatMoney(a.balanceBase)}</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Графіки */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Доходи vs Витрати (6 міс.)">
          <IncomeExpenseChart data={data.chart} />
        </Card>
        <Card title="Топ категорій витрат (місяць)">
          <TopCategoriesChart data={data.topCategories} />
        </Card>
      </div>

      {/* Останні транзакції */}
      <Card title="Останні транзакції">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-2">Дата</th>
                <th>Категорія</th>
                <th>Рахунок</th>
                <th>Хто</th>
                <th className="text-right">Сума</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="py-2">{formatDate(t.date)}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: t.category?.color }} />
                      {t.category?.name}
                    </span>
                  </td>
                  <td>{t.account?.name}</td>
                  <td className="text-slate-500">{t.createdBy?.name}</td>
                  <td className={`text-right font-medium ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '−'}{formatMoney(t.amount, t.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
