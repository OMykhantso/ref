import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';
import { formatNumber } from '../../utils/format.js';

export default function IncomeExpenseChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} width={70} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip formatter={(v) => formatNumber(v) + ' ₴'} />
        <Legend />
        <Bar dataKey="income" name="Доходи" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Витрати" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
